/**
 * NPL Hub Nepal — Multi-Provider Editorial Pipeline Engine
 *
 * Orchestrates sequential execution of Stages 1 through 7 for a claimed job:
 * Stage 1: Tavily Search (Web discovery)
 * Stage 2: Tavily Extract (Full page source parsing)
 * Stage 3: Groq Dossier (Structured fact extraction & authority verification)
 * Stage 4: Gemini Journalism (Sports reporting tailored to ArticleType)
 * Stage 5: SEO & Linking (Canonical link injection & metadata generation)
 * Stage 6: Image Compositing (Cloudflare background or Sharp SVG fallback -> WebP upload)
 * Stage 7: Quality Gate & Draft Ingestion (11 invariants -> news_articles draft row)
 *
 * ZERO-COST GUARANTEE:
 * - If any provider hits quota limit (429/402), automatically pauses with `paused_quota_limit`.
 * - Never incurs any paid API charges under any circumstances.
 */

import {
  advanceJobStage,
  pauseEditorialJob,
  failEditorialJob,
  completeEditorialJob,
  renewJobLock,
} from "./jobs-repository";
import { searchTavily, extractTavily } from "../providers/tavily";
import { buildFactDossierWithGroq } from "../providers/groq";
import {
  generateArticleWithGemini,
  generateSeoMetadataWithGemini,
} from "../providers/gemini";
import { generateCloudflareBackground } from "../providers/cloudflare";
import { compositeEditorialFeatureImage } from "./image-compositor";
import { injectInternalLinks } from "./seo-linking";
import { validateQualityGate } from "./quality-gate";
import {
  QuotaExceededError,
  type EditorialJob,
  type PipelineStage,
  type ProviderCallTelemetry,
  type SourceDocument,
} from "./types";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export interface StageExecutionResult {
  jobId: string;
  previousStage: PipelineStage;
  nextStage?: PipelineStage;
  status: string;
  summary: string;
  error?: string;
}

/**
 * Look up official platform match scorecard from Supabase `matches` table
 * to serve as an authoritative primary source for match-related news articles.
 */
async function lookupPlatformMatchSource(topic: string): Promise<SourceDocument | null> {
  try {
    const admin = getSupabaseAdminClient();
    const lowerTopic = topic.toLowerCase();

    // Map common keywords to canonical team slugs
    const teamKeywords: Record<string, string> = {
      janakpur: "janakpur-bolts",
      pokhara: "pokhara-avengers",
      biratnagar: "biratnagar-kings",
      chitwan: "chitwan-rhinos",
      kathmandu: "kathmandu-gorkhas",
      karnali: "karnali-yaks",
      lumbini: "lumbini-lions",
      sudurpaschim: "sudurpaschim-royals",
    };

    const detectedTeams = Object.entries(teamKeywords)
      .filter(([kw]) => lowerTopic.includes(kw))
      .map(([, id]) => id);

    if (detectedTeams.length === 0) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (admin as any).from("matches").select("*");

    if (detectedTeams.length >= 2) {
      const [t1, t2] = detectedTeams;
      query = query.or(
        `and(team1_id.eq.${t1},team2_id.eq.${t2}),and(team1_id.eq.${t2},team2_id.eq.${t1})`
      );
    } else {
      query = query.or(`team1_id.eq.${detectedTeams[0]},team2_id.eq.${detectedTeams[0]}`);
    }

    const { data: matches, error } = await query
      .order("match_number", { ascending: false })
      .limit(1);

    if (error || !matches || matches.length === 0) return null;

    const match = matches[0];
    const team1Name = match.team1_id
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
    const team2Name = match.team2_id
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    const t1Score = match.scores?.team1
      ? `${match.scores.team1.runs}/${match.scores.team1.wickets} (${match.scores.team1.overs} ov)`
      : "Score Pending";
    const t2Score = match.scores?.team2
      ? `${match.scores.team2.runs}/${match.scores.team2.wickets} (${match.scores.team2.overs} ov)`
      : "Score Pending";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topBatters = (match.scores?.batters || [])
      .slice(0, 4)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((b: any) => `${b.name} ${b.runs} (${b.balls})`)
      .join(", ");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topBowlers = (match.scores?.bowlers || [])
      .slice(0, 4)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((b: any) => `${b.name} ${b.wickets}/${b.runs} (${b.overs} ov)`)
      .join(", ");

    const rawContent = `OFFICIAL NEPAL PREMIER LEAGUE MATCH RESULT & SCORECARD (PRIMARY RECORD)
Match Number: Match ${match.match_number}
Tournament: Nepal Premier League 2026 (Season 3)
Stage: ${match.stage}
Date: ${match.formatted_date || match.match_date} (${match.day_of_week || ""})
Venue: ${match.venue || "TU International Cricket Ground, Kirtipur"}
Match Status: ${match.status.toUpperCase()}
Official Result: ${match.result_statement || match.result || "Match concluded"}
Winner: ${match.winner_name || "Official Result Confirmed"} by ${match.win_margin || ""} ${match.win_type || ""}
1st Innings (${team1Name}): ${t1Score}
2nd Innings (${team2Name}): ${t2Score}
${topBatters ? `Key Batting: ${topBatters}` : ""}
${topBowlers ? `Key Bowling: ${topBowlers}` : ""}
Data Authority: Verified Official NPL Match Scorecard (Cricket Association of Nepal / NPL Hub Primary Record).`;

    return {
      url: `https://nplhubnepal.com/matches/${match.slug}`,
      title: `Official Match Scorecard: ${team1Name} vs ${team2Name} (Match ${match.match_number})`,
      snippet: `Official NPL Scorecard for Match ${match.match_number}: ${match.result_statement || match.result}. ${team1Name} (${t1Score}) vs ${team2Name} (${t2Score}).`,
      raw_content: rawContent,
      domain: "nplhubnepal.com",
      published_date: match.match_date,
      authority_type: "primary",
    };
  } catch (err) {
    console.warn("[lookupPlatformMatchSource] Could not lookup platform match:", err);
    return null;
  }
}

