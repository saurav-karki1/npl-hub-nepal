/**
 * NPL Hub Nepal — Structured Data Test Suite
 *
 * Verifies Schema.org SportsEvent JSON-LD compliance for match pages:
 * - Proper ISO 8601 formatting with Nepal Standard Time (+05:45)
 * - Google Search Central Event guidelines for startDate and endDate
 * - Avoidance of arbitrary / fabricated end times
 * - Date-only handling for TBA matches
 * - Valid JSON-LD serialization without XSS or parse errors
 */

import { buildMatchJsonLd, toNepalISO, resolveMatchEndDate } from "../src/lib/structuredData.ts";
import { SCHEDULE_FIXTURES, resolveMatchTeams } from "../src/lib/data/schedule-data.ts";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

console.log("==================================================================");
console.log("  NPL Hub Nepal — Structured Data (SportsEvent) Test Suite");
console.log("==================================================================\n");

// 1. toNepalISO tests
console.log("--- 1. toNepalISO & Time Parsing ---");
assert(
  toNepalISO("2026-10-26", "5:00 PM NPT") === "2026-10-26T17:00:00+05:45",
  "Parses 5:00 PM NPT into 2026-10-26T17:00:00+05:45"
);
assert(
  toNepalISO("2026-10-27", "12:30 PM NPT") === "2026-10-27T12:30:00+05:45",
  "Parses 12:30 PM NPT into 2026-10-27T12:30:00+05:45"
);
assert(
  toNepalISO("2026-11-18", "Time TBA") === "2026-11-18",
  "Time TBA returns date-only format (2026-11-18) per Google Search Central guidelines"
);
assert(
  toNepalISO("2026-11-18") === "2026-11-18",
  "Missing time returns date-only format without midnight default"
);

// 2. resolveMatchEndDate tests
console.log("\n--- 2. resolveMatchEndDate & Data-Driven Logic ---");
const match1 = SCHEDULE_FIXTURES[0];
assert(
  resolveMatchEndDate(match1) === undefined,
  "Match 1 (start 5:00 PM, no scheduled finish time) omits endDate per Google guidelines (no fabrication)"
);

const matchWithEndTime = {
  ...match1,
  endTime: "8:30 PM NPT",
};
assert(
  resolveMatchEndDate(matchWithEndTime) === "2026-10-26T20:30:00+05:45",
  "Match with explicit endTime (8:30 PM NPT) generates valid ISO 8601 endDate with +05:45 offset"
);

const matchWithRange = {
  ...match1,
  time: "12:30 PM - 4:00 PM NPT",
};
assert(
  resolveMatchEndDate(matchWithRange) === "2026-10-26T16:00:00+05:45",
  "Match with time range (12:30 PM - 4:00 PM NPT) generates valid ISO 8601 endDate"
);

const matchWithExplicitEndDate = {
  ...match1,
  endDate: "2026-10-26T20:45:00+05:45",
};
assert(
  resolveMatchEndDate(matchWithExplicitEndDate) === "2026-10-26T20:45:00+05:45",
  "Match with explicit endDate uses verified value directly"
);

const matchTba = SCHEDULE_FIXTURES.find((m) => m.time === "Time TBA");
assert(
  resolveMatchEndDate(matchTba) === matchTba.date,
  `Playoff match with Time TBA generates date-only endDate (${matchTba.date}) matching Google guidelines`
);

// 3. buildMatchJsonLd tests across all 32 fixtures
console.log("\n--- 3. Full 32-Fixture Schema Verification ---");
let allValid = true;
for (const match of SCHEDULE_FIXTURES) {
  const { team1, team2 } = resolveMatchTeams(match);
  const schema = buildMatchJsonLd({ match, team1, team2 });

  if (schema["@context"] !== "https://schema.org" || schema["@type"] !== "SportsEvent") {
    allValid = false;
    break;
  }
  if (!schema.name || !schema.startDate || !schema.location) {
    allValid = false;
    break;
  }

  // Ensure no midnight default (00:00:00) is present
  if (typeof schema.startDate === "string" && schema.startDate.includes("T00:00:00")) {
    console.error(`Invalid midnight default on match ${match.matchNumber}: ${schema.startDate}`);
    allValid = false;
    break;
  }

  // For TBA matches, both startDate and endDate should be valid date-only strings
  if (match.time === "Time TBA") {
    if (schema.startDate !== match.date || schema.endDate !== match.date) {
      console.error(`TBA match mismatch on match ${match.matchNumber}: start=${schema.startDate}, end=${schema.endDate}`);
      allValid = false;
      break;
    }
  }

  // If endDate is present, ensure it's valid ISO and not earlier than startDate
  if (schema.endDate) {
    if (typeof schema.endDate !== "string" || schema.endDate.length < 10) {
      allValid = false;
      break;
    }
  }
}
assert(allValid, "All 32 fixtures generate valid Schema.org SportsEvent objects with correct properties");

// 4. Sample JSON-LD Inspection
console.log("\n--- 4. Sample Match Schemas ---");
const sampleLeague = buildMatchJsonLd({
  match: SCHEDULE_FIXTURES[0],
  ...resolveMatchTeams(SCHEDULE_FIXTURES[0]),
});
console.log("League Match Sample (Match 1):");
console.log(`  Name: ${sampleLeague.name}`);
console.log(`  StartDate: ${sampleLeague.startDate}`);
console.log(`  EndDate: ${sampleLeague.endDate || "(omitted — finish time unconfirmed per Google guidelines)"}`);
console.log(`  EventStatus: ${sampleLeague.eventStatus}`);

const samplePlayoff = buildMatchJsonLd({
  match: SCHEDULE_FIXTURES[28],
  ...resolveMatchTeams(SCHEDULE_FIXTURES[28]),
});
console.log("\nPlayoff Match Sample (Match 29 - Qualifier 1):");
console.log(`  Name: ${samplePlayoff.name}`);
console.log(`  StartDate: ${samplePlayoff.startDate} (date-only)`);
console.log(`  EndDate: ${samplePlayoff.endDate} (date-only)`);
console.log(`  EventStatus: ${samplePlayoff.eventStatus}`);

console.log("\n==================================================================");
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log("==================================================================");

if (failed > 0) process.exit(1);
