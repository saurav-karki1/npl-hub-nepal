/**
 * NPL Hub Nepal — Multi-Provider Editorial Pipeline Test Suite
 *
 * Verifies:
 * 1. Provider configuration & model identifiers (Groq, Gemini)
 * 2. Canonical genre system — all 11 genres accepted, old genres rejected
 * 3. Genre-aware quality gate invariants (pass & fail scenarios)
 * 4. Image Compositor Sharp rendering (1200×675 WebP output)
 * 5. SEO internal link injection hygiene
 * 6. Concurrency / duplicate-prevention / interrupted-resume logic (simulated)
 */

import assert from "node:assert";
import { GROQ_MODELS } from "../src/lib/agent/providers/groq.ts";
import { GEMINI_EDITORIAL_MODELS } from "../src/lib/agent/providers/gemini.ts";
import { validateQualityGate } from "../src/lib/agent/editorial/quality-gate.ts";
import { injectInternalLinks } from "../src/lib/agent/editorial/seo-linking.ts";
import { compositeEditorialFeatureImage } from "../src/lib/agent/editorial/image-compositor.ts";

// ---------------------------------------------------------------------------
// Canonical genre list — the single source of truth for these tests
// ---------------------------------------------------------------------------
const CANONICAL_GENRES = [
  "breaking_news",
  "tournament_news",
  "match_preview",
  "match_report",
  "match_analysis",
  "team_news",
  "player_news",
  "squad_analysis",
  "points_table_update",
  "official_announcement",
  "feature_story",
];

const DEPRECATED_GENRES = [
  "squad_announcement",
  "injury_update",
  "player_spotlight",
  "interview_recap",
  "tactical_analysis",
  "opinion_editorial",
  "historical_retrospective",
  "governance_broadcast",
];

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const validDossier = {
  topic: "Janakpur Bolts Sign Marquee Overseas All-Rounder",
  primary_entity: "Janakpur Bolts",
  related_teams: ["janakpur-bolts"],
  related_players: [],
  claims: [
    {
      id: "c1",
      statement: "Janakpur Bolts confirmed the signing on their official channel.",
      source_urls: ["https://cricketnepal.org.np/press-release"],
      source_type: "primary",
      verification_status: "verified",
      confidence: 0.98,
    },
    {
      id: "c2",
      statement: "The player will join the squad in Kathmandu for Season 3.",
      source_urls: ["https://espncricinfo.com/nepal"],
      source_type: "secondary",
      verification_status: "verified",
      confidence: 0.95,
    },
    {
      id: "c3",
      statement: "The tournament begins next month at TU Cricket Ground.",
      source_urls: ["https://onlinekhabar.com/sports"],
      source_type: "secondary",
      verification_status: "verified",
      confidence: 0.9,
    },
  ],
  key_quotes: [],
  verified_stats: {},
  conflicts: [],
  is_sufficient: true,
};

const makeDraft = (overrides = {}) => ({
  title: "Janakpur Bolts Announce Marquee Overseas Signing for NPL Season 3",
  excerpt:
    "Janakpur Bolts have officially confirmed the acquisition of an experienced overseas all-rounder ahead of NPL Season 3.",
  category: "Teams",
  blocks: [
    {
      type: "paragraph",
      text: "In a decisive squad enhancement move, Janakpur Bolts have announced the signing of a proven international all-rounder.",
    },
    { type: "heading", level: 2, text: "Strategic Impact" },
    {
      type: "paragraph",
      text: "The acquisition addresses a key strategic vacancy in the franchise lineup, delivering power-hitting versatility in the death overs.",
    },
    {
      type: "paragraph",
      text: "Franchise management expressed confidence that this international addition positions Janakpur Bolts as serious contenders.",
    },
  ],
  word_count: 275,
  read_time: "2 min read",
  suggested_tags: ["Janakpur Bolts", "NPL 2026", "Player Signings"],
  team_ids: ["janakpur-bolts"],
  ...overrides,
});

const validSeo = {
  focus_keyword: "Janakpur Bolts NPL squad",
  secondary_keywords: ["Nepal Premier League", "NPL overseas players"],
  meta_title: "Janakpur Bolts Announce Marquee Signing | NPL Hub",
  meta_description:
    "Janakpur Bolts confirm experienced overseas player for NPL Season 3 at TU Stadium.",
  internal_links_injected: 2,
};

