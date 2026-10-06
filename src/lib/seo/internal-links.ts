/**
 * NPL Hub Nepal — SEO Internal & External Link Directory & Utilities
 *
 * Provides:
 * 1. Searchable directory of all canonical NPL entities:
 *    - Core tournament pages (/schedule, /points-table, /teams, /players, /stats, /news, /about)
 *    - All 8 franchise teams (/teams/[slug])
 *    - All 53 verified squad players (/players/[slug])
 *    - All 32 fixtures (/matches/[slug])
 *    - Published news articles (/news/[slug])
 *    - Tournament venue (TU Stadium Kirtipur)
 * 2. Relevance-scored search for internal link suggestions.
 * 3. Validation & sanitization for external links.
 * 4. Safe markdown link extraction and manipulation helpers.
 */

import { NPL_TEAM_DETAILS } from "@/lib/data/teams-data";
import { NPL_PLAYERS } from "@/lib/data/players-data";
import { SCHEDULE_FIXTURES } from "@/lib/data/schedule-data";
import { NEWS_ARTICLES } from "@/lib/data/news-data";

export type InternalLinkCategory =
  | "all"
  | "team"
  | "player"
  | "match"
  | "page"
  | "news"
  | "venue";

export interface InternalLinkItem {
  id: string;
  title: string;
  url: string;
  category: "team" | "player" | "match" | "page" | "news" | "venue";
  subtitle: string;
  badge: string;
  keywords: string[];
}

/** Pre-indexed canonical core pages */
const CORE_PAGES: InternalLinkItem[] = [
  {
    id: "page-schedule",
    title: "NPL Season 3 Schedule & Fixtures",
    url: "/schedule",
    category: "page",
    subtitle: "Complete calendar of 32 T20 matches with BS dates & timings",
    badge: "Schedule",
    keywords: ["schedule", "fixtures", "matches", "calendar", "time", "dates", "timing", "timetable"],
  },
  {
    id: "page-points-table",
    title: "NPL Season 3 Points Table & Standings",
    url: "/points-table",
    category: "page",
    subtitle: "Standings, points, Net Run Rate (NRR) & playoff qualification",
    badge: "Standings",
    keywords: ["points", "table", "standings", "nrr", "net run rate", "playoffs", "rankings"],
  },
  {
    id: "page-teams",
    title: "NPL Teams Directory",
    url: "/teams",
    category: "page",
    subtitle: "All 8 franchise profiles, captains, and squad rosters",
    badge: "Teams",
    keywords: ["teams", "franchises", "clubs", "directory"],
  },
  {
    id: "page-players",
    title: "NPL Players Directory",
    url: "/players",
    category: "page",
    subtitle: "53 confirmed players, captains, and squad details",
    badge: "Players",
    keywords: ["players", "squad", "roster", "directory", "batters", "bowlers"],
  },
  {
    id: "page-stats",
    title: "NPL Statistics & Records Hub",
    url: "/stats",
    category: "page",
    subtitle: "Historical Season 2 & Season 3 player and team statistics",
    badge: "Stats",
    keywords: ["stats", "records", "statistics", "leaderboard", "runs", "wickets"],
  },
  {
    id: "page-news",
    title: "NPL News & Updates",
    url: "/news",
    category: "page",
    subtitle: "Official announcements, squad news, and editorial coverage",
    badge: "News",
    keywords: ["news", "articles", "updates", "announcements", "editorial"],
  },
  {
    id: "page-about",
    title: "About NPL Hub Nepal",
    url: "/about",
    category: "page",
    subtitle: "Tournament overview, competition format & non-affiliation disclaimer",
    badge: "About",
    keywords: ["about", "format", "rules", "can", "overview", "kirtipur"],
  },
  {
    id: "venue-tu-ground",
    title: "TU International Cricket Ground, Kirtipur",
    url: "/schedule",
    category: "venue",
    subtitle: "Primary tournament venue hosting all 32 NPL Season 3 matches",
    badge: "Venue",
    keywords: ["tu ground", "kirtipur", "venue", "tribhuvan university", "stadium", "ground"],
  },
];

