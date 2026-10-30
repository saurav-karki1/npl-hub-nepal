/**
 * NPL Hub Nepal — Admin Cricket Provider & Pipeline Status API
 *
 * GET /api/admin/cricket/status
 * Returns verified live cricket pipeline status:
 * - Provider: ESPN Live Cricket API (series 1558581)
 * - Render Background Worker health (heartbeat / HTTP probe)
 * - Actual Supabase database counts (matches, live, completed, ball-by-ball commentary)
 *
 * Distinguishes between:
 * - Worker running successfully (Green)
 * - Worker reachable but synchronization failing (Red/Warning)
 * - Worker not responding / Stopped (Red)
 * - No recent synchronization / Delayed (Yellow)
 * - Unknown / Not verified (Gray)
 *
 * Requires a valid Supabase Auth session token.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function verifyAuthSession(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header.");
  }
  const token = authHeader.slice(7);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!anonKey) throw new Error("Supabase public key is not configured.");
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid or expired session token.");
  return data.user;
}

export async function GET(req: NextRequest) {
  try {
    await verifyAuthSession(req);
    const admin = getSupabaseAdminClient();

    // 1. Retrieve actual database counts from Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [matchesRes, liveRes, compRes, commentaryRes, lastCommRes, agentConfigRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any).from("matches").select("*", { count: "exact", head: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any).from("matches").select("*", { count: "exact", head: true }).eq("status", "live"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any).from("matches").select("*", { count: "exact", head: true }).eq("status", "completed"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any).from("match_commentary").select("*", { count: "exact", head: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any).from("match_commentary").select("created_at").order("created_at", { ascending: false }).limit(1),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any).from("agent_config").select("*").eq("id", "live-sync-worker").maybeSingle(),
    ]);

    const totalMatches = matchesRes.count ?? 0;
    const liveMatches = liveRes.count ?? 0;
    const completedMatches = compRes.count ?? 0;
    const ballByBallEvents = commentaryRes.count ?? 0;
    const lastCommentaryAt = lastCommRes.data?.[0]?.created_at || null;

    // 2. Evaluate Worker Health & Telemetry
    let workerStatus: "running" | "delayed" | "error" | "stopped" | "unknown" = "unknown";
    let statusLabel = "Unknown / Not Verified";
    let indicatorColor: "green" | "yellow" | "red" | "gray" = "gray";
    let message = "Background worker status has not been verified yet.";
    let lastPollAt: string | null = null;
    let lastSuccessfulSync: string | null = lastCommentaryAt;
    let uptimeSeconds: number | null = null;
    let syncCount = 0;
    let lastError: string | null = null;
    let pingSource: "http-probe" | "database-heartbeat" | "unknown" = "unknown";

    // A. Check Render Worker direct HTTP endpoint if RENDER_WORKER_URL is configured
    const renderWorkerUrl = process.env.RENDER_WORKER_URL;
    let httpProbeSuccess = false;

    if (renderWorkerUrl) {
      try {
        const probeRes = await fetch(renderWorkerUrl.replace(/\/$/, ""), {
          signal: AbortSignal.timeout(3500),
          headers: { "User-Agent": "NPLHub-Admin-Dashboard/1.0" },
        });
        if (probeRes.ok) {
          const probeData = await probeRes.json();
          httpProbeSuccess = true;
          pingSource = "http-probe";
          lastPollAt = probeData.timestamp || new Date().toISOString();
          if (probeData.lastSyncAt) lastSuccessfulSync = probeData.lastSyncAt;
          uptimeSeconds = probeData.uptimeSeconds ?? null;
          syncCount = probeData.syncCount ?? 0;
          lastError = probeData.lastSyncError || null;

          if (probeData.lastSyncError) {
            workerStatus = "error";
            statusLabel = "Error";
            indicatorColor = "red";
            message = `Worker reachable but synchronization failing: ${probeData.lastSyncError}`;
          } else {
            workerStatus = "running";
            statusLabel = "Running";
            indicatorColor = "green";
            message = `Worker online and healthy on Render (uptime: ${Math.floor((probeData.uptimeSeconds || 0) / 60)}m, syncs: ${syncCount})`;
          }
        } else {
          workerStatus = "error";
          statusLabel = "Error";
          indicatorColor = "red";
          message = `Worker returned HTTP ${probeRes.status} on Render.`;
        }
      } catch {
        // HTTP unreachable, fallback to DB heartbeat
      }
    }

    // B. If HTTP probe did not resolve, check database heartbeat from agent_config
    if (!httpProbeSuccess) {
      const hbRow = agentConfigRes.data;
      if (hbRow && hbRow.sources) {
        pingSource = "database-heartbeat";
        const sources = typeof hbRow.sources === "object" ? hbRow.sources : {};
        lastPollAt = sources.lastPollAt || hbRow.last_run_at || hbRow.updated_at || null;
        if (sources.lastSyncAt) {
          lastSuccessfulSync = sources.lastSyncAt;
        } else if (!lastSuccessfulSync && lastCommentaryAt) {
          lastSuccessfulSync = lastCommentaryAt;
        }
        uptimeSeconds = typeof sources.uptimeSeconds === "number" ? sources.uptimeSeconds : null;
        syncCount = typeof sources.syncCount === "number" ? sources.syncCount : 0;
        lastError = sources.lastError || null;

        if (lastPollAt) {
          const pollAgeMs = Date.now() - new Date(lastPollAt).getTime();
          const oneMinuteMs = 60 * 1000;
          const fiveMinutesMs = 5 * 60 * 1000;

          if (pollAgeMs <= oneMinuteMs) {
            // Heartbeat received within last 60 seconds
            if (lastError) {
              workerStatus = "error";
              statusLabel = "Error";
              indicatorColor = "red";
              message = `Worker reachable but synchronization failing: ${lastError}`;
            } else {
              workerStatus = "running";
              statusLabel = "Running";
              indicatorColor = "green";
              message = `Worker running successfully (last heartbeat ${Math.max(1, Math.round(pollAgeMs / 1000))}s ago)`;
            }
          } else if (pollAgeMs <= fiveMinutesMs) {
            // Heartbeat delayed (between 1 and 5 minutes)
            workerStatus = "delayed";
            statusLabel = "Delayed";
            indicatorColor = "yellow";
            message = `No recent synchronization (last heartbeat was ${Math.round(pollAgeMs / 1000)}s ago)`;
          } else {
            // Stale heartbeat (> 5 minutes ago)
            workerStatus = "stopped";
            statusLabel = "Stopped";
            indicatorColor = "red";
            message = `Worker not responding (no heartbeat received for ${Math.round(pollAgeMs / 60000)} minutes)`;
          }
        }
      } else {
        // No heartbeat recorded yet
        workerStatus = "unknown";
        statusLabel = "Unknown";
        indicatorColor = "gray";
        message = "No worker heartbeat verified yet. Trigger a sync or start the Render worker.";
      }
    }

    return NextResponse.json({
      provider: {
        name: "ESPN",
        displayName: "ESPN Live Cricket API",
        seriesId: "1558581",
        engine: "live-sync-core",
        workerType: "Render Background Worker",
        database: "Supabase Database",
      },
      worker: {
        status: workerStatus,
        statusLabel,
        indicatorColor,
        message,
        lastPollAt,
        lastSuccessfulSync,
        uptimeSeconds,
        syncCount,
        lastError,
        source: pingSource,
      },
      database: {
        connected: !matchesRes.error,
        totalMatches,
        liveMatches,
        completedMatches,
        ballByBallEvents,
        lastCommentaryAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}