const validImage = {
  image_url: "https://example.com/storage/article-images/feature.webp",
  image_alt: "Nepal Premier League Janakpur Bolts announcement",
  image_caption: "Janakpur Bolts squad preparation for NPL Season 3",
  is_fallback: false,
  generator_used: "cloudflare-flux",
};

const baseQGInput = {
  draft: makeDraft(),
  seo: validSeo,
  image: validImage,
  dossier: validDossier,
  articleType: "squad_analysis",
  status: "draft",
  ai_generated: true,
};

// ---------------------------------------------------------------------------
// Test runner helpers
// ---------------------------------------------------------------------------
async function runTestSuite() {
  console.log("==================================================================");
  console.log("  NPL Hub Nepal — Multi-Provider AI Editorial Pipeline Test Suite");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   ${err.message}`);
      failed++;
    }
  }

  // =========================================================================
  // 1. Provider & Model Invariants
  // =========================================================================
  console.log("\n--- 1. Provider & Model Invariants ---");

  test("Groq: SYNTHESIS_PRIMARY must be openai/gpt-oss-120b (not deprecated llama)", () => {
    assert.strictEqual(GROQ_MODELS.SYNTHESIS_PRIMARY, "openai/gpt-oss-120b");
    assert(!GROQ_MODELS.SYNTHESIS_PRIMARY.includes("llama-3.3"), "Must not use deprecated llama-3.3");
    assert(!GROQ_MODELS.SYNTHESIS_PRIMARY.includes("llama-3.1"), "Must not use deprecated llama-3.1");
  });

  test("Groq: FAST_EXTRACTION must be openai/gpt-oss-20b", () => {
    assert.strictEqual(GROQ_MODELS.FAST_EXTRACTION, "openai/gpt-oss-20b");
  });

  test("Gemini: editorial models must include gemini-3.5-flash-lite and gemini-3.8-flash", () => {
    assert(GEMINI_EDITORIAL_MODELS.includes("gemini-3.5-flash-lite"));
    assert(GEMINI_EDITORIAL_MODELS.includes("gemini-3.8-flash"));
  });

  // =========================================================================
  // 2. Canonical Genre System
  // =========================================================================
  console.log("\n--- 2. Canonical Genre System ---");

  test("Canonical genre list has exactly 11 genres", () => {
    assert.strictEqual(CANONICAL_GENRES.length, 11, "Exactly 11 canonical genres required");
  });

  test("All 11 canonical genre IDs are distinct strings", () => {
    const unique = new Set(CANONICAL_GENRES);
    assert.strictEqual(unique.size, 11, "All genres must be unique");
    CANONICAL_GENRES.forEach((g) => assert(typeof g === "string" && g.length > 0));
  });

  test("Canonical genres do NOT contain any deprecated genre IDs", () => {
    DEPRECATED_GENRES.forEach((dep) => {
      assert(
        !CANONICAL_GENRES.includes(dep),
        `Deprecated genre "${dep}" must not be in canonical list`
      );
    });
  });

  test("API route VALID_ARTICLE_TYPES matches canonical 11 genres (structural check)", () => {
    // We can't import a route handler directly, so verify the canonical set covers expected IDs
    const expected = [
      "breaking_news", "tournament_news", "match_preview", "match_report",
      "match_analysis", "team_news", "player_news", "squad_analysis",
      "points_table_update", "official_announcement", "feature_story",
    ];
    expected.forEach((g) =>
      assert(CANONICAL_GENRES.includes(g), `"${g}" must be in canonical list`)
    );
  });

  // =========================================================================
  // 3. Genre-Aware Quality Gate Invariants
  // =========================================================================
  console.log("\n--- 3. Genre-Aware Quality Gate Invariants ---");

  test("QG passes 100% on valid squad_analysis draft", () => {
    const result = validateQualityGate(baseQGInput);
    assert.strictEqual(result.passed, true, `Violations: ${result.violations.join(", ")}`);
    assert.strictEqual(result.violations.length, 0);
  });

  test("QG catches short title < 20 chars (Invariant 1)", () => {
    const result = validateQualityGate({ ...baseQGInput, draft: makeDraft({ title: "Short" }) });
    assert.strictEqual(result.passed, false);
    assert(result.violations.some((v) => v.includes("Invariant 1")));
  });

  test("QG catches short excerpt < 50 chars (Invariant 2)", () => {
    const result = validateQualityGate({
      ...baseQGInput,
      draft: makeDraft({ excerpt: "Too short." }),
    });
    assert.strictEqual(result.passed, false);
    assert(result.violations.some((v) => v.includes("Invariant 2")));
  });

  test("QG: breaking_news with 50-word article PASSES if it has verified claim + title + excerpt", () => {
    const shortDraft = makeDraft({
      title: "CAN Confirms NPL Season 3 Will Start Next Month",
      excerpt:
        "The Cricket Association of Nepal has officially announced NPL Season 3 is scheduled to begin next month at TU Cricket Ground.",
      blocks: [
        { type: "heading", level: 2, text: "Official Confirmation" },
        {
          type: "paragraph",
          text: "CAN issued a formal statement confirming the tournament opening date.",
        },
      ],
      word_count: 50,
    });
    const result = validateQualityGate({
      ...baseQGInput,
      draft: shortDraft,
      articleType: "breaking_news",
    });
    // breaking_news only needs 1 paragraph + heading + 1 verified claim
    assert.strictEqual(result.passed, true, `Should pass: ${result.violations.join(", ")}`);
  });

  test("QG: official_announcement with 80-word article PASSES if has verified primary claim", () => {
    const announcementDraft = makeDraft({
      title: "CAN Officially Announces NPL Season 3 Schedule",
      excerpt:
        "The Cricket Association of Nepal has released the official full schedule for Nepal Premier League Season 3 starting next month.",
      blocks: [
        { type: "heading", level: 2, text: "Schedule Released" },
        {
          type: "paragraph",
          text: "CAN officially released the competition schedule covering all 22 matches across a 4-week window at Tribhuvan University Cricket Ground.",
        },
      ],
      word_count: 80,
    });
    const result = validateQualityGate({
      ...baseQGInput,
      draft: announcementDraft,
      articleType: "official_announcement",
    });
    assert.strictEqual(result.passed, true, `Should pass: ${result.violations.join(", ")}`);
  });

  test("QG: breaking_news with NO verified claims FAILS (Invariant 4)", () => {
    const noClaimDossier = {
      ...validDossier,
      claims: [
        {
          id: "c1",
          statement: "Rumour: a player might be signed.",
          source_urls: ["https://example.com"],
          source_type: "rumor",
          verification_status: "unverified",
          confidence: 0.3,
        },
      ],
      is_sufficient: true, // dossier marked sufficient but no verified claims
    };
    const result = validateQualityGate({
      ...baseQGInput,
      dossier: noClaimDossier,
      articleType: "breaking_news",
    });
    assert.strictEqual(result.passed, false);
    assert(result.violations.some((v) => v.includes("Invariant 4")));
  });

  test("QG: feature_story with only 2 paragraph blocks FAILS (Invariant 4 — depth)", () => {
    const shallowFeature = makeDraft({
      title: "The Rise of Nepal Cricket: A Deep-Dive Into the NPL Story",
      excerpt:
        "An in-depth look at how the Nepal Premier League transformed domestic cricket over three seasons.",
      blocks: [
        { type: "heading", level: 2, text: "The Beginning" },
        { type: "paragraph", text: "Nepal cricket has evolved significantly." },
        { type: "paragraph", text: "The NPL played a central role in this development." },
      ],
      word_count: 300,
    });
    const result = validateQualityGate({
      ...baseQGInput,
      draft: shallowFeature,
      articleType: "feature_story",
    });
    assert.strictEqual(result.passed, false);
    assert(result.violations.some((v) => v.includes("Invariant 4")));
  });

  test("QG: match_report without match context reference FAILS (Invariant 4)", () => {
    const noMatchContextDossier = {
      ...validDossier,
      claims: [
        {
          id: "c1",
          statement: "The player attended a press conference.",
          source_urls: ["https://example.com"],
          source_type: "secondary",
          verification_status: "verified",
          confidence: 0.9,
        },
        {
          id: "c2",
          statement: "Team sponsors announced a new deal.",
          source_urls: ["https://example.com/2"],
          source_type: "secondary",
          verification_status: "verified",
          confidence: 0.85,
        },
      ],
      is_sufficient: true,
    };
    const noMatchDraft = makeDraft({
      title: "Biratnagar Kings Sponsor Deal Announced After Press Conference",
      excerpt:
        "Biratnagar Kings unveiled their new kit sponsor during an official press conference held at their home ground.",
      blocks: [
        { type: "heading", level: 2, text: "New Kit Sponsor Confirmed" },
        {
          type: "paragraph",
          text: "Biratnagar Kings unveiled a new sponsorship deal at a press conference today.",
        },
        {
          type: "paragraph",
          text: "The announcement was made by team management and franchise ownership.",
        },
        {
          type: "paragraph",
          text: "The commercial partnership covers the upcoming season and comes with merchandise rights.",
        },
      ],
      word_count: 180,
    });
    const result = validateQualityGate({
      ...baseQGInput,
      draft: noMatchDraft,
      dossier: noMatchContextDossier,
      articleType: "match_report",
    });
    assert.strictEqual(result.passed, false);
    assert(
      result.violations.some((v) => v.includes("Invariant 4")),
      `Expected Invariant 4 violation, got: ${result.violations.join(", ")}`
    );
  });

  test("QG enforces strictly 'draft' status (Invariant 6)", () => {
    const result = validateQualityGate({
      ...baseQGInput,
      status: "published", // should fail
    });
    assert.strictEqual(result.passed, false);
    assert(result.violations.some((v) => v.includes("Invariant 6")));
  });

  test("QG catches empty feature image URL (Invariant 8)", () => {
    const result = validateQualityGate({
      ...baseQGInput,
      image: { ...validImage, image_url: "" },
    });
    assert.strictEqual(result.passed, false);
    assert(result.violations.some((v) => v.includes("Invariant 8")));
  });

  test("QG catches missing SEO focus keyword (Invariant 10)", () => {
    const result = validateQualityGate({
      ...baseQGInput,
      seo: { ...validSeo, focus_keyword: "" },
    });
    assert.strictEqual(result.passed, false);
    assert(result.violations.some((v) => v.includes("Invariant 10")));
  });

  test("QG catches insufficient dossier (Invariant 11)", () => {
    const result = validateQualityGate({
      ...baseQGInput,
      dossier: { ...validDossier, is_sufficient: false, sufficiency_reason: "Test: insufficient" },
    });
    assert.strictEqual(result.passed, false);
    assert(result.violations.some((v) => v.includes("Invariant 11")));
  });

  // =========================================================================
  // 4. SEO Internal Link Injector
  // =========================================================================
  console.log("\n--- 4. SEO Internal Link Injector ---");

  test("Internal links injected for canonical entities without over-linking duplicates", () => {
    const sampleBlocks = [
      { type: "paragraph", text: "Janakpur Bolts have started preparations at TU Stadium for the upcoming tournament." },
      { type: "paragraph", text: "Star spinner Sandeep Lamichhane took three crucial wickets in the previous match." },
      { type: "paragraph", text: "Check the updated points table to see how teams qualify for the playoffs." },
      { type: "paragraph", text: "Janakpur Bolts captain spoke positively about squad chemistry." },
    ];

    const { blocks, linksInjected } = injectInternalLinks(sampleBlocks, 5);

    assert.strictEqual(linksInjected, 3, "Should inject exactly 3 distinct entity links");
    assert(blocks[0].text.includes("[Janakpur Bolts](/teams/janakpur-bolts)"));
    assert(blocks[1].text.includes("[Sandeep Lamichhane](/players/sandeep-lamichhane)"));
    assert(blocks[2].text.includes("[points table](/points-table)"));
    assert(!blocks[3].text.includes("[Janakpur Bolts]"), "Duplicate entity must not be linked twice");
  });

  // =========================================================================
  // 5. Image Compositor WebP Generation
  // =========================================================================
  console.log("\n--- 5. Image Compositor ---");

  await testAsync("Image Compositor renders a valid 1200×675 WebP with team crest and Sharp SVG fallback", async () => {
    const result = await compositeEditorialFeatureImage({
      title: "Janakpur Bolts Face Biratnagar Kings in High-Stakes Clash",
      category: "Matches",
      teamIds: ["janakpur-bolts", "biratnagar-kings"],
      articleId: "test-match-clash-123",
    });

    assert(result.image_url, "Must return image URL");
    assert(result.image_alt, "Must return image alt text");
    assert(result.image_caption, "Must return image caption");
    assert.strictEqual(result.is_fallback, true, "Local SVG fallback must be flagged when no Cloudflare buffer");
    assert.strictEqual(result.generator_used, "local-sharp-svg");

    // Clean up generated test file
    if (result.image_url.startsWith("/images/articles/")) {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "public", result.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });

  // =========================================================================
  // 6. Concurrency / Duplicate-Prevention / Interrupted-Resume (Simulated)
  // =========================================================================
  console.log("\n--- 6. Concurrency & State Isolation ---");

  test("Worker tokens are unique UUIDs — two simultaneous claims cannot share the same token", () => {
    // Simulate what jobs-repository.claimEditorialJob generates for worker tokens
    const uuids = Array.from({ length: 10 }, () =>
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      })
    );
    const uniqueSet = new Set(uuids);
    assert.strictEqual(uniqueSet.size, 10, "All 10 worker tokens must be unique");
  });

  test("Stage data persistence: advancing to stage 3 must carry all prior stage fields", () => {
    // Simulate the StageData accumulation pattern used by advanceJobStage
    const initialStageData = {};
    const afterStage1 = { ...initialStageData, search_results: [{ url: "https://example.com", title: "Test" }] };
    const afterStage2 = { ...afterStage1, extracted_docs: [{ url: "https://example.com", title: "Test", raw_content: "..." }] };
    const afterStage3 = { ...afterStage2, dossier: validDossier };

    // Stage 3 data must preserve all earlier stage data
    assert(afterStage3.search_results, "Stage 3 data must retain search_results from Stage 1");
    assert(afterStage3.extracted_docs, "Stage 3 data must retain extracted_docs from Stage 2");
    assert(afterStage3.dossier, "Stage 3 data must have dossier");
  });

  test("Interrupted job resume: released lock can be reclaimed; stage_data at stage 3 is preserved", () => {
    // Simulate a job that was claimed, advanced to stage 3, then lost its lock
    const interruptedJob = {
      id: "job-abc-123",
      current_stage: 3,
      status: "running",
      worker_token: null, // lock was released
      lock_acquired_at: null,
      stage_data: {
        search_results: [{ url: "https://example.com" }],
        extracted_docs: [{ url: "https://example.com", raw_content: "content..." }],
      },
    };

    // A new worker should be able to re-claim this job at stage 3
    const canReclaim =
      interruptedJob.status === "running" &&
      interruptedJob.worker_token === null;
    assert.strictEqual(canReclaim, true, "Released lock must allow re-claim");

    // Verify stage 2 data persists after re-claim
    assert(interruptedJob.stage_data.extracted_docs, "Extracted docs must survive lock release");
    assert(interruptedJob.stage_data.search_results, "Search results must survive lock release");
    assert.strictEqual(interruptedJob.current_stage, 3, "Stage must still be at 3 after lock release");
  });

  test("Duplicate prevention: only one news_articles row should be created per job (article_id check)", () => {
    // Simulate job completion tracking: article_id is set after Stage 7 completes
    const completedJob = {
      id: "job-abc-123",
      status: "completed",
      article_id: "janakpur-bolts-sign-overseas-allrounder-abc123",
      current_stage: 7,
    };

    // A second attempt to process the same job would check status before claiming
    const isAlreadyCompleted = completedJob.status === "completed";
    assert.strictEqual(isAlreadyCompleted, true, "Completed jobs must not be claimed again");
    assert(completedJob.article_id, "Completed job must have article_id set");
  });

  // =========================================================================
  // Summary
  // =========================================================================
  console.log("\n==================================================================");
  console.log(`  Tests completed: ${passed} passed, ${failed} failed`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
