import fs from "fs";
import path from "path";
import { NPL_PLAYERS, getAllPlayers, getPlayerBySlug, getPlayersByTeam } from "../src/lib/data/players-data.ts";
import { NPL_TEAM_DETAILS } from "../src/lib/data/teams-data.ts";

console.log("=== NPL Season 3 Player Directory QA Verification ===\n");

const validTeamIds = new Set(NPL_TEAM_DETAILS.map(t => t.id));
console.log(`Valid Teams (${validTeamIds.size}):`, [...validTeamIds]);

let errors = 0;

// 1. Total players
const players = getAllPlayers();
console.log(`Total Players: ${players.length}`);
if (players.length !== 127) {
  console.error(`ERROR: Expected 127 players, found ${players.length}`);
  errors++;
}

// 2. Duplicate ID or Slug check
const seenIds = new Set();
const seenSlugs = new Set();
for (const p of players) {
  if (seenIds.has(p.id)) {
    console.error(`ERROR: Duplicate player id: ${p.id}`);
    errors++;
  }
  seenIds.add(p.id);

  if (seenSlugs.has(p.slug)) {
    console.error(`ERROR: Duplicate player slug: ${p.slug}`);
    errors++;
  }
  seenSlugs.add(p.slug);
}

// 3. Team validity check
const teamCounts = {};
for (const p of players) {
  if (!validTeamIds.has(p.teamId)) {
    console.error(`ERROR: Invalid teamId "${p.teamId}" for player ${p.name} (${p.slug})`);
    errors++;
  }
  teamCounts[p.teamId] = (teamCounts[p.teamId] || 0) + 1;
}

console.log("\nPlayer counts by team:");
for (const [teamId, count] of Object.entries(teamCounts)) {
  console.log(`  - ${teamId}: ${count}`);
}

// 4. Image paths and local file existence check
let missingImages = 0;
let validImages = 0;
for (const p of players) {
  if (!p.profileImage) {
    console.warn(`WARN: Player missing profileImage field: ${p.name} (${p.slug})`);
    missingImages++;
    continue;
  }

  const relPath = p.profileImage.startsWith("/") ? p.profileImage.slice(1) : p.profileImage;
  const fullPath = path.resolve("public", relPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`ERROR: Image file not found on disk: ${fullPath} for player ${p.name}`);
    missingImages++;
    errors++;
  } else {
    const stat = fs.statSync(fullPath);
    if (stat.size < 500) {
      console.error(`ERROR: Image file too small (${stat.size}B): ${fullPath}`);
      errors++;
    } else {
      validImages++;
    }
  }
}

console.log(`\nImage verification: ${validImages} valid local portraits on disk, ${missingImages} missing.`);

// 5. Query helpers check
for (const p of players) {
  const found = getPlayerBySlug(p.slug);
  if (!found || found.id !== p.id) {
    console.error(`ERROR: getPlayerBySlug("${p.slug}") failed to resolve correct player.`);
    errors++;
  }
}

for (const teamId of validTeamIds) {
  const teamPlayers = getPlayersByTeam(teamId);
  if (teamPlayers.length !== teamCounts[teamId]) {
    console.error(`ERROR: getPlayersByTeam("${teamId}") returned ${teamPlayers.length}, expected ${teamCounts[teamId]}`);
    errors++;
  }
}

// 6. Role & Nationality validation
const validRoles = new Set(["Batter", "Bowler", "All-rounder", "Wicketkeeper"]);
for (const p of players) {
  if (!validRoles.has(p.role)) {
    console.error(`ERROR: Invalid role "${p.role}" for player ${p.name}`);
    errors++;
  }
  if (!p.nationality || p.nationality.trim() === "") {
    console.error(`ERROR: Empty nationality for player ${p.name}`);
    errors++;
  }
}

console.log(`\nQA Result: ${errors === 0 ? "PASSED (0 errors)" : `FAILED (${errors} errors)`}`);
if (errors > 0) process.exit(1);
