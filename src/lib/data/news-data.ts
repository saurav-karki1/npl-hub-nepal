/**
 * NPL Hub Nepal — News & Updates Data
 *
 * Canonical data source for all news articles.
 * Designed for zero-friction swap: replace the static arrays
 * and helper functions with Supabase / API calls without
 * touching any presentation component.
 *
 * Content policy:
 *  - Only verified NPL Season 3 facts are used.
 *  - Articles without confirmed sourced detail are marked
 *    status: "draft" and carry a clear disclaimer in the content.
 *  - Do NOT add invented scores, quotes, transfers, or player info.
 */

export type NewsCategory =
  | "Tournament"
  | "Teams"
  | "Matches"
  | "Points Table"
  | "Announcements";

export type ArticleStatus = "published" | "draft";

export interface NewsArticle {
  /** Unique stable identifier */
  id: string;

  /** URL slug: /news/[slug] */
  slug: string;

  /** Page <title> / article headline */
  title: string;

  /** One- or two-sentence summary for cards and meta descriptions */
  excerpt: string;

  /**
   * Full article body in plain paragraphs.
   * Each string is rendered as a <p> element.
   * Future: replace with MDX / rich-text from CMS.
   */
  content: string[];

  category: NewsCategory;

  /** ISO 8601 date string (publish date) */
  publishedAt: string;

  /** ISO 8601 date string (last edit — equals publishedAt if never updated) */
  updatedAt: string;

  /** Featured articles appear in the hero section of /news */
  featured: boolean;

  /** Optional hero image path (relative to /public) */
  imageUrl?: string;

  /** Byline / attribution */
  author: string;

  /** Source attribution label (shown in article, for editorial transparency) */
  source: string;

  /** IDs of related teams (from teams-data.ts) */
  relatedTeamIds?: string[];

  /** Slug of the most-related match page */
  relatedMatchSlug?: string;

  /** "published" is visible; "draft" is flagged as provisional content */
  status: ArticleStatus;

  /** Approximate reading time string, e.g. "3 min read" */
  readTime: string;

