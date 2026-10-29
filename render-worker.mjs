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
      const testUrl = "https://www.espncricinfo.com/series/a-1558581/b-1558586/ball-by-ball-commentary";
      const espnRes = await fetch(testUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://www.espncricinfo.com/",
        },
      });
      const text = await espnRes.text();
      const hasNextData = text.includes('id="__NEXT_DATA__"');
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          espnStatus: espnRes.status,
          hasNextData,
          bodyLength: text.length,
          bodySnippet: text.slice(0, 300),
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

// 2. Background Continuous Sync Loop
async function runCloudLoop() {
  console.log("[RENDER WORKER] Started 24/7 live sync background loop...");

  while (true) {
    try {
      // Find matches with status 'live'
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

      // Also inspect next upcoming match to auto-detect start
      const { data: upcomingMatches } = await sb
        .from("matches")
        .select("id,match_number,status")
        .eq("status", "upcoming")
        .order("match_number", { ascending: true })
        .limit(1);

      if (upcomingMatches && upcomingMatches.length > 0) {
        const nextNum = upcomingMatches[0].match_number;
        if (!matchesToSync.includes(nextNum)) {
          matchesToSync.push(nextNum);
        }
      }

      for (const mNum of matchesToSync) {
        await syncMatch(mNum);
      }

      syncCount++;
      lastSyncAt = new Date().toISOString();
      lastSyncedMatches = matchesToSync;
      lastSyncError = null;
    } catch (err) {
      lastSyncError = err?.message || String(err);
      console.error("[RENDER WORKER] Sync error:", lastSyncError);
    }

    // Wait 15 seconds before next polling cycle
    await new Promise((r) => setTimeout(r, 15000));
  }
}

runCloudLoop();
