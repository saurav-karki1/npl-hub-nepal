import { NextRequest, NextResponse } from "next/server";
import { getMatchBySlug } from "@/lib/repository/matches";
import {
  getMatchCommentary,
  generateCommentaryForEvent,
  getSampleCommentaryEvents,
  CommentaryEvent,
} from "@/lib/ai-commentary";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const match = await getMatchBySlug(slug);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const commentary = await getMatchCommentary(match.id);

    return NextResponse.json({
      matchId: match.id,
      matchSlug: slug,
      count: commentary.length,
      commentary,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching commentary";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const match = await getMatchBySlug(slug);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const body = await req.json();

    // If sandbox / test generation requested
    if (body.simulateSample) {
      const sampleEvents = getSampleCommentaryEvents(match.id);
      const generated = [];
      for (const ev of sampleEvents) {
        const item = await generateCommentaryForEvent(ev);
        generated.push(item);
      }
      return NextResponse.json({
        success: true,
        generatedCount: generated.length,
        items: generated,
      });
    }

    // Process a specific verified event
    const event: CommentaryEvent = {
      matchId: match.id,
      eventId: body.eventId || `${match.id}_${Date.now()}`,
      eventType: body.eventType || "ball",
      overNumber: Number(body.overNumber) || 0,
      ballNumber: Number(body.ballNumber) || 0,
      batterName: body.batterName,
      bowlerName: body.bowlerName,
      battingTeamName: body.battingTeamName,
      bowlingTeamName: body.bowlingTeamName,
      runs: Number(body.runs) || 0,
      isWicket: Boolean(body.isWicket),
      wicketType: body.wicketType,
      isBoundary: Boolean(body.isBoundary),
      isSix: Boolean(body.isSix),
      totalScoreDescription: body.totalScoreDescription || "",
      contextNote: body.contextNote,
    };

    const output = await generateCommentaryForEvent(event);

    return NextResponse.json({
      success: true,
      commentary: output,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error generating commentary";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