/** Build full directory of internal links */
export function getInternalLinkDirectory(
  extraArticles?: Array<{ title: string; slug: string }>
): InternalLinkItem[] {
  const items: InternalLinkItem[] = [...CORE_PAGES];

  // 1. Teams (8 franchises)
  for (const team of NPL_TEAM_DETAILS) {
    items.push({
      id: `team-${team.id}`,
      title: team.name,
      url: `/teams/${team.id}`,
      category: "team",
      subtitle: `${team.region || "Nepal"} · Captain: ${team.captain || "TBA"}`,
      badge: "Team",
      keywords: [
        team.name.toLowerCase(),
        team.shortName.toLowerCase(),
        team.id.toLowerCase(),
        team.city?.toLowerCase() || "",
        team.captain?.toLowerCase() || "",
      ],
    });
  }

  // 2. Players (53 confirmed players)
  for (const player of NPL_PLAYERS) {
    const team = NPL_TEAM_DETAILS.find((t) => t.id === player.teamId);
    items.push({
      id: `player-${player.slug}`,
      title: player.name,
      url: `/players/${player.slug}`,
      category: "player",
      subtitle: `${player.role} · ${team?.name || "NPL"}`,
      badge: "Player",
      keywords: [
        player.name.toLowerCase(),
        player.slug.toLowerCase(),
        player.role.toLowerCase(),
        team?.name.toLowerCase() || "",
        team?.shortName.toLowerCase() || "",
      ],
    });
  }

  // 3. Matches (32 fixtures)
  for (const m of SCHEDULE_FIXTURES) {
    const t1 = NPL_TEAM_DETAILS.find((t) => t.id === m.team1Id);
    const t2 = NPL_TEAM_DETAILS.find((t) => t.id === m.team2Id);
    const matchLabel =
      t1 && t2
        ? `${t1.name} vs ${t2.name}`
        : `Match ${m.matchNumber} (${m.stage})`;

    items.push({
      id: `match-${m.slug}`,
      title: `Match ${m.matchNumber}: ${matchLabel}`,
      url: `/matches/${m.slug}`,
      category: "match",
      subtitle: `${m.formattedDate} · ${m.stage} stage`,
      badge: "Match",
      keywords: [
        `match ${m.matchNumber}`,
        t1?.name.toLowerCase() || "",
        t2?.name.toLowerCase() || "",
        m.stage.toLowerCase(),
      ],
    });
  }

  // 4. Static News Articles
  for (const article of NEWS_ARTICLES) {
    items.push({
      id: `news-${article.slug}`,
      title: article.title,
      url: `/news/${article.slug}`,
      category: "news",
      subtitle: `${article.category} · ${article.displayDate}`,
      badge: "Article",
      keywords: [
        article.title.toLowerCase(),
        article.slug.toLowerCase(),
        article.category.toLowerCase(),
      ],
    });
  }

  // 5. Any dynamically provided articles (from admin state / database)
  if (Array.isArray(extraArticles)) {
    for (const art of extraArticles) {
      if (!items.some((i) => i.url === `/news/${art.slug}`)) {
        items.push({
          id: `news-extra-${art.slug}`,
          title: art.title,
          url: `/news/${art.slug}`,
          category: "news",
          subtitle: "Published News Article",
          badge: "Article",
          keywords: [art.title.toLowerCase(), art.slug.toLowerCase()],
        });
      }
    }
  }

  return items;
}

/**
 * Searches the internal link directory with intelligent relevance scoring.
 */