  /** Formatted display date, e.g. "25 Sep 2026" */
  displayDate: string;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Article Data                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

export const NEWS_ARTICLES: NewsArticle[] = [
  /* ── 1. Schedule & Fixtures ─────────────────────────────────────────────── */
  {
    id: "article-01",
    slug: "npl-season-3-schedule-venues-announced",
    title: "NPL Season 3 Schedule & TU Ground Fixture Plan Confirmed",
    excerpt:
      "All 32 fixtures for Nepal Premier League Season 3 will be held at TU International Cricket Stadium, Kirtipur, running from 28 November to 21 December 2026.",
    content: [
      "The Cricket Association of Nepal (CAN) has confirmed the complete fixture schedule for Nepal Premier League Season 3. The tournament will run from 28 Mangsir 2083 BS (28 November 2026) to 5 Poush 2083 BS (21 December 2026).",
      "All 32 matches, including the group stage and four playoff fixtures, will be held at the TU International Cricket Stadium in Kirtipur, Kathmandu. The venue will serve as the sole host ground for the entire tournament.",
      "The group stage consists of 28 matches, after which the top four teams on the points table advance to the playoffs. The playoff format includes Qualifier 1, Eliminator, Qualifier 2, and the Final.",
      "Eight franchise teams — Kathmandu Gorkhas, Biratnagar Kings, Janakpur Bolts, Pokhara Avengers, Chitwan Rhinos, Lumbini Lions, Karnali Yaks, and Sudurpaschim Royals — will participate in the 24-day competition.",
      "NPL Hub Nepal will provide independent coverage of all fixtures, standings, and team information throughout the season. All match times are listed in Nepal Standard Time (NPT, UTC+5:45).",
    ],
    category: "Tournament",
    publishedAt: "2026-09-25T10:00:00+05:45",
    updatedAt: "2026-09-25T10:00:00+05:45",
    featured: true,
    author: "NPL Hub Nepal Editorial",
    source: "Cricket Association of Nepal / NPL Hub Nepal",
    relatedTeamIds: [],
    status: "published",
    readTime: "3 min read",
    displayDate: "25 Sep 2026",
  },

  /* ── 2. Squads / Draft ──────────────────────────────────────────────────── */
  {
    id: "article-02",
    slug: "marquee-players-draft-highlights",
    title: "NPL Season 3 Player Draft & Squad Registration: What We Know",
    excerpt:
      "With Season 3 approaching, here is an overview of the squad registration process and what is publicly confirmed about team captains and squad status.",
    content: [
      "Nepal Premier League Season 3 squad announcements are expected ahead of the tournament's opening on 28 November 2026. This article summarises publicly available information about team captains and squad composition.",
      "Captain confirmations as of publication: Rohit Paudel captains the Kathmandu Gorkhas, Aasif Sheikh leads the Biratnagar Kings, Dipendra Singh Airee heads the Janakpur Bolts, and Kushal Malla leads the Pokhara Avengers.",
      "For the remaining four teams — Chitwan Rhinos, Lumbini Lions, Karnali Yaks, and Sudurpaschim Royals — official captain confirmations had not been publicly announced at time of writing. NPL Hub Nepal will update team profiles as verified information becomes available.",
      "The player draft process for NPL is managed by CAN. Overseas and domestic players are allocated to franchise teams through a structured draft. Full squad lists will be published once officially confirmed.",
      "NPL Hub Nepal does not publish unverified squad lists, transfer rumours, or unofficial player assignments. All team profile pages will be updated with confirmed squad information only.",
    ],
    category: "Teams",
    publishedAt: "2026-09-23T09:00:00+05:45",
    updatedAt: "2026-09-23T09:00:00+05:45",
    featured: false,
    author: "NPL Hub Nepal Editorial",
    source: "NPL Hub Nepal",
    relatedTeamIds: [
      "kathmandu-gorkhas",
      "biratnagar-kings",
      "janakpur-bolts",
      "pokhara-avengers",
    ],
    status: "published",
    readTime: "4 min read",
    displayDate: "23 Sep 2026",
  },

  /* ── 3. Broadcast ────────────────────────────────────────────────────────── */
  {
    id: "article-03",
    slug: "broadcast-and-streaming-guide-npl-season-3",
    title: "NPL Season 3 Broadcast & Streaming: Placeholder Information",
    excerpt:
      "Official broadcast and streaming details for NPL Season 3 have not been confirmed by CAN at time of writing. This page will be updated when details are released.",
    content: [
      "DRAFT NOTICE: Official broadcast and digital streaming arrangements for Nepal Premier League Season 3 have not been publicly confirmed by the Cricket Association of Nepal at time of writing. The information below reflects general context only.",
      "NPL Hub Nepal will update this article as soon as CAN or an official broadcaster releases streaming and TV coverage details for the 2026 season.",
      "Historically, NPL matches have been broadcast on national Nepali television channels and streamed via official digital platforms. Viewers outside Nepal have been able to access coverage through regional broadcast agreements and official streaming applications.",
      "Once confirmed, NPL Hub Nepal will publish a full guide including TV channels, digital streaming platforms, subscription details, and regional availability for Nepal and international audiences.",
      "For the latest information, follow official CAN announcements and check back on this page.",
    ],
    category: "Announcements",
    publishedAt: "2026-09-20T08:00:00+05:45",
    updatedAt: "2026-09-20T08:00:00+05:45",
    featured: false,
    author: "NPL Hub Nepal Editorial",
    source: "NPL Hub Nepal",
    relatedTeamIds: [],
    status: "draft",
    readTime: "2 min read",
    displayDate: "20 Sep 2026",
  },

  /* ── 4. Stadium & Ticketing ─────────────────────────────────────────────── */
  {
    id: "article-04",
    slug: "stadium-expansion-ticketing-update",
    title: "TU International Cricket Stadium & NPL Season 3 Ticketing: What Is Confirmed",
    excerpt:
      "TU International Cricket Stadium in Kirtipur is the confirmed venue for all NPL Season 3 fixtures. Ticketing arrangements are pending official announcement.",
    content: [
      "DRAFT NOTICE: Ticketing prices, booking platforms, and seating arrangements for NPL Season 3 have not been officially announced by the Cricket Association of Nepal at time of writing.",
      "TU International Cricket Stadium, Kirtipur, Kathmandu is the confirmed venue for all 32 matches of NPL Season 3. The stadium has hosted previous NPL editions and major international matches.",
      "The stadium is accessible from central Kathmandu by road. Kirtipur is located approximately 5 km southwest of central Kathmandu.",
      "NPL Hub Nepal will publish detailed ticketing information — including prices, booking methods, gate opening times, and ground regulations — as soon as this is officially confirmed by CAN or the NPL organising committee.",
      "Fans are advised to use only official ticket channels and to verify information through the official CAN website before making any purchase.",
    ],
    category: "Tournament",
    publishedAt: "2026-09-18T09:00:00+05:45",
    updatedAt: "2026-09-18T09:00:00+05:45",
    featured: false,
    author: "NPL Hub Nepal Editorial",
    source: "NPL Hub Nepal",
    relatedTeamIds: [],
    status: "draft",
    readTime: "3 min read",
    displayDate: "18 Sep 2026",
  },

  /* ── 5. Format & Points Table Explainer ─────────────────────────────────── */
  {
    id: "article-05",
    slug: "npl-season-3-format-playoff-structure-explained",
    title: "NPL Season 3 Format Explained: Group Stage, Playoffs & Points Table",
    excerpt:
      "A complete guide to how Nepal Premier League Season 3 works — group stage format, how the points table operates, and the four-team playoff structure.",
    content: [
      "Nepal Premier League Season 3 uses a round-robin group stage followed by a four-team playoff. Here is a complete breakdown of how the competition works.",
      "In the group stage, all eight teams play each other in a round-robin format. Each match awards 2 points to the winning team and 0 to the losing team. If a match is tied or has no result, each team receives 1 point. Net Run Rate (NRR) is used to separate teams level on points.",
      "After 28 group-stage matches, the top four teams on the points table qualify for the playoffs. The four-team playoff follows the IPL-style format: Qualifier 1 (1st vs 2nd, winner goes directly to the final), Eliminator (3rd vs 4th, loser is eliminated), Qualifier 2 (Qualifier 1 loser vs Eliminator winner), and the Final.",
      "The Final is scheduled for 5 Poush 2083 BS (21 December 2026) at TU International Cricket Stadium, Kirtipur.",
      "All 32 matches — 28 group stage plus 4 playoff — are played at TU International Cricket Stadium. This single-venue format ensures consistent conditions and concentrated fan attendance.",
      "NPL Hub Nepal provides a live points table page that will be updated throughout the tournament as results are confirmed.",
    ],
    category: "Tournament",
    publishedAt: "2026-09-15T10:00:00+05:45",
    updatedAt: "2026-09-15T10:00:00+05:45",
    featured: true,
    author: "NPL Hub Nepal Editorial",
    source: "Cricket Association of Nepal / NPL Hub Nepal",
    relatedTeamIds: [],
    status: "published",
    readTime: "4 min read",
    displayDate: "15 Sep 2026",
  },

  /* ── 6. Eight Teams Overview ─────────────────────────────────────────────── */
  {
    id: "article-06",
    slug: "npl-season-3-eight-franchise-teams-overview",
    title: "All 8 NPL Season 3 Franchise Teams: Regions, Captains & Squad Status",
    excerpt:
      "An independent overview of all eight Nepal Premier League Season 3 franchise teams, their regional identities, confirmed captains, and current squad status.",
    content: [
      "Nepal Premier League Season 3 features eight franchise teams representing different regions of Nepal. Here is an overview of each team based on publicly available information.",
      "Kathmandu Gorkhas represent the capital, Kathmandu. Captain: Rohit Paudel (confirmed). The team is one of the most-watched franchises given its capital city base.",
      "Biratnagar Kings represent the Koshi Province. Captain: Aasif Sheikh (confirmed). Biratnagar is Nepal's second-largest city and an important cricket hub in the eastern region.",
      "Janakpur Bolts represent Madhesh Province. Captain: Dipendra Singh Airee (confirmed). Dipendra is one of Nepal's most prominent T20 cricketers.",
      "Pokhara Avengers represent Gandaki Province. Captain: Kushal Malla (confirmed). Pokhara is Nepal's second-largest city and a tourism centre.",
      "Chitwan Rhinos represent Bagmati Province (southern). Squad and captain details were not officially confirmed at time of writing.",
      "Lumbini Lions represent Lumbini Province. Captain and full squad not officially confirmed at time of writing.",
      "Karnali Yaks represent Karnali Province. Squad and captain details were not officially confirmed at time of writing.",
      "Sudurpaschim Royals represent Sudurpashchim Province. Captain and full squad not officially confirmed at time of writing.",
      "NPL Hub Nepal will update all team profile pages as official squad and captain announcements are made by CAN and the respective franchise teams.",
    ],
    category: "Teams",
    publishedAt: "2026-09-10T10:00:00+05:45",
    updatedAt: "2026-09-10T10:00:00+05:45",
    featured: false,
    author: "NPL Hub Nepal Editorial",
    source: "NPL Hub Nepal",
    relatedTeamIds: [
      "kathmandu-gorkhas",
      "biratnagar-kings",
      "janakpur-bolts",
      "pokhara-avengers",
      "chitwan-rhinos",
      "lumbini-lions",
      "karnali-yaks",
      "sudurpaschim-royals",
    ],
    status: "published",
    readTime: "5 min read",
    displayDate: "10 Sep 2026",
  },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Helper Functions                                                           */
/*  These are the only data-access layer the UI components use.               */
/*  Future: replace the body of each function with a Supabase/API call.       */
/* ─────────────────────────────────────────────────────────────────────────── */

/** All articles sorted by publishedAt descending (newest first). */
export function getAllArticles(): NewsArticle[] {
  return [...NEWS_ARTICLES].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** Single article by slug — returns undefined if not found. */
export function getArticleBySlug(slug: string): NewsArticle | undefined {
  return NEWS_ARTICLES.find((a) => a.slug === slug);
}

/** Featured articles for hero section — newest first. */
export function getFeaturedArticles(): NewsArticle[] {
  return NEWS_ARTICLES.filter((a) => a.featured).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** Articles filtered by category — newest first. */
export function getArticlesByCategory(category: NewsCategory): NewsArticle[] {
  return NEWS_ARTICLES.filter((a) => a.category === category).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** Most recent n articles — for homepage widget. */
export function getLatestArticles(n: number): NewsArticle[] {
  return getAllArticles().slice(0, n);
}

/** All slugs — used by generateStaticParams. */
export function getAllArticleSlugs(): { slug: string }[] {
  return NEWS_ARTICLES.map((a) => ({ slug: a.slug }));
}

/** Articles related to a specific team. */
export function getArticlesByTeam(teamId: string): NewsArticle[] {
  return NEWS_ARTICLES.filter((a) => a.relatedTeamIds?.includes(teamId)).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** All distinct categories that have at least one article. */
export function getAvailableCategories(): NewsCategory[] {
  const seen = new Set<NewsCategory>();
  NEWS_ARTICLES.forEach((a) => seen.add(a.category));
  return Array.from(seen);
}
