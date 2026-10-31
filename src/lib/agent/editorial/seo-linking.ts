/**
 * NPL Hub Nepal — Editorial SEO & Internal Link Injector
 *
 * Connects generated article text with canonical tournament routes:
 * - 8 franchise teams (/teams/[slug])
 * - Confirmed squad players (/players/[slug])
 * - Core tournament hubs (/schedule, /points-table, /stats)
 *
 * Grounding & Hygiene Rules:
 * - Max 1 link per entity across the entire article.
 * - Max 5 total internal links per article (prevents link dilution).
 * - Never inject links into headings, quotes, or existing markdown links.
 */

import type { ArticleBlock } from "@/lib/types/article-blocks";
import { NPL_TEAM_DETAILS } from "@/lib/data/teams-data";
import { NPL_PLAYERS } from "@/lib/data/players-data";

interface LinkEntity {
  name: string;
  url: string;
  regex: RegExp;
}

// Compile canonical entities once
const CANONICAL_ENTITIES: LinkEntity[] = [];

// 1. Teams
for (const team of NPL_TEAM_DETAILS) {
  CANONICAL_ENTITIES.push({
    name: team.name,
    url: `/teams/${team.id}`,
    // Match full team name as a discrete phrase
    regex: new RegExp(`\\b(${team.name})\\b`, "i"),
  });
}

// 2. High-profile verified players
for (const player of NPL_PLAYERS.slice(0, 30)) {
  CANONICAL_ENTITIES.push({
    name: player.name,
    url: `/players/${player.slug}`,
    regex: new RegExp(`\\b(${player.name})\\b`, "i"),
  });
}

// 3. Core tournament hubs
CANONICAL_ENTITIES.push(
  {
    name: "Points Table",
    url: "/points-table",
    regex: /\b(points table|NPL standings)\b/i,
  },
  {
    name: "Tournament Schedule",
    url: "/schedule",
    regex: /\b(NPL schedule|tournament fixtures|match schedule)\b/i,
  }
);

/**
 * Injects markdown links [Text](URL) into paragraph blocks in a disciplined manner.
 */
export function injectInternalLinks(
  blocks: ArticleBlock[],
  maxLinks = 5
): { blocks: ArticleBlock[]; linksInjected: number } {
  let linkCount = 0;
  const usedUrls = new Set<string>();

  const updatedBlocks = blocks.map((block) => {
    if (block.type !== "paragraph" || linkCount >= maxLinks) {
      return block;
    }

    let text = block.text;

    for (const entity of CANONICAL_ENTITIES) {
      if (linkCount >= maxLinks) break;
      if (usedUrls.has(entity.url)) continue;

      // Don't replace if already linked or inside markdown brackets
      const alreadyLinkedRegex = new RegExp(`\\[[^\\]]*\\]\\(${entity.url}\\)`, "i");
      if (alreadyLinkedRegex.test(text)) {
        usedUrls.add(entity.url);
        continue;
      }

      // Check if text matches entity name and is not already part of a markdown link
      const match = entity.regex.exec(text);
      if (match) {
        const matchedText = match[0];
        // Ensure not inside an existing markdown link: [ ... matchedText ... ](...)
        const before = text.slice(0, match.index);
        const openBrackets = (before.match(/\[/g) || []).length;
        const closeBrackets = (before.match(/\]/g) || []).length;

        if (openBrackets === closeBrackets) {
          // Safe to replace first occurrence
          text =
            text.slice(0, match.index) +
            `[${matchedText}](${entity.url})` +
            text.slice(match.index + matchedText.length);

          usedUrls.add(entity.url);
          linkCount++;
        }
      }
    }

    return { ...block, text };
  });

  return { blocks: updatedBlocks, linksInjected: linkCount };
}