export function searchInternalLinks(
  query: string,
  category: InternalLinkCategory = "all",
  extraArticles?: Array<{ title: string; slug: string }>
): InternalLinkItem[] {
  const directory = getInternalLinkDirectory(extraArticles);
  const cleanQ = query.trim().toLowerCase();

  // Filter by category if specified
  const filtered =
    category === "all"
      ? directory
      : directory.filter((item) => item.category === category);

  // If no search term, return curated highlights:
  if (!cleanQ) {
    // Return all teams + core pages first
    return filtered
      .filter((i) => i.category === "team" || i.category === "page" || i.category === "venue")
      .slice(0, 12);
  }

  // Score each item based on match quality
  interface ScoredItem {
    item: InternalLinkItem;
    score: number;
  }

  const scored: ScoredItem[] = [];

  for (const item of filtered) {
    const titleLower = item.title.toLowerCase();
    const subtitleLower = item.subtitle.toLowerCase();
    let score = 0;

    // Exact title match: highest score
    if (titleLower === cleanQ) {
      score += 100;
    } else if (titleLower.startsWith(cleanQ)) {
      score += 75;
    } else if (titleLower.includes(cleanQ)) {
      score += 50;
    }

    // Word boundary matches in title
    const words = cleanQ.split(/\s+/);
    const matchedWords = words.filter((w) => w.length > 1 && titleLower.includes(w));
    if (matchedWords.length > 0) {
      score += matchedWords.length * 15;
    }

    // Keyword matches
    for (const kw of item.keywords) {
      if (kw === cleanQ) score += 40;
      else if (kw.includes(cleanQ)) score += 20;
    }

    // Subtitle matches
    if (subtitleLower.includes(cleanQ)) {
      score += 15;
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  // Sort by highest score first
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 15).map((s) => s.item);
}

/**
 * Validates and sanitizes an external URL.
 * Only allows HTTP / HTTPS protocols. Rejects javascript:, file:, data:, etc.
 */
export function validateExternalUrl(input: string): {
  valid: boolean;
  normalizedUrl: string;
  error?: string;
} {
  const trimmed = input.trim();

  if (!trimmed) {
    return { valid: false, normalizedUrl: "", error: "URL cannot be empty." };
  }

  // Check for relative URLs
  if (trimmed.startsWith("/")) {
    return {
      valid: false,
      normalizedUrl: trimmed,
      error:
        "This looks like an internal path. Use the 'Internal Link' tab for canonical internal linking.",
    };
  }

  // Must start with http:// or https://
  let urlToParse = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    // If user entered e.g. "espncricinfo.com", auto-prepend https://
    urlToParse = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(urlToParse);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        valid: false,
        normalizedUrl: "",
        error: "Only standard web protocols (http:// or https://) are supported.",
      };
    }

    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return {
        valid: false,
        normalizedUrl: "",
        error: "Please enter a valid website domain name (e.g. https://example.com).",
      };
    }

    return {
      valid: true,
      normalizedUrl: parsed.href,
    };
  } catch {
    return {
      valid: false,
      normalizedUrl: "",
      error: "Invalid URL format. Please check the website address.",
    };
  }
}

/**
 * Extracts all markdown links [text](url) from a block string.
 */
export function extractMarkdownLinks(
  text: string
): Array<{ raw: string; text: string; url: string; index: number }> {
  if (!text) return [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: Array<{ raw: string; text: string; url: string; index: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    links.push({
      raw: match[0],
      text: match[1],
      url: match[2],
      index: match.index,
    });
  }

  return links;
}

/**
 * Removes a markdown link and replaces it with its plain anchor text.
 * e.g. "facing [Janakpur Bolts](/teams/janakpur-bolts)" -> "facing Janakpur Bolts"
 */
export function unlinkMarkdown(text: string, rawLink: string): string {
  const match = rawLink.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (!match) return text;
  const anchorText = match[1];
  return text.replace(rawLink, anchorText);
}

/**
 * Replaces an existing markdown link with new anchor text and destination URL.
 */
export function updateMarkdownLink(
  text: string,
  rawLink: string,
  newAnchor: string,
  newUrl: string
): string {
  const replacement = `[${newAnchor.trim()}](${newUrl.trim()})`;
  return text.replace(rawLink, replacement);
}
