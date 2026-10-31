/**
 * NPL Hub Nepal — Render Cloud 24/7 Live Sync Worker
 *
 * Runs 24/7 on Render's free tier with ZERO laptop dependency.
 * Binds a lightweight HTTP health check on PORT so Render keeps it alive,
 * and runs the continuous cricket live sync loop in the background.
 */

import http from "node:http";
import { createClient } from "@supabase/supabase-js";
import { syncMatch } from "./scripts/live-sync-score.mjs";

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zohmcgjixebuiconrven.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaG1jZ2ppeGVidWljb25ydmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxMDU5NCwiZXhwIjoyMTA2MTg2NTk0fQ.gvchNbBCDUdijT58NCpbwAQJSRcgPfyphmBvHhIX0Gw";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Telemetry state for transparency
let syncCount = 0;
let lastSyncAt = null;
let lastSyncedMatches = [];
let lastSyncError = null;

// 1. Lightweight HTTP server for Render health checks and uptime pinging
const server = http.createServer(async (req, res) => {
  if (req.url === "/diag" || req.url === "/diagnostics") {
    try {
      const testUrl = "https://site.api.espn.com/apis/site/v2/sports/cricket/1558581/scoreboard";
      const espnRes = await fetch(testUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const data = await espnRes.json();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          espnStatus: espnRes.status,
          eventsCount: data.events ? data.events.length : 0,
          events: (data.events || []).map((e) => ({
            id: e.id,
            name: e.name,
            state: e.status?.type?.state,
            summary: e.competitions?.[0]?.status?.summary || e.status?.type?.description,
          })),
        })
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      service: "npl-cloud-live-sync",
      status: "online",
      uptimeSeconds: Math.floor(process.uptime()),
      syncCount,
      lastSyncAt,
      lastSyncedMatches,
      lastSyncError,
      timestamp: new Date().toISOString(),
    })
  );
});

server.listen(PORT, () => {
  console.log(`[RENDER WORKER] Health check server listening on port ${PORT}`);
});

// 2. Background Continuous Sync Loop with Adaptive Polling
async function runCloudLoop() {
  console.log("[RENDER WORKER] Started adaptive 24/7 live sync background loop...");

  let lastHeartbeatTime = 0;
  const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  while (true) {
    let nextSleepMs = 15000; // default 15s for live matches

    try {
      // 1. Check if any matches are currently marked 'live'
      const { data: liveMatches, error: liveErr } = await sb
        .from("matches")
        .select("id,match_number,status")
        .eq("status", "live");

      if (liveErr) {
        lastSyncError = `Supabase liveMatches error: ${liveErr.message}`;
      }

      let matchesToSync = (liveMatches && liveMatches.length > 0)
        ? liveMatches.map((m) => m.match_number)
        : [];

      if (matchesToSync.length > 0) {
        // MATCH IS LIVE! Keep maximum real-time precision (15s polling)
        nextSleepMs = 15000;
        for (const mNum of matchesToSync) {
          await syncMatch(mNum);
        }
      } else {
        // NO MATCH IS LIVE: Inspect the next upcoming match to determine proximity
        const { data: upcomingMatches } = await sb
          .from("matches")
          .select("id,match_number,match_date,match_time,status")
          .eq("status", "upcoming")
          .order("match_number", { ascending: true })
          .limit(1);

        if (upcomingMatches && upcomingMatches.length > 0) {
          const nextMatch = upcomingMatches[0];
          const nextNum = nextMatch.match_number;

          // Estimate time until scheduled kickoff (Nepal Time UTC+5:45)
          let msUntilKickoff = Infinity;
          try {
            if (nextMatch.match_date && nextMatch.match_time) {
              const timeMatch = nextMatch.match_time.match(/(\d+):(\d+)\s*(AM|PM)/i);
              if (timeMatch) {
                let hours = parseInt(timeMatch[1], 10);
                const minutes = parseInt(timeMatch[2], 10);
                const isPM = timeMatch[3].toUpperCase() === "PM";
                if (isPM && hours < 12) hours += 12;
                if (!isPM && hours === 12) hours = 0;

                const nptIso = `${nextMatch.match_date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:45`;
                const kickoffTime = new Date(nptIso).getTime();
                if (!isNaN(kickoffTime)) {
                  msUntilKickoff = kickoffTime - Date.now();
                }
              }
            }
          } catch {
            msUntilKickoff = 0;
          }

          if (msUntilKickoff <= 30 * 60 * 1000) {
            // Kickoff is within 30 minutes (or already passed): poll ESPN every 60s
            nextSleepMs = 60000;
            matchesToSync.push(nextNum);
            await syncMatch(nextNum);
          } else {
            // Match is hours/days away: sleep 5 minutes (300,000 ms)
            nextSleepMs = 300000;
            console.log(`[RENDER WORKER] Next match M#${nextNum} in ${Math.round(msUntilKickoff / 60000)}m. Sleeping 5m.`);
          }
        } else {
          // No upcoming matches (season finished): sleep 15 minutes
          nextSleepMs = 900000;
        }
      }

      syncCount++;
      lastSyncAt = new Date().toISOString();
      lastSyncedMatches = matchesToSync;
      lastSyncError = null;
    } catch (err) {
      lastSyncError = err?.message || String(err);
      console.error("[RENDER WORKER] Sync error:", lastSyncError);
    }

    // Write heartbeat telemetry to Supabase agent_config (throttled to every 10 mins or on error or live match)
    const nowMs = Date.now();
    const shouldSendHeartbeat =
      nowMs - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS ||
      lastSyncError !== null ||
      lastSyncedMatches.length > 0;

    if (shouldSendHeartbeat) {
      try {
        const now = new Date().toISOString();
        await sb.from("agent_config").upsert({
          id: "live-sync-worker",
          enabled: true,
          interval_hours: 1,
          sources: {
            worker: "render",
            status: lastSyncError ? "error" : "running",
            lastPollAt: now,
            lastSyncAt: lastSyncAt,
            syncCount: syncCount,
            lastError: lastSyncError,
            uptimeSeconds: Math.floor(process.uptime()),
            syncedMatches: lastSyncedMatches,
            pollingIntervalSeconds: Math.round(nextSleepMs / 1000),
          },
          last_run_at: now,
          updated_at: now,
        });
        lastHeartbeatTime = nowMs;
      } catch (hbErr) {
        console.warn("[RENDER WORKER] Heartbeat error:", hbErr?.message);
      }
    }

    // Adaptive sleep
    await new Promise((r) => setTimeout(r, nextSleepMs));
  }
}

runCloudLoop();