/**
 * Executes exactly ONE stage for a claimed editorial job.
 */
export async function executeSingleJobStage(
  job: EditorialJob,
  workerToken: string
): Promise<StageExecutionResult> {
  const currentStage = job.current_stage;
  const stageData = job.stage_data || {};
  const newTelemetryCalls: ProviderCallTelemetry[] = [];

  try {
    // Extend lock immediately before running stage
    await renewJobLock(job.id, workerToken);

    switch (currentStage) {
      // -----------------------------------------------------------------------
      // STAGE 1: SEARCH (Tavily)
      // -----------------------------------------------------------------------
      case 1: {
        const queryParts = [job.topic];
        if (!job.topic.toLowerCase().includes("nepal premier league") && !job.topic.toLowerCase().includes("npl")) {
          queryParts.push("Nepal Premier League cricket");
        }
        if (job.target_keyword) {
          queryParts.push(job.target_keyword);
        }
        const searchQuery = queryParts.join(" ").trim();
        const { documents, latencyMs } = await searchTavily(searchQuery, {
          maxResults: 6,
          searchDepth: "basic",
        });

        // Check if an official platform scorecard exists for this fixture
        const platformMatchDoc = await lookupPlatformMatchSource(job.topic);
        const allDocuments = platformMatchDoc ? [platformMatchDoc, ...documents] : documents;

        newTelemetryCalls.push({
          provider: "tavily",
          operation: "search",
          model_id: "tavily-basic-search",
          cost_usd: 0,
          latency_ms: latencyMs,
          timestamp: new Date().toISOString(),
        });

        if (!allDocuments.length) {
          await pauseEditorialJob(
            job.id,
            workerToken,
            "paused_insufficient_evidence",
            "No web sources or scorecards found for topic."
          );
          return {
            jobId: job.id,
            previousStage: 1,
            status: "paused_insufficient_evidence",
            summary: "Search completed with 0 sources found. Job paused.",
          };
        }

        await advanceJobStage(
          job.id,
          workerToken,
          2,
          { search_results: allDocuments },
          { calls: newTelemetryCalls }
        );

        return {
          jobId: job.id,
          previousStage: 1,
          nextStage: 2,
          status: "running",
          summary: `Stage 1 Search completed: found ${allDocuments.length} sources${platformMatchDoc ? " (including official platform scorecard)" : ""}.`,
        };
      }

      // -----------------------------------------------------------------------
      // STAGE 2: EXTRACT (Tavily)
      // -----------------------------------------------------------------------
      case 2: {
        const searchDocs = stageData.search_results || [];
        const platformDoc = searchDocs.find((d) => d.authority_type === "primary" && d.raw_content);
        const webDocs = searchDocs.filter((d) => d !== platformDoc);

        const articleDocs = webDocs.filter(
          (d) =>
            !d.url.includes("youtube.com") &&
            !d.url.includes("facebook.com") &&
            !d.url.includes("twitter.com") &&
            !d.url.includes("x.com") &&
            !d.url.includes("instagram.com")
        );
        const candidateDocs = articleDocs.length >= 2 ? articleDocs : webDocs;
        const topUrls = candidateDocs.slice(0, 3).map((d) => d.url);

        const { documents: extractedDocs, latencyMs } = await extractTavily(topUrls);

        newTelemetryCalls.push({
          provider: "tavily",
          operation: "extract",
          model_id: "tavily-extract",
          cost_usd: 0,
          latency_ms: latencyMs,
          timestamp: new Date().toISOString(),
        });

        // Merge raw content into search documents (platform primary doc already has raw_content)
        const mergedDocs = searchDocs.map((sd) => {
          if (sd.raw_content) return sd;
          const match = extractedDocs.find((ed) => ed.url === sd.url);
          return match ? { ...sd, raw_content: match.raw_content } : sd;
        });

        await advanceJobStage(
          job.id,
          workerToken,
          3,
          { extracted_docs: mergedDocs },
          { calls: newTelemetryCalls }
        );

        return {
          jobId: job.id,
          previousStage: 2,
          nextStage: 3,
          status: "running",
          summary: `Stage 2 Extract completed: extracted ${extractedDocs.length} full-page sources${platformDoc ? " + official platform scorecard" : ""}.`,
        };
      }

      // -----------------------------------------------------------------------
      // STAGE 3: FACT DOSSIER & VERIFICATION (Groq)
      // -----------------------------------------------------------------------
      case 3: {
        const docs = stageData.extracted_docs || stageData.search_results || [];
        if (!docs.length) {
          await pauseEditorialJob(
            job.id,
            workerToken,
            "paused_insufficient_evidence",
            "No source documents available to build Fact Dossier."
          );
          return {
            jobId: job.id,
            previousStage: 3,
            status: "paused_insufficient_evidence",
            summary: "No source documents found. Job paused.",
          };
        }

        const { dossier, tokensUsed, latencyMs, modelUsed } =
          await buildFactDossierWithGroq(job.topic, docs, job.article_type);

        newTelemetryCalls.push({
          provider: "groq",
          operation: "fact_dossier",
          model_id: modelUsed,
          tokens_output: tokensUsed,
          cost_usd: 0,
          latency_ms: latencyMs,
          timestamp: new Date().toISOString(),
        });

        if (!dossier.is_sufficient) {
          await pauseEditorialJob(
            job.id,
            workerToken,
            "paused_insufficient_evidence",
            dossier.sufficiency_reason || "Insufficient verified evidence to draft an article."
          );
          return {
            jobId: job.id,
            previousStage: 3,
            status: "paused_insufficient_evidence",
            summary: `Dossier built but insufficient: ${dossier.sufficiency_reason}`,
          };
        }

        await advanceJobStage(
          job.id,
          workerToken,
          4,
          { dossier },
          {
            calls: newTelemetryCalls,
            total_tokens: (job.telemetry?.total_tokens || 0) + tokensUsed,
          }
        );

        const verifiedCount = dossier.claims.filter(
          (c) => c.verification_status === "verified"
        ).length;

        return {
          jobId: job.id,
          previousStage: 3,
          nextStage: 4,
          status: "running",
          summary: `Stage 3 Dossier completed: ${verifiedCount} verified claims, ${dossier.conflicts.length} conflicts.`,
        };
      }

      // -----------------------------------------------------------------------
      // STAGE 4: JOURNALISM GENERATION (Gemini)
      // -----------------------------------------------------------------------
      case 4: {
        const dossier = stageData.dossier;
        if (!dossier) {
          throw new Error("Fact dossier missing for Stage 4 generation.");
        }

        const { draft, tokensUsed, latencyMs, modelUsed } =
          await generateArticleWithGemini(job.topic, job.article_type, dossier);

        newTelemetryCalls.push({
          provider: "gemini",
          operation: "article_drafting",
          model_id: modelUsed,
          tokens_output: tokensUsed,
          cost_usd: 0,
          latency_ms: latencyMs,
          timestamp: new Date().toISOString(),
        });

        await advanceJobStage(
          job.id,
          workerToken,
          5,
          { draft },
          {
            calls: newTelemetryCalls,
            total_tokens: (job.telemetry?.total_tokens || 0) + tokensUsed,
          }
        );

        return {
          jobId: job.id,
          previousStage: 4,
          nextStage: 5,
          status: "running",
          summary: `Stage 4 Journalism completed: "${draft.title}" (${draft.word_count} words).`,
        };
      }

      // -----------------------------------------------------------------------
      // STAGE 5: SEO & INTERNAL LINKING (Gemini & Canonical Linking)
      // -----------------------------------------------------------------------
      case 5: {
        const draft = stageData.draft;
        if (!draft) {
          throw new Error("Article draft missing for Stage 5 SEO optimization.");
        }

        // 1. Injected internal links into paragraph blocks
        const { blocks: linkedBlocks, linksInjected } = injectInternalLinks(draft.blocks, 5);
        draft.blocks = linkedBlocks;

        // 2. Generate SEO keywords and meta tags
        const { seo, tokensUsed, latencyMs, modelUsed } =
          await generateSeoMetadataWithGemini(draft, job.target_keyword);

        seo.internal_links_injected = linksInjected;

        newTelemetryCalls.push({
          provider: "gemini",
          operation: "seo_metadata",
          model_id: modelUsed,
          tokens_output: tokensUsed,
          cost_usd: 0,
          latency_ms: latencyMs,
          timestamp: new Date().toISOString(),
        });

        await advanceJobStage(
          job.id,
          workerToken,
          6,
          { draft, seo },
          {
            calls: newTelemetryCalls,
            total_tokens: (job.telemetry?.total_tokens || 0) + tokensUsed,
          }
        );

        return {
          jobId: job.id,
          previousStage: 5,
          nextStage: 6,
          status: "running",
          summary: `Stage 5 SEO completed: injected ${linksInjected} canonical links, focus keyword: "${seo.focus_keyword}".`,
        };
      }

      // -----------------------------------------------------------------------
      // STAGE 6: FEATURE IMAGE COMPOSITING (Cloudflare / Local Sharp SVG)
      // -----------------------------------------------------------------------
      case 6: {
        const draft = stageData.draft;
        if (!draft) {
          throw new Error("Article draft missing for Stage 6 image composition.");
        }

        // 1. Optional Cloudflare background generation
        const { imageBuffer, latencyMs: cfLatency } =
          await generateCloudflareBackground(job.topic);

        if (imageBuffer) {
          newTelemetryCalls.push({
            provider: "cloudflare",
            operation: "flux_background",
            model_id: "@cf/black-forest-labs/flux-1-schnell",
            cost_usd: 0,
            latency_ms: cfLatency,
            timestamp: new Date().toISOString(),
          });
        }

        // 2. Composite branded 1200x675 WebP with team crests and typography
        const startTime = Date.now();
        const imageResult = await compositeEditorialFeatureImage({
          title: draft.title,
          category: draft.category,
          teamIds: draft.team_ids,
          articleId: toSlug(draft.title),
          backgroundBuffer: imageBuffer,
        });

        newTelemetryCalls.push({
          provider: "sharp",
          operation: "webp_composition",
          model_id: "sharp-local",
          cost_usd: 0,
          latency_ms: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });

        await advanceJobStage(
          job.id,
          workerToken,
          7,
          { image: imageResult },
          { calls: newTelemetryCalls }
        );

        return {
          jobId: job.id,
          previousStage: 6,
          nextStage: 7,
          status: "running",
          summary: `Stage 6 Image completed: generated ${imageResult.generator_used} feature image (${imageResult.image_url}).`,
        };
      }

      // -----------------------------------------------------------------------
      // STAGE 7: QUALITY GATE & DRAFT INGESTION
      // -----------------------------------------------------------------------
      case 7: {
        const draft = stageData.draft;
        const seo = stageData.seo;
        const image = stageData.image;
        const dossier = stageData.dossier;

        if (!draft || !seo || !image || !dossier) {
          throw new Error("Missing required stage artifacts for Stage 7 quality gate.");
        }

        // 1. Verify hard quality invariants (genre-aware)
        const validation = validateQualityGate({
          draft,
          seo,
          image,
          dossier,
          articleType: job.article_type,
          status: "draft",
          ai_generated: true,
        });

        if (!validation.passed) {
          const violationSummary = validation.violations.join(" | ");
          await failEditorialJob(
            job.id,
            workerToken,
            `Quality Gate Rejected: ${violationSummary}`
          );
          return {
            jobId: job.id,
            previousStage: 7,
            status: "failed",
            summary: "Quality Gate rejected draft.",
            error: violationSummary,
          };
        }

        // 2. Ingest draft article into news_articles table
        const timestampSuffix = Date.now().toString(36);
        const slug = `${toSlug(draft.title)}-${timestampSuffix}`;
        const admin = getSupabaseAdminClient();

        // Primary source attribution
        const primarySource = dossier.claims.find((c) => c.source_type === "primary");
        const sourceUrl = primarySource?.source_urls?.[0] || dossier.claims[0]?.source_urls?.[0] || "";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (admin as any)
          .from("news_articles")
          .insert({
            id: slug,
            slug,
            title: draft.title,
            excerpt: draft.excerpt,
            content: { blocks: draft.blocks },
            category: draft.category,
            status: "draft", // Strictly draft
            featured: false,
            image_url: image.image_url,
            image_alt: image.image_alt,
            image_caption: image.image_caption,
            author: "NPL Hub Editorial Desk",
            author_role: "Sports Journalism Desk",
            read_time: draft.read_time,
            tags: draft.suggested_tags,
            source: "NPL Hub Multi-Provider Pipeline",
            source_url: sourceUrl,
            published_at: new Date().toISOString(),
            ai_generated: true,
            focus_keyword: seo.focus_keyword,
            secondary_keywords: seo.secondary_keywords,
          });

        if (insertError) {
          throw new Error(`Failed to insert news draft: ${insertError.message}`);
        }

        // 3. Link team relations if teams detected
        if (draft.team_ids && draft.team_ids.length > 0) {
          const relations = draft.team_ids.map((teamId) => ({
            article_id: slug,
            team_id: teamId,
          }));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin as any)
            .from("news_team_relations")
            .insert(relations);
        }

        // 4. Mark job completed
        await completeEditorialJob(
          job.id,
          workerToken,
          slug,
          { published_article_id: slug },
          { calls: newTelemetryCalls }
        );

        return {
          jobId: job.id,
          previousStage: 7,
          status: "completed",
          summary: `Stage 7 Completed: Draft "${draft.title}" ingested as draft (${slug}).`,
        };
      }

      default:
        throw new Error(`Invalid stage number: ${currentStage}`);
    }
  } catch (err: unknown) {
    if (err instanceof QuotaExceededError) {
      // Automatic pause on any free-quota exhaustion without billing charges
      await pauseEditorialJob(
        job.id,
        workerToken,
        "paused_quota_limit",
        err.message
      );
      return {
        jobId: job.id,
        previousStage: currentStage,
        status: "paused_quota_limit",
        summary: `Zero-Cost Safety: Job paused due to ${err.provider.toUpperCase()} free quota limit.`,
        error: err.message,
      };
    }

    const message = err instanceof Error ? err.message : "Unexpected pipeline error";
    await failEditorialJob(job.id, workerToken, `[Stage ${currentStage}] ${message}`);

    return {
      jobId: job.id,
      previousStage: currentStage,
      status: "failed",
      summary: `Failed at Stage ${currentStage}: ${message}`,
      error: message,
    };
  }
}
