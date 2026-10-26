import { NextRequest, NextResponse } from "next/server";
import { getMatchBySlug } from "@/lib/repository/matches";

export const dynamic = "force-dynamic";

interface LiveScoreResponse {
  live: boolean;
  rawScore?: string;
  teamCode?: string | null;
  score?: string | null;
  overs?: string | null;
  batter1?: string | null;
  batter2?: string | null;
  bowler?: string | null;
  fullTitle?: string;
  updatedAt: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const match = await getMatchBySlug(slug);

    if (!match || !match.espnMatchPath) {
      return NextResponse.json({ live: false, message: "No live feed configured" });
    }

    const espnUrl = `https://www.espncricinfo.com${match.espnMatchPath}`;

    const res = await fetch(espnUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { live: false, error: `ESPN returned status ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);

    if (!titleMatch) {
      return NextResponse.json({ live: false, message: "No title found" });
    }

    const title = titleMatch[1];
    const parts = title.split(",").map((s) => s.trim());
    const scoreWithOvers = parts[0] || "";
    const batter1 = parts[1] || "";
    const batter2 = parts[2] || "";
    const bowler = parts[3] || "";

    const m = scoreWithOvers.match(
      /^([A-Za-z0-9]+)\s+([0-9]+\/[0-9]+|[0-9]+)\s*\(([^)]+)\)?/
    );

    const data: LiveScoreResponse = {
      live: true,
      rawScore: scoreWithOvers,
      teamCode: m ? m[1] : null,
      score: m ? m[2] : null,
      overs: m ? m[3].replace(/ov/i, "").trim() : null,
      batter1: batter1.includes("*") || batter1.includes("c ") || batter1.includes("b ") ? batter1 : null,
      batter2: batter2.includes("*") || batter2.includes("c ") || batter2.includes("b ") ? batter2 : null,
      bowler: bowler.includes("/") ? bowler : null,
      fullTitle: title,
      updatedAt: new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kathmandu" }),
    };

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching live score";
    return NextResponse.json({ live: false, error: msg }, { status: 500 });
  }
}
