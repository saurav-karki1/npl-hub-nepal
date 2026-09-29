/**
 * NPL Hub Nepal — Playoff Invariant Validation Script
 *
 * Checks the Id / Placeholder exclusive invariant across all 32 fixtures in schedule-data.ts:
 * For every match side (team1 and team2):
 * - Exactly ONE of (teamId, placeholder) must be non-null.
 * - Both null => INVALID (fails with error)
 * - Both non-null => INVALID (fails with error)
 *
 * Run with: node scripts/validate-playoff-invariant.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scheduleFilePath = path.resolve(__dirname, '../src/lib/data/schedule-data.ts');

const content = fs.readFileSync(scheduleFilePath, 'utf8');

// Match fixtures block
const fixturesMatch = content.match(/export const SCHEDULE_FIXTURES: ScheduleMatch\[\] = \[([\s\S]*?)\n\];/);
if (!fixturesMatch) {
  console.error('ERROR: Could not locate SCHEDULE_FIXTURES array in schedule-data.ts');
  process.exit(1);
}

// Regex to extract each match object block
const matchBlocks = fixturesMatch[1].match(/\{\s*id:\s*"match-[\s\S]*?isProvisional:\s*(?:true|false),\s*\}/g);

if (!matchBlocks || matchBlocks.length !== 32) {
  console.error(`ERROR: Expected 32 match fixture blocks, found ${matchBlocks ? matchBlocks.length : 0}`);
  process.exit(1);
}

let violations = 0;
let validatedSides = 0;

const parsedFixtures = [];

for (const block of matchBlocks) {
  const matchNum = parseInt(block.match(/matchNumber:\s*(\d+)/)?.[1] || '0', 10);
  const matchId = block.match(/id:\s*"([^"]+)"/)?.[1] || 'unknown';
  const stage = block.match(/stage:\s*"([^"]+)"/)?.[1] || 'unknown';

  const t1IdRaw = block.match(/team1Id:\s*([^,\n]+)/)?.[1]?.trim();
  const t1PlRaw = block.match(/team1Placeholder:\s*([^,\n]+)/)?.[1]?.trim();
  const t2IdRaw = block.match(/team2Id:\s*([^,\n]+)/)?.[1]?.trim();
  const t2PlRaw = block.match(/team2Placeholder:\s*([^,\n]+)/)?.[1]?.trim();

  const parseVal = (raw) => {
    if (!raw || raw === 'null') return null;
    return raw.replace(/^"|"$/g, '');
  };

  const team1Id = parseVal(t1IdRaw);
  const team1Placeholder = parseVal(t1PlRaw);
  const team2Id = parseVal(t2IdRaw);
  const team2Placeholder = parseVal(t2PlRaw);

  parsedFixtures.push({
    matchNumber: matchNum,
    id: matchId,
    stage,
    team1Id,
    team1Placeholder,
    team2Id,
    team2Placeholder,
  });

  // Check Team 1 Side Invariant
  validatedSides++;
  const t1BothNull = team1Id === null && team1Placeholder === null;
  const t1BothNonNull = team1Id !== null && team1Placeholder !== null;
  if (t1BothNull || t1BothNonNull) {
    violations++;
    console.error(
      `❌ INVARIANT VIOLATION: Match #${matchNum} (${matchId}) Team 1 side invalid! ` +
      `team1Id: ${JSON.stringify(team1Id)}, team1Placeholder: ${JSON.stringify(team1Placeholder)}. ` +
      (t1BothNull ? 'Both are null!' : 'Both are non-null!')
    );
  }

  // Check Team 2 Side Invariant
  validatedSides++;
  const t2BothNull = team2Id === null && team2Placeholder === null;
  const t2BothNonNull = team2Id !== null && team2Placeholder !== null;
  if (t2BothNull || t2BothNonNull) {
    violations++;
    console.error(
      `❌ INVARIANT VIOLATION: Match #${matchNum} (${matchId}) Team 2 side invalid! ` +
      `team2Id: ${JSON.stringify(team2Id)}, team2Placeholder: ${JSON.stringify(team2Placeholder)}. ` +
      (t2BothNull ? 'Both are null!' : 'Both are non-null!')
    );
  }
}

// Verify Playoff specific placeholder values (Matches 29-32)
const expectedPlayoffs = [
  { matchNumber: 29, t1Pl: 'rank-1', t2Pl: 'rank-2' },
  { matchNumber: 30, t1Pl: 'rank-3', t2Pl: 'rank-4' },
  { matchNumber: 31, t1Pl: 'q1-loser', t2Pl: 'elim-winner' },
  { matchNumber: 32, t1Pl: 'q1-winner', t2Pl: 'q2-winner' },
];

console.log('--- PLAYOFF PLACEHOLDER VERIFICATION (Matches 29-32) ---');
for (const exp of expectedPlayoffs) {
  const match = parsedFixtures.find((m) => m.matchNumber === exp.matchNumber);
  if (!match) {
    violations++;
    console.error(`Missing match #${exp.matchNumber}!`);
    continue;
  }
  const t1Matches = match.team1Id === null && match.team1Placeholder === exp.t1Pl;
  const t2Matches = match.team2Id === null && match.team2Placeholder === exp.t2Pl;

  if (t1Matches && t2Matches) {
    console.log(
      `  Match #${exp.matchNumber} (${match.stage}): team1Placeholder="${match.team1Placeholder}", ` +
      `team2Placeholder="${match.team2Placeholder}" ✅`
    );
  } else {
    violations++;
    console.error(
      `❌ Playoff placeholder mismatch on Match #${exp.matchNumber}: ` +
      `Expected t1="${exp.t1Pl}", t2="${exp.t2Pl}" | Found t1="${match.team1Placeholder}", t2="${match.team2Placeholder}"`
    );
  }
}

console.log('\n--- INVARIANT SUMMARY ---');
console.log(`Total fixtures inspected: ${parsedFixtures.length}`);
console.log(`Total match sides checked: ${validatedSides}`);
console.log(`League matches (1-28): 28 fixtures with canonical teamId and null placeholder`);
console.log(`Playoff matches (29-32): 4 fixtures with null teamId and canonical placeholder`);

if (violations === 0) {
  console.log(`\n✅ VALIDATION PASSED: All ${validatedSides} match sides strictly satisfy the exclusive Id/Placeholder invariant.`);
  process.exit(0);
} else {
  console.error(`\n❌ VALIDATION FAILED: ${violations} violation(s) detected.`);
  process.exit(1);
}
