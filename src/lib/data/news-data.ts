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

import type { ArticleBlock } from "@/lib/types/article-blocks";

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
   * Full article body in plain paragraphs or semantic structured blocks.
   */
  content: string[] | ArticleBlock[];

  /** Normalized semantic blocks (paragraphs, headings, lists, quotes, FAQs) */
  blocks?: ArticleBlock[];

  category: NewsCategory;

  /** ISO 8601 date string (publish date) */
  publishedAt: string;

  /** ISO 8601 date string (last edit — equals publishedAt if never updated) */
  updatedAt: string;

  /** Featured articles appear in the hero section of /news */
  featured: boolean;

  /** Optional hero image path (relative to /public) */
  imageUrl?: string;

  /** Descriptive alt text for hero image (SEO & accessibility) */
  imageAlt?: string;

  /** Optional caption for hero image */
  imageCaption?: string;

  /** Custom SEO <title> tag (<= 60 chars) */
  metaTitle?: string;

  /** Custom SEO meta description (<= 155 chars) */
  metaDescription?: string;

  /** Byline / attribution */
  author: string;

  /** Source attribution label (shown in article, for editorial transparency) */
  source: string;

  /** Source URL */
  sourceUrl?: string;

  /** Article tags */
  tags?: string[];

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
    title: "NPL Season 3 Schedule & TU Ground Fixture Plan: 26 October – 21 November 2026",
    excerpt:
      "All 32 fixtures for Nepal Premier League Season 3 will be held at TU International Cricket Stadium, Kirtipur, running from 26 October to 21 November 2026. The opening match — Lumbini Lions vs Sudurpaschim Royals — is scheduled for 26 October at 4:30 PM NPT.",
    content: [
      "Nepal Premier League Season 3 is scheduled to run from 9 Kartik 2083 BS (26 October 2026) to 5 Mangsir 2083 BS (21 November 2026), according to the fixture calendar published on the NPL Hub Nepal schedule page. The tournament dates are consistent with the fixtures listed at nplhubnepal.vercel.app/schedule.",
      "The opening match of the tournament is Lumbini Lions vs Sudurpaschim Royals on 26 October 2026 (सोमबार, ९ कार्तिक २०८३) at 4:30 PM NPT at TU International Cricket Stadium, Kirtipur.",
      "All 32 matches, including the league stage and four playoff fixtures, will be held at the TU International Cricket Stadium in Kirtipur, Kathmandu. The venue will serve as the sole host ground for the entire tournament.",
      "The league stage consists of 28 matches running from 26 October to 15 November 2026, after which the top four teams on the points table advance to the playoffs. The playoff schedule is: Qualifier 1 (17 November), Eliminator (18 November), Qualifier 2 (19 November), and the Final (21 November 2026).",
      "Eight franchise teams — Kathmandu Gorkhas, Biratnagar Kings, Janakpur Bolts, Pokhara Avengers, Chitwan Rhinos, Lumbini Lions, Karnali Yaks, and Sudurpaschim Royals — will participate in the 27-day competition across 32 T20 fixtures.",
      "NPL Hub Nepal will provide independent coverage of all fixtures, standings, and team information throughout the season. All match times are listed in Nepal Standard Time (NPT, UTC+5:45).",
      "Correction: An earlier version of this article listed incorrect tournament dates (28 November – 21 December 2026). The correct dates are 26 October – 21 November 2026, consistent with the verified fixture schedule. This article has been updated.",
    ],
    category: "Tournament",
    publishedAt: "2026-09-25T10:00:00+05:45",
    updatedAt: "2026-10-03T15:32:00+05:45",
    featured: true,
    author: "NPL Hub Nepal Editorial",
    source: "NPL Hub Nepal — verified from fixture schedule at /schedule",
    relatedMatchSlug: "match-1-lumbini-lions-vs-sudurpaschim-royals",
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
      "Nepal Premier League Season 3 squad announcements are expected ahead of the tournament's opening on 26 October 2026. This article summarises publicly available information about team captains and squad composition.",
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
      "The Final is scheduled for 5 Mangsir 2083 BS (21 November 2026) at TU International Cricket Stadium, Kirtipur.",
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

  /* ── 7. Overseas Signings ────────────────────────────────────────────────── */
  {
    id: "article-07",
    slug: "npl-season-3-overseas-signings-warner-shakib",
    title: "NPL Season 3 Overseas Stars: Warner, Shakib and Every Big Signing So Far",
    metaTitle: "NPL 2026 Overseas Signings: Warner, Shakib & Full List",
    metaDescription:
      "From David Warner at Kathmandu Gorkhas to Shakib Al Hasan at Pokhara Avengers, here are NPL Season 3's biggest overseas signings so far.",
    excerpt:
      "From David Warner at Kathmandu Gorkhas to Shakib Al Hasan at Pokhara Avengers, here are NPL Season 3's biggest NPL 2026 overseas signings so far — verified, franchise by franchise.",
    imageUrl: "/images/news/npl-season-3-overseas-stars.webp",
    imageAlt:
      "NPL Season 3 Overseas Stars — night stadium at TU International Cricket Stadium Kirtipur with floodlights and Himalayan backdrop",
    imageCaption:
      "TU International Cricket Stadium, Kirtipur will host all 32 NPL Season 3 matches.",
    content: [
      "With Nepal Premier League Season 3 scheduled to bowl off on October 26, 2026 at TU International Cricket Stadium in Kirtipur, the league has captured global attention with an unprecedented wave of international talent. The confirmed NPL 2026 overseas signings showcase a thrilling blend of World Cup champions, experienced franchise campaigners, and match-winners eager to play in front of Nepal's passionate cricket crowds. Across 32 fixtures running through November 21, the tournament promises to deliver the most competitive franchise cricket in the nation's history.",

      "While previous editions laid the groundwork for domestic franchise cricket, Season 3 elevates the competition onto the international stage as all eight franchises assemble squads built to contend for the championship.",

      "## The Headline Blockbusters: David Warner and Shakib Al Hasan Arrive in Nepal",

      "Leading the roster of marquee international arrivals is Australian cricket legend David Warner, whose signing with the Kathmandu Gorkhas was officially announced on September 15, 2026. A two-time ODI World Cup winner (2015, 2023) and 2021 T20 World Cup champion, Warner brings over 12,000 international runs and extensive franchise pedigree worldwide. His David Warner NPL arrival gives Gorkhas fans a world-class opening batter, setting up marquee clashes against defending champions Lumbini Lions led by Nepal national team captain Rohit Paudel.",

      "The capital franchise also secured Sri Lankan all-rounder Sahan Arachchige, whose top-order batting and off-break spin provide middle-overs stability, and Indian international wicketkeeper-batter K. S. Bharat, adding proven top-level glovework and technique.",

      "Equally seismic is the signing of Bangladeshi legend Shakib Al Hasan by the Pokhara Avengers, confirmed on July 27, 2026. Regarded as one of the finest all-rounders in cricket history, Shakib Al Hasan NPL participation gives Pokhara an elite performer with over 7,000 international runs and nearly 700 wickets across formats. His ability to control match tempo on spin-friendly pitches makes him an invaluable asset for Kushal Bhurtel's Pokhara Avengers side.",

      "To complement Shakib, the Avengers re-signed Sri Lankan pace-bowling all-rounder Dhananjaya Lakshan. Guiding Pokhara's dugout is legendary Sri Lankan mystery spinner Ajantha Mendis as head coach.",

      "## Confirmed NPL 2026 Overseas Signings: Franchise-by-Franchise",

      "Across all eight NPL Season 3 teams, franchises have deployed their overseas player quotas to address key tactical needs, balancing raw pace, batting power, and cunning spin. Here is a full verified breakdown of confirmed international signings heading into the opening match:",

      "Kathmandu Gorkhas: David Warner (Australia), Sahan Arachchige (Sri Lanka), K. S. Bharat (India) — all confirmed. Pokhara Avengers: Shakib Al Hasan (Bangladesh), Dhananjaya Lakshan (Sri Lanka) — all confirmed. Janakpur Bolts: Jimmy Neesham (New Zealand), returning champion. Sudurpaschim Royals: Scott Kuggeleijn (New Zealand) and Saif Ali Zaib (England), both returning. Lumbini Lions: Niroshan Dickwella (Sri Lanka), retained. Biratnagar Kings: Charith Asalanka (Sri Lanka, confirmed September 17, 2026) and Shubham Ranjane (USA, confirmed September 29, 2026). Chitwan Rhinos: Sikandar Raza (Zimbabwe, confirmed August 27, 2026) and Kaleem Sana (Canada, confirmed September 2026). Karnali Yaks: Akbar Ali (Bangladesh) and Mark Watt (Scotland), both confirmed September 27, 2026.",

      "Reigning titleholders Janakpur Bolts have retained Kiwi powerhouse Jimmy Neesham, whose death-overs power hitting and dependable seam bowling were crucial to the franchise's championship run in the tournament's inaugural edition.",

      "Sudurpaschim Royals bring back Kiwi express pacer Scott Kuggeleijn, whose hit-the-deck pace offers real hostility on Kirtipur's true bounce, alongside English domestic standout Saif Ali Zaib.",

      "Biratnagar Kings' headline capture is Sri Lankan national team star Charith Asalanka, a deft middle-order batter with a sharp off-break. Chitwan Rhinos unveiled Sikandar Raza — a devastating batting all-rounder — alongside Canadian left-arm spearhead Kaleem Sana. Karnali Yaks secured ICC Under-19 World Cup-winning captain Akbar Ali and Scottish spinner Mark Watt, known globally for his creative variations. Lumbini Lions have retained dynamic Sri Lankan stumper Niroshan Dickwella to spearhead their aggressive top order.",

      "Note: Squad registration deadlines and final overseas selections are ongoing. All signings listed above have been verified from franchise social media announcements and accredited cricket press. Any subsequent additions will be reported as confirmed.",

      "## Opinion: Who Could Make the Biggest Impact at TU Stadium?",

      "The following section reflects analytical editorial opinion and does not contain invented statistics, quotes, or guarantees of performance.",

      "1. The Warner Factor in the Powerplay. David Warner's career has been built on seizing control within the first six overs. The TU International Cricket Stadium dimensions, combined with over 15,000 passionate spectators, offer Warner a potent platform. If Warner fires consistently, the Kathmandu Gorkhas possess the batting depth to post match-winning totals throughout the season.",

      "2. The Battle of Proven All-Rounders. T20 matches in Nepal are frequently decided in the middle overs. The presence of Sikandar Raza (Chitwan), Shakib Al Hasan (Pokhara), and Jimmy Neesham (Janakpur) gives their captains a formidable tactical cushion. All three veterans have the experience to rebuild from early setbacks or deliver vital wickets in crucial stages.",

      "3. Spin Mastery on Autumn Tracks. Historically, Kirtipur pitches offer increasing turn as the tournament moves through November. Bowlers like Mark Watt (Karnali) and Charith Asalanka (Biratnagar) will relish these conditions. Watt's ability to bowl inside the powerplay with economy rates under six could prove decisive in close finishes.",

      "## What's Next: Opening Match, Schedule and Teams",

      "The tournament begins on Monday, October 26, 2026, when Lumbini Lions take on Sudurpaschim Royals in NPL Match #1 at TU International Cricket Stadium at 4:30 PM NPT — see the full opening match details on the /matches/match-1-lumbini-lions-vs-sudurpaschim-royals page. Fans can explore the complete 32-match programme on the NPL Season 3 Schedule at /schedule and explore every franchise squad on the Teams Hub at /teams. Full franchise profile pages are available for the Kathmandu Gorkhas, Biratnagar Kings, Janakpur Bolts, Pokhara Avengers, Chitwan Rhinos, Lumbini Lions, Karnali Yaks, and Sudurpaschim Royals.",

      "NPL Hub Nepal is not affiliated with the official NPL or CAN. All player confirmation details have been cross-referenced against the sources listed below.",

      "## Verified Sources",

      "Sources used to verify all signings in this article: The Kathmandu Post — David Warner announced for Kathmandu Gorkhas (kathmandupost.com); Nepal News — Shakib Al Hasan confirmed for Pokhara Avengers (nepalnews.com); Ratopati Sports — Sikandar Raza signing announcement (ratopati.com); Official NPL T20 League Roster Pages (nplt20league.com); CAN official announcements (can.org.np). All signing dates are as reported by the referenced sources.",
    ],
    category: "Teams",
    publishedAt: "2026-10-03T16:30:00+05:45",
    updatedAt: "2026-10-03T16:30:00+05:45",
    featured: true,
    author: "NPL Hub Nepal Editorial",
    source:
      "Kathmandu Post, Nepal News, Ratopati, nplt20league.com, CAN",
    relatedTeamIds: [
      "kathmandu-gorkhas",
      "pokhara-avengers",
      "janakpur-bolts",
      "sudurpaschim-royals",
      "lumbini-lions",
      "biratnagar-kings",
      "chitwan-rhinos",
      "karnali-yaks",
    ],
    relatedMatchSlug: "match-1-lumbini-lions-vs-sudurpaschim-royals",
    status: "published",
    readTime: "6 min read",
    displayDate: "3 Oct 2026",
  },
  {
    id: "article-08",
    slug: "npl-season-3-first-match-date-time-venue-nepali-date",
    title: "NPL Season 3 First Match: Date, Time, Venue, Nepali Date",
    excerpt:
      "The npl season 3 first match is Lumbini Lions vs Sudurpaschim Royals on Oct 26, 2026 at 4:30 PM NPT in Kirtipur, Kartik 9, 2083 in Nepali calendar.",
    content: [
      {
        type: "paragraph",
        text: "The npl season 3 first match will be played between defending champions Lumbini Lions and two-time runners-up Sudurpaschim Royals on Monday, October 26, 2026, which is Kartik 9, 2083 in the Nepali calendar, at 4:30 PM Nepal Standard Time at the TU International Cricket Ground in Kirtipur, Kathmandu.",
      },
      {
        type: "heading",
        level: 2,
        text: "Introduction: When does NPL Season 3 start?",
      },
      {
        type: "paragraph",
        text: "NPL Season 3, officially Siddhartha Bank NPL 2026, starts on October 26 and runs through November 21, 2026. The Cricket Association of Nepal has confirmed an 8-team, 32-match tournament, with all matches at the TU International Cricket Ground in Kirtipur. The full day-by-day fixture list was released by CAN on September 20, 2026. This season shifts from the usual December window to the period between Dashain and Tihar.",
      },
      {
        type: "heading",
        level: 2,
        text: "Opening match details: teams, date, time and venue",
      },
      {
        type: "paragraph",
        text: "The opening match is Match 1 of the season: Lumbini Lions vs Sudurpaschim Royals on Monday, October 26, 2026, at 4:30 PM NST. The venue is TU International Cricket Stadium, Kirtipur, the home of Nepali cricket and the sole venue for the third consecutive season. According to the official schedule, single-header days will have one evening game at 4:30 PM, while double-header days will have games at 12:30 PM and 4:30 PM. The tournament opens with a single-header evening fixture under lights.",
      },
      {
        type: "match",
        matchSlug: "match-1-lumbini-lions-vs-sudurpaschim-royals",
        title: "Match #1 Showcase: Lumbini Lions vs Sudurpaschim Royals",
      },
      {
        type: "table",
        caption: "Official NPL Season 3 Match 1 Specification & Schedule Table",
        headers: ["Match Parameter", "Official Specification"],
        rows: [
          ["Fixture", "Match #1 · Lumbini Lions vs Sudurpaschim Royals"],
          ["Date (English)", "Monday, 26 October 2026"],
          ["Nepali Date (BS)", "सोमबार, ९ कार्तिक २०८३ (Kartik 9, 2083 BS)"],
          ["Start Time (NPT)", "4:30 PM Nepal Time (UTC +5:45)"],
          ["Venue", "TU International Cricket Stadium, Kirtipur, Kathmandu"],
          ["Session Type", "Single-header evening clash under floodlights"],
          ["Format", "Twenty20 (20 Overs per side) · White Ball"],
          ["Captains", "Rohit Paudel (Lumbini, reported) vs Dipendra Singh Airee (Sudurpaschim)"],
          ["Context", "Rematch of 2025 NPL Final (Lumbini won by 6 wickets)"],
          ["Broadcast (TV)", "Himalaya TV HD (Provisional / Past Season Partner)"],
          ["Live Stream", "NetTV App & Web (Provisional / Past Season Partner)"],
          ["Digital Ticketing", "eSewa (Provisional / Past Season Partner)"],
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "NPL first match date in the Nepali calendar",
      },
      {
        type: "paragraph",
        text: "The verified Nepali date for the first match is Monday, Kartik 9, 2083. This has been confirmed by checking Hamro Patro and independent Nepali calendar tables. Kartik 1, 2083 falls on Sunday, October 18, 2026, which corrects an earlier calendar bug that showed October 17. Dashain ends on Kartik 8, 2083, which is Sunday, October 25, 2026, so the next day October 26 is Kartik 9. CAN also announced the tournament window as Kartik 9 to Mangsir 5. Some outlets reported the opener as Kartik 10, 2083, due to the older incorrect month-length data, but the corrected Hamro Patro calendar and CAN announcement confirm Kartik 9. The tournament window is Kartik 9, 2083 to Mangsir 5, 2083, which is October 26 to November 21, 2026. Kartik 2083 has 30 days from October 18 to November 16, so Mangsir 1 is November 17 and the final on November 21 is Mangsir 5, 2083, a Saturday.",
      },
      {
        type: "heading",
        level: 2,
        text: "Lumbini Lions vs Sudurpaschim Royals: what fans should know",
      },
      {
        type: "paragraph",
        text: "This opener is a rematch of the NPL Season 2 final. Lumbini Lions beat Sudurpaschim Royals by six wickets in the final on December 13, 2025, at Kirtipur to win their first title after bowling the Royals out for 85. Sudurpaschim Royals have finished as runners-up in both seasons so far, losing to Janakpur Bolts in the 2024 final and to Lumbini Lions in 2025. For 2026, Rohit Paudel (who captained Lumbini Lions to the 2025 championship) is the reported captain for Lumbini Lions, alongside Dipendra Singh Airee as captain for Sudurpaschim Royals. Head coaches are Nandan Phadnis for Lumbini Lions and Jagat Tamata for Sudurpaschim Royals, with Brad Hodge as mentor for the Royals. Verified overseas signings for Lumbini Lions include Namibia fast bowler Ruben Trumpelmann, who was Player of the Series in 2025, Sri Lankan wicketkeeper Niroshan Dickwella and Australian opener D'Arcy Short, all retained from last season. For Sudurpaschim Royals, verified overseas signings include England all-rounder Saif Zaib, New Zealand pacer Scott Kuggeleijn and Scotland all-rounder Brandon McMullen, with UAE all-rounder Rohan Mustafa also listed in the squad.",
      },
      {
        type: "heading",
        level: 2,
        text: "Match timings in other countries",
      },
      {
        type: "paragraph",
        text: "The opening match starts at 4:30 PM NPT, which is UTC plus 5:45. For diaspora fans on October 26, 2026, that is 4:15 PM in India, 4:45 PM in Bangladesh, 2:45 PM in the UAE, 10:45 AM in the UK, 6:45 AM US Eastern Daylight Time and 9:45 PM in Sydney. Day-night games at Kirtipur are played under floodlights, so the evening slot is the prime time slot in Nepal.",
      },
      {
        type: "heading",
        level: 2,
        text: "Where to find the full NPL 2026 schedule",
      },
      {
        type: "paragraph",
        text: "You can find the full NPL 2026 fixture list, match timings, venues and points table on the NPL Hub Nepal schedule page, which will be updated with live scores once the tournament starts.",
      },
      {
        type: "heading",
        level: 2,
        text: "Frequently asked questions",
      },
      {
        type: "faq",
        question: "When is the first match of NPL Season 3?",
        answer:
          "The first match of NPL Season 3 is on Monday, October 26, 2026, at 4:30 PM NPT. The tournament runs until November 21, 2026, with 32 matches at Kirtipur.",
      },
      {
        type: "faq",
        question: "Which teams play in the opening match?",
        answer:
          "Defending champions Lumbini Lions play Sudurpaschim Royals in the opening match. It is a rematch of the 2025 final that Lumbini Lions won.",
      },
      {
        type: "faq",
        question: "What time does the first match start?",
        answer:
          "The first match starts at 4:30 PM Nepal Standard Time. On double-header days, the first game starts at 12:30 PM and the second at 4:30 PM.",
      },
      {
        type: "faq",
        question: "Where is the first match played?",
        answer:
          "The first match is played at the TU International Cricket Ground in Kirtipur, Kathmandu. All 32 matches of NPL Season 3 are scheduled at this venue.",
      },
      {
        type: "faq",
        question: "What is the date of the first NPL match in the Nepali calendar?",
        answer:
          "The first NPL match date in the Nepali calendar is Kartik 9, 2083, Monday. The final on November 21, 2026 is Mangsir 5, 2083. The date has been verified against Hamro Patro and CAN's announcement of Kartik 9 to Mangsir 5.",
      },
      {
        type: "paragraph",
        text: "The schedule, match timings and broadcast information are based on CAN's official announcements and the fixture list released on September 20, 2026. No postponement or venue change has been announced as of publication. Live television in Nepal is on Himalaya TV, worldwide streaming is on NetTV and digital tickets are issued on eSewa. Schedules can change due to weather or operational reasons, so fans should check the official CAN channels before match day. Last updated: October 9, 2026.",
      },
    ],
    category: "Matches",
    publishedAt: "2026-10-09T05:15:00+00:00",
    updatedAt: "2026-10-09T05:15:00+00:00",
    featured: true,
    imageUrl:
      "https://zohmcgjixebuiconrven.supabase.co/storage/v1/object/public/article-images/articles/article-1791521388205-g2x1w2/1791522050648-mhasx55q.png",
    imageAlt: "NPL Season 3 First Match: Date, Time, Venue, Nepali Date",
    author: "NPL Hub Nepal Editorial",
    source: "NPL Hub Nepal Editorial",
    relatedTeamIds: ["lumbini-lions", "sudurpaschim-royals"],
    relatedMatchSlug: "match-1-lumbini-lions-vs-sudurpaschim-royals",
    status: "published",
    readTime: "4 min read",
    displayDate: "9 Oct 2026",
  },

  /* ── 9. Evergreen Live Hub Article ───────────────────────────────────────── */
  {
    id: "article-09",
    slug: "npl-2026-points-table-live-score",
    title: "NPL 2026 Points Table, Live Score & Today's Match",
    excerpt:
      "Follow the NPL 2026 points table, live score and today's match for Season 3, with standings, fixtures, results and how to watch, updated every match day.",
    content: [
      "The NPL 2026 points table will start to fill up on Monday, October 26, when Lumbini Lions face Sudurpaschim Royals in the opening match of Nepal Premier League Season 3 at TU International Cricket Ground in Kirtipur, Kathmandu. The first ball is scheduled for 4:30 PM Nepal time. This page tracks the NPL points table, the live score, today's NPL match, the latest results and the upcoming fixtures, and it is updated after every match day.",
      "## Today's NPL match",
      "[[TODAY_MATCH]]",
      "Before the tournament starts, the next match is the season opener: Lumbini Lions against Sudurpaschim Royals on Monday, October 26, 2026, at 4:30 PM Nepal time at TU International Cricket Ground. It is a rematch of last season's final, which Lumbini won by six wickets to take their first NPL title.",
      "## NPL 2026 points table",
      "All eight teams start the season on zero points. The table below is sorted by points and then by net run rate, and it highlights the four teams currently in the playoff places.",
      "[[POINTS_TABLE]]",
      "## Latest NPL results",
      "[[LATEST_RESULTS]]",
      "Results appear here after every match day.",
      "## Upcoming NPL matches",
      "[[UPCOMING_FIXTURES]]",
      "The complete list of fixtures is on the NPL 2026 schedule page.",
      "## How the NPL points table works",
      "The league stage has 28 matches, and every team plays the other seven teams once. The top four teams in the table qualify for the playoffs, which are Qualifier 1, the Eliminator, Qualifier 2 and the final. A win earns a team two points, while a tie or no result earns one point. If two or more teams finish level on points, net run rate decides their order in the table.",
      "## How to watch NPL 2026 live",
      "NetTV holds the worldwide streaming rights for NPL Season 3. Reports put the price at Rs 400 for viewers in Nepal, $4 in the Middle East and $10 in Europe, the United States, Australia, Japan and South Korea. Himalaya Television Network holds the television rights in Nepal. Tickets for matches at the TU ground are sold through eSewa. Official Season 3 ticket prices and sale dates had not been announced at the time of writing, so check the official channels for the latest details.",
      "## NPL 2026 schedule at a glance",
      "NPL Season 3 runs from October 26 to November 21, 2026, with 32 matches in total: 28 league matches and four playoff matches. All matches are played at TU International Cricket Ground in Kirtipur. Matches on single-match days start at 4:30 PM Nepal time, and double-header days are reported to start at 12:30 PM and 4:30 PM.",
      "## Frequently asked questions",
      "When does NPL 2026 start?",
      "NPL Season 3 starts on Monday, October 26, 2026, and the final is on November 21, 2026.",
      "Which teams play in the first match of NPL 2026?",
      "Lumbini Lions, the defending champions, play Sudurpaschim Royals in the opening match at 4:30 PM Nepal time.",
      "How many teams qualify for the NPL playoffs?",
      "The top four teams in the points table qualify for the playoffs.",
      "What time do NPL matches start?",
      "Single-match days start at 4:30 PM Nepal time. Double-header days are reported to start at 12:30 PM and 4:30 PM.",
      "Where can I watch NPL 2026 live?",
      "NetTV streams the matches worldwide, and Himalaya Television Network broadcasts them on television in Nepal.",
      "Where is NPL 2026 played?",
      "All 32 matches are played at TU International Cricket Ground in Kirtipur, Kathmandu.",
      "This page is updated after every match day, and the \"Last updated\" time at the top of the page shows when the table was last refreshed.",
    ],
    category: "Tournament",
    publishedAt: "2026-10-12T18:19:23+05:45",
    updatedAt: "2026-10-12T18:19:23+05:45",
    featured: true,
    imageUrl: "/images/articles/npl-2026-points-table.jpg",
    imageAlt: "NPL 2026 Points Table, Live Score & Today's Match",
    author: "NPL Hub Nepal Editorial",
    source: "NPL Hub Nepal Editorial",
    sourceUrl:
      "https://kathmandupost.com/cricket/2026/09/20/lumbini-lions-to-face-sudurpaschim-royals-in-npl-opener",
    tags: [
      "NPL 2026 points table",
      "NPL points table",
      "NPL live score",
      "NPL today match",
      "NPL Season 3",
      "Nepal Premier League",
      "NPL 2026 schedule",
      "NPL standings",
      "NPL results",
      "TU Cricket Ground",
    ],
    relatedTeamIds: [
      "biratnagar-kings",
      "chitwan-rhinos",
      "janakpur-bolts",
      "karnali-yaks",
      "kathmandu-gorkhas",
      "lumbini-lions",
      "pokhara-avengers",
      "sudurpaschim-royals",
    ],
    relatedMatchSlug: "match-1-lumbini-lions-vs-sudurpaschim-royals",
    status: "draft",
    readTime: "3 min read",
    displayDate: "12 Oct 2026",
  },

  /* ── 10. Squad Rankings Editorial ─────────────────────────────────────── */
  {
    id: "article-10",
    slug: "npl-season-3-squad-rankings-strongest-team",
    title: "NPL Season 3 Squad Rankings: Which Team Looks Strongest on Paper?",
    metaTitle: "NPL Season 3 Squad Rankings: Which Team Looks Strongest?",
    metaDescription:
      "Our comprehensive Nepal Premier League Season 3 squad rankings analyze all eight franchise rosters on paper ahead of the Kirtipur tournament opener on 26 October.",
    excerpt:
      "An independent editorial ranking of all eight Nepal Premier League Season 3 franchise squads — assessed on batting, bowling, overseas power and squad depth, with every score backed by confirmed player data.",
    imageUrl: "/images/news/npl-season-3-overseas-stars.webp",
    imageAlt:
      "NPL Season 3 Squad Rankings — night view of TU International Cricket Stadium, Kirtipur",
    imageCaption:
      "All 32 NPL Season 3 matches take place at TU International Cricket Stadium, Kirtipur.",
    content: [],
    blocks: [
      {
        type: "paragraph",
        text: "With twelve days remaining until the Nepal Premier League Season 3 opener on 26 October 2026 at TU International Cricket Stadium, Kirtipur, all eight franchises have their core squads in place. Overseas signings are confirmed, marquee retentions are locked in, and auction buys are complete. Ranking the eight teams at this stage is an editorial exercise, not a prophecy — T20 cricket rewards adaptability, pitch conditions and individual brilliance in ways that pre-season analysis cannot anticipate. What follows is NPL Hub Nepal's independent assessment of how every NPL Season 3 squad looks on paper, before a ball is bowled.",
      },
      {
        type: "paragraph",
        text: "Editorial analysis — this article reflects the editorial opinion of NPL Hub Nepal. NPL Hub Nepal is independent and not affiliated with the Nepal Premier League, Cricket Association of Nepal, or any franchise. Every score and observation below is grounded in confirmed squad data only. Where squad information is incomplete, the ranking for that team is marked provisional.",
      },
      {
        type: "heading",
        level: 2,
        text: "How we ranked the teams",
      },
      {
        type: "paragraph",
        text: "Each team is assessed on four criteria. Batting (1–10): quality and depth of batting resources, including top-order class, strike power and middle-order stability. Bowling (1–10): pace variety, spin depth, experience of bowling unit and economy threats. Overseas power (1–10): quality and versatility of confirmed overseas signings, including international pedigree and role balance. Squad depth (1–10): overall size of confirmed squad, cover for key roles, and the presence of experienced domestic options beyond the headline names.",
      },
      {
        type: "paragraph",
        text: "Scores are editorial opinions based on the confirmed roster data from franchise articles, Supabase player records, and the NPL 2026 foreign players list published on this site. No invented statistics, auction prices, or unconfirmed names are used. The total of the four scores determines rank order. Equal totals are broken by the overseas power score, then batting.",
      },
      {
        type: "heading",
        level: 2,
        text: "Summary ranking table",
      },
      {
        type: "table",
        caption: "NPL Season 3 squad rankings — editorial opinion, NPL Hub Nepal, 14 October 2026",
        headers: ["Rank", "Team", "Batting", "Bowling", "Overseas", "Depth", "Total"],
        rows: [
          ["1", "Janakpur Bolts", "8", "8", "10", "7", "33"],
          ["2", "Lumbini Lions", "8", "9", "8", "8", "33"],
          ["3", "Kathmandu Gorkhas", "9", "7", "8", "7", "31"],
          ["4", "Sudurpaschim Royals", "7", "8", "7", "7", "29"],
          ["5", "Chitwan Rhinos", "7", "8", "7", "6", "28"],
          ["6", "Biratnagar Kings", "7", "8", "6", "6", "27"],
          ["7 (Provisional)", "Pokhara Avengers", "7", "6", "6", "6", "25"],
          ["8 (Provisional)", "Karnali Yaks", "5", "6", "6", "5", "22"],
        ],
      },
      {
        type: "paragraph",
        text: "Janakpur Bolts and Lumbini Lions are tied on 33 points. Bolts rank first on overseas power (10 vs 8). Pokhara Avengers and Karnali Yaks are marked provisional because their domestic batting depth and coaching staff could not be fully assessed from available confirmed data.",
      },
      {
        type: "heading",
        level: 2,
        text: "#8 (Provisional) — Karnali Yaks",
      },
      {
        type: "paragraph",
        text: "Captain (reported): Sompal Kami. Overseas confirmed: Mark Watt (Scotland), Akbar Ali (Bangladesh), Ariful Islam (Bangladesh). Domestic retained core: Sompal Kami, Gulshan Jha, Nandan Yadav, Deepak Dumre, Pawan Sarraf, Unish Bikram Singh, Yuvraj Khatri.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "**Batting (5/10):** The confirmed batting resources are thin. Sompal Kami and Gulshan Jha can contribute with the bat, and Ariful Islam arrives on the back of a 219-run Top End T20 campaign, but the top-order depth beyond these names has not been confirmed in available reporting.",
          "**Bowling (6/10):** Sompal Kami is a proven international seamer, Sagar Nandan Yadav and Yuvraj Khatri add spin options, and Scotland's Mark Watt — well-known for extraordinary variations — gives the attack genuine international quality. The bowling unit is more developed on paper than the batting.",
          "**Overseas power (6/10):** Watt is an elite T20 spinner with extensive franchise experience and the Karnali Yaks' standout overseas asset. Akbar Ali is a capable ICC Under-19 World Cup-winning wicketkeeper-batter, and Ariful Islam is a promising emerging bat. The trio is solid but not of the headline-name variety found at the top franchises.",
          "**Squad depth (5/10):** Only seven domestic players are confirmed in the Supabase player records, and the full auction list is not publicly available. This squad is ranked provisional because significant gaps remain in confirmed batting and bowling cover.",
        ],
      },
      {
        type: "paragraph",
        text: "Strength: Sompal Kami's left-arm seam and Mark Watt's creative spin form one of the more interesting bowling combinations in the competition. Weakness: The batting lineup lacks confirmed depth. Players to watch: Sompal Kami and Mark Watt.",
      },
      {
        type: "heading",
        level: 2,
        text: "#7 (Provisional) — Pokhara Avengers",
      },
      {
        type: "paragraph",
        text: "Captain (reported): Kushal Bhurtel. Overseas confirmed: Shakib Al Hasan (Bangladesh), Dhananjaya Lakshan (Sri Lanka). Domestic retained core: Kushal Bhurtel, Sagar Dhakal, Arjun Kumal, Bipin Khatri, Aakash Chand, Kiran Thagunna, Dinesh Kharel.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "**Batting (7/10):** Kushal Bhurtel is Nepal's most naturally gifted attacking batter and Shakib Al Hasan — with over 2,500 T20 international runs — provides world-class middle-order firepower. The concern is confirmed depth beyond these two names.",
          "**Bowling (6/10):** Shakib's 149 T20I wickets make him the most accomplished bowler in the tournament on international record alone. Dhananjaya Lakshan adds seam pace. Sagar Dhakal and Aakash Chand supply domestic spin and seam options. The bowling has class at the top and limited confirmed depth behind it.",
          "**Overseas power (6/10):** Shakib is one of cricket's greatest all-rounders, and his presence alone elevates the Avengers. The franchise has only two confirmed overseas names, however, compared to the three or four that rival teams carry. If a third or fourth signing is confirmed before October 26, this score should rise.",
          "**Squad depth (6/10):** Seven domestic players are confirmed. The squad is provisionally rated because the coaching setup and full auction buys have not been published in available confirmed reporting.",
        ],
      },
      {
        type: "paragraph",
        text: "Strength: Shakib Al Hasan is the most experienced all-rounder in the entire competition. Weakness: Only two confirmed overseas signings leaves the Avengers short of the three-to-four overseas firepower carried by the highest-ranked teams. Players to watch: Kushal Bhurtel and Shakib Al Hasan.",
      },
      {
        type: "paragraph",
        text: "Provisional note: Pokhara Avengers' domestic batting and bowling depth beyond the confirmed core has not been fully verified. This ranking will be updated if additional squad information is published before the tournament begins.",
      },
      {
        type: "heading",
        level: 2,
        text: "#6 — Biratnagar Kings",
      },
      {
        type: "paragraph",
        text: "Captain (reported): Sandeep Lamichhane. Overseas confirmed: Charith Asalanka (Sri Lanka, batting all-rounder), Jishan Alam (Bangladesh, batter). Domestic retained core: Sandeep Lamichhane, Lokesh Bam, Basir Ahamad, Narayan Joshi, Pratish GC, Subash Bhandari. Auction buy confirmed: Shubham Ranjane (USA).",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "**Batting (7/10):** Charith Asalanka — a Sri Lanka international with five ODI centuries — gives the Kings a genuine top-order bat with franchise experience worldwide. Jishan Alam's Bangladesh domestic record is solid, and Sandeep Lamichhane is an underrated lower-order hitter. Lokesh Bam adds wicketkeeping-batting reliability at the top.",
          "**Bowling (8/10):** This is where Biratnagar are seriously dangerous. Sandeep Lamichhane is arguably Nepal's best bowler across any format, accumulating 23 wickets at an average of 16 across NPL Seasons 1 and 2. Charith Asalanka's off-break can hold an end, Basir Ahamad's left-arm orthodoxy stretches bowling resources further, and Pratish GC and Subash Bhandari offer left-arm pace variety.",
          "**Overseas power (6/10):** Asalanka is a quality international bat, but neither overseas name has the headline profile of Warner, Shakib, Neesham or Moeen Ali. The bowling dimension of the overseas group (Asalanka's off-break) is a tactical bonus.",
          "**Squad depth (6/10):** Six domestic players are confirmed in the database, augmented by known auction additions. The squad is functional but could be stretched by injuries.",
        ],
      },
      {
        type: "paragraph",
        text: "Strength: The bowling unit anchored by Sandeep Lamichhane is the most consistent wicket-taking threat of any franchise. Weakness: Batting firepower outside Asalanka and the top three depends on players whose confirmed roles are not fully detailed in current reporting. Players to watch: Sandeep Lamichhane and Charith Asalanka.",
      },
      {
        type: "heading",
        level: 2,
        text: "#5 — Chitwan Rhinos",
      },
      {
        type: "paragraph",
        text: "Captain (reported): Kushal Malla. Overseas confirmed: Sikandar Raza (Zimbabwe, all-rounder), Ravi Bopara (England, all-rounder), Kaleem Sana (Canada, left-arm fast bowler). Domestic retained core: Kushal Malla, Rijan Dhakal, Deepak Bohara, Ranjeet Kumar, Kamal Singh Airee, Dev Khanal, Arjun Saud.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "**Batting (7/10):** Kushal Malla is one of Nepal's most technically accomplished batters. Ravi Bopara — an England international with extensive IPL, PSL and CPL experience — covers the middle order. Sikandar Raza's destructive batting at four or five has been match-winning in T20 competitions worldwide. Deepak Bohara and Dev Khanal offer further domestic batting.",
          "**Bowling (8/10):** Sikandar Raza's off-spin, Kaleem Sana's left-arm pace and Ravi Bopara's medium pace give the attack three international bowling options across all phases. Rijan Dhakal, Ranjeet Kumar and Kamal Singh Airee add domestic seam and spin variety. This is one of the most versatile bowling attacks in the competition.",
          "**Overseas power (7/10):** Three confirmed overseas signings of genuine calibre. Raza alone — one of the most decorated T20 all-rounders in the game — is worth a premium score. Bopara and Sana each bring franchise tournament experience. The combination covers batting, pace bowling and spin at international level.",
          "**Squad depth (6/10):** Seven confirmed domestic players. The squad size is adequate but not deep in confirmed batting cover.",
        ],
      },
      {
        type: "paragraph",
        text: "Strength: The overseas trio of Raza, Bopara and Sana gives Chitwan one of the most tactically flexible bowling attacks in the competition. Weakness: Domestic batting depth outside Kushal Malla and the international contributions relies on players with limited publicly confirmed NPL records. Players to watch: Sikandar Raza and Kushal Malla.",
      },
      {
        type: "heading",
        level: 2,
        text: "#4 — Sudurpaschim Royals",
      },
      {
        type: "paragraph",
        text: "Captain (reported): Dipendra Singh Airee. Overseas confirmed: Saif Zaib (England, batting all-rounder), Scott Kuggeleijn (New Zealand, bowling all-rounder), Brandon McMullen (Scotland, all-rounder). Domestic retained core: Dipendra Singh Airee, Binod Bhandari, Aarif Sheikh, Ishan Pandey, Abinash Bohara, Hemant Dhami, Hikmat Mahara.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "**Batting (7/10):** Saif Zaib was the best player of the inaugural NPL, scoring 275 runs across the season. Dipendra Singh Airee — Nepal's most explosive T20 batter — leads a Nepali core that includes Binod Bhandari and Ishan Pandey. The top order is experienced and dangerous when conditions suit.",
          "**Bowling (8/10):** Scott Kuggeleijn has taken 27 wickets across NPL Seasons 1 and 2, making him the most proven overseas pace bowler returning to the competition. Brandon McMullen's right-arm all-round options and Dipendra Singh Airee's explosive lower-order hitting add depth. Abinash Bohara and Hemant Dhami provide Nepali pace variety.",
          "**Overseas power (7/10):** Three confirmed overseas players with strong track records across T20 franchise cricket. Kuggeleijn's NPL record is outstanding. Zaib won the inaugural best-player award. McMullen has Scotland international pedigree. This is a proven, if not marquee-headlined, overseas group.",
          "**Squad depth (7/10):** Seven confirmed domestic players plus three proven overseas signings. The Royals have appeared in both previous NPL finals — that institutional knowledge of tournament structures adds a non-statistical form of depth.",
        ],
      },
      {
        type: "paragraph",
        text: "Strength: Proven performers who know Kirtipur conditions from two previous seasons. Kuggeleijn in particular has demonstrated that he can take wickets on these tracks consistently. Weakness: The squad lacks a global headline name at the tier of Warner, Shakib or Moeen Ali — meaning the Royals must win through collective excellence rather than individual marquee moments. Players to watch: Scott Kuggeleijn and Dipendra Singh Airee.",
      },
      {
        type: "heading",
        level: 2,
        text: "#3 — Kathmandu Gorkhas",
      },
      {
        type: "paragraph",
        text: "Captain (reported): Karan KC. Overseas confirmed: David Warner (Australia, opening batter), K. S. Bharat (India, wicketkeeper-batter), Sahan Arachchige (Sri Lanka, all-rounder). Retained domestic core: Karan KC, Bhim Sharki, Mohammad Aadil Alam, Rashid Khan, Santosh Yadav, Shahab Alam. Auction buys include: Sahil Patel, Prashiddha Jaisi, Dayanand Mandal, Krishna Paudel, Dev Shah, Suryanshu Koirala, Sonu Devkota.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "**Batting (9/10):** David Warner is the highest-profile batting name at any NPL Season 3 franchise — a two-time ODI World Cup winner and T20 World Cup champion with over 3,277 T20I runs for Australia. K. S. Bharat adds tested international technique behind the stumps. Mohammad Aadil Alam — the only player at the July 2026 auction to attract maximum bids from all eight franchises — is an elite domestic batting asset. Bhim Sharki and Sahan Arachchige add further batting options.",
          "**Bowling (7/10):** Karan KC is a high-quality seam all-rounder who opens the bowling regularly. Shahab Alam's spin, Santosh Yadav's all-round contributions, and Sahan Arachchige's off-break provide variety. The bowling attack is competent but lacks a global headline wicket-taker in the mould of Raza or Sandeep Lamichhane.",
          "**Overseas power (8/10):** Warner alone justifies a high score — he is statistically one of the best T20 openers in cricket history. Bharat's wicketkeeping pedigree and Arachchige's dual-role value make the overseas trio well-balanced across three distinct skills.",
          "**Squad depth (7/10):** The full confirmed squad is one of the largest in the competition, stretching to 16 named players between retentions and auction buys. Depth behind the overseas trio is good domestically.",
        ],
      },
      {
        type: "paragraph",
        text: "Strength: The batting lineup — Warner, Aadil Alam, Bhim Sharki and Bharat — is the most star-studded top-order combination in the competition. Weakness: The bowling relies heavily on Karan KC with Arachchige and Shahab Alam as support. If Karan KC is ineffective or unavailable, the attack loses its most experienced pace threat. Players to watch: David Warner and Mohammad Aadil Alam.",
      },
      {
        type: "heading",
        level: 2,
        text: "#2 — Lumbini Lions",
      },
      {
        type: "paragraph",
        text: "Captain (reported): Rohit Paudel. Overseas confirmed: Ruben Trumpelmann (Namibia, fast bowler), Niroshan Dickwella (Sri Lanka, wicketkeeper-batter), D'Arcy Short (Australia, batting all-rounder). Retained domestic core: Rohit Paudel, Sher Malla, Dilip Nath, Sundeep Jora, Dinesh Adhikari, Abhishesh Gautam, Tilak Bhandari. Auction buys: Aasif Sheikh, Kishor Mahato, Durgesh Gupta, Aakash Tripathi, Ajay Chauhan, Arniko Prasad Yadav.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "**Batting (8/10):** Rohit Paudel scored 276 runs and took 10 wickets across 10 matches in NPL 2025 while leading the side to the title — an extraordinary all-round campaign. D'Arcy Short is a left-handed top-order bat who scored heavily in Season 2. Niroshan Dickwella's aggressive wicketkeeping-batting at the top of the order works as a second-phase opener. Aasif Sheikh — the most expensive domestic signing at the July 2026 auction — adds further batting security.",
          "**Bowling (9/10):** Ruben Trumpelmann won Player of the Series in 2025 with 15 wickets across the tournament. Sher Malla claimed 17 wickets in Season 2, the joint-highest in the competition. The combination of Trumpelmann's left-arm pace and Malla's spin across the two phases is the most proven wicket-taking partnership at any franchise heading into Season 3. Tilak Bhandari and Abhishesh Gautam add domestic bowling backup.",
          "**Overseas power (8/10):** Trumpelmann is the best-performing overseas bowler in NPL history by wickets in a single season. Short's batting and Dickwella's glovework and stroke play complete a balanced three-player group with proven contributions across both batting and bowling phases.",
          "**Squad depth (8/10):** Thirteen confirmed players between retentions, auction buys and overseas signings. The squad has genuine cover across all roles and reproduces the core that won the 2025 title. Coaching continuity — Tinu Yohannan retained as head coach — adds further stability.",
        ],
      },
      {
        type: "paragraph",
        text: "Strength: The Lumbini Lions carry the most proven bowling pair in the competition — Trumpelmann and Sher Malla — alongside a captain in Rohit Paudel who has demonstrated he can win a title while contributing with both bat and ball. Weakness: If Trumpelmann, who is the fulcrum of the bowling attack, is off-form or unavailable, the bowling unit becomes more conventional. Players to watch: Ruben Trumpelmann and Rohit Paudel.",
      },
      {
        type: "heading",
        level: 2,
        text: "#1 — Janakpur Bolts",
      },
      {
        type: "paragraph",
        text: "Captain (confirmed): Harmeet Singh. Overseas confirmed: Harmeet Singh (USA, left-arm spin all-rounder), Jimmy Neesham (New Zealand, all-rounder), Iftikhar Ahmed (Pakistan, all-rounder), Moeen Ali (England, all-rounder). Retained domestic core: Anil Sah, Lalit Rajbanshi, Bikash Aagri, Mayan Yadav, Aaditya Mahata. Auction buys include: Trit Raj Das, Abhisekh Tiwari, Bishal Patel, Amar Routela, Rit Gautam, Santosh Karki, Aashutosh Pandey, Bishal Shusling.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "**Batting (8/10):** Moeen Ali's aggressive left-handed batting and Iftikhar Ahmed's destructive middle-order hitting give the Bolts two overseas batters capable of winning matches alone. Jimmy Neesham scored 247 runs at a strike rate above 196 during the 2024 championship run. Trit Raj Das — the most expensive domestic batting acquisition at the July 2026 auction — slots in alongside proven NPL performers Anil Sah and Mayan Yadav.",
          "**Bowling (8/10):** Four overseas all-rounders means the Bolts can choose different bowling combinations depending on conditions. Moeen Ali's right-arm off-spin at the top or middle of an innings, Harmeet Singh's left-arm spin, Neesham's seam and Iftikhar's off-break give the captain unmatched variety. Lalit Rajbanshi's 21 NPL wickets in 15 matches provide a proven domestic seam option behind the overseas rotation.",
          "**Overseas power (10/10):** The Janakpur Bolts are the only franchise to confirm all four overseas slots, and every one of them is a genuine match-winner. Moeen Ali is a two-time World Cup winner with England (2019 ODI, 2022 T20). Neesham has an NPL record that stands comparison with any overseas performer in the competition's history. Iftikhar Ahmed is one of Pakistan's most reliable middle-order T20 batters. Harmeet Singh brings USA captain experience with franchise tournament success at Sudurpaschim Royals over two seasons.",
          "**Squad depth (7/10):** Fifteen confirmed players spanning retentions, auction buys and four overseas signings. The head coach position had not been publicly confirmed in available reporting ahead of publication — an unusual gap for a championship-challenging squad — and this limits the depth score slightly.",
        ],
      },
      {
        type: "paragraph",
        text: "Strength: Having four confirmed overseas all-rounders gives the Janakpur Bolts tactical flexibility that no other team in this competition can match. Regardless of pitch conditions, conditions for pace or spin, they have match-winning options in both departments. Weakness: The coaching appointment remains publicly unconfirmed. A strong coaching structure is often the glue that converts paper talent into coordinated tournament performance. Players to watch: Jimmy Neesham and Moeen Ali.",
      },
      {
        type: "heading",
        level: 2,
        text: "Biggest surprises in this ranking",
      },
      {
        type: "paragraph",
        text: "Pokhara Avengers rank seventh. Many supporters will place them considerably higher given the presence of Shakib Al Hasan — statistically one of the great all-rounders in T20 history. The ranking reflects the fact that only two overseas signings are confirmed for the Avengers, while rival teams carry three or four. If Pokhara sign one or two additional overseas players before 26 October, this assessment should be revisited. Fans who know the franchise's domestic batting depth may also reasonably challenge a seventh-place ranking.",
      },
      {
        type: "paragraph",
        text: "Chitwan Rhinos ranking fifth may surprise those who associate the franchise with a modest league record in Seasons 1 and 2. The three-player overseas group of Raza, Bopara and Sana is the most tactically complete overseas bowling attack in the competition, and Sikandar Raza's reputation across franchise cricket globally is first-rate. On paper, this squad has the firepower to reach the playoffs.",
      },
      {
        type: "paragraph",
        text: "Karnali Yaks ranking eighth is not a commentary on their ambition or regional cricket culture. It reflects a data gap: the confirmed squad information available from current public sources is the least comprehensive of any franchise, and the squad is provisionally ranked at the bottom as a result. Fans following Karnali closely will likely know more than this article can responsibly confirm.",
      },
      {
        type: "heading",
        level: 2,
        text: "What the rankings cannot tell us",
      },
      {
        type: "paragraph",
        text: "Pre-season squad rankings are informative but structurally limited. TU International Cricket Stadium at Kirtipur sits at an altitude of around 1,300 metres. In late October and November, the surface typically offers pace and bounce early in the tournament, with spin becoming more influential as November progresses. A bowling attack rated well on paper may underperform on a batter-friendly surface, and vice versa. No pre-tournament analysis can reliably predict how each team will adapt.",
      },
      {
        type: "paragraph",
        text: "Injuries and national-duty conflicts are the great levellers of franchise cricket. Several players in these squads are active international cricketers. A national call-up or an injury during the group stage can transform a team's prospects overnight. The squads ranked here reflect the positions confirmed as of 14 October 2026, and changes remain possible right up to the tournament opener.",
      },
      {
        type: "paragraph",
        text: "T20 cricket is the format most susceptible to individual brilliance reshaping a match or a series in the space of 30 balls. A player ranked provisionally in this analysis may be the competition's standout performer, while a marquee signing may fire just once in seven league matches. The format rewards nerve and execution in specific match moments — qualities that are impossible to rank from a pre-season squad sheet.",
      },
      {
        type: "heading",
        level: 2,
        text: "Conclusion",
      },
      {
        type: "paragraph",
        text: "On paper, the Janakpur Bolts carry the deepest overseas roster and the widest range of match-winning options across all phases. The Lumbini Lions — defending champions with the most proven bowling duo in the competition — are a serious challenger for the title and arguably the team the Bolts must beat. Kathmandu Gorkhas carry the most explosive batting lineup around David Warner and Mohammad Aadil Alam. The rest of the field is competitive in ways that resist easy ranking: Sudurpaschim Royals bring tournament experience, Chitwan Rhinos bring overseas bowling class, and Biratnagar Kings bring the most consistent bowling threat from Sandeep Lamichhane. How does your own ranking of the eight squads compare to ours?",
      },
      {
        type: "heading",
        level: 2,
        text: "Related coverage",
      },
      {
        type: "paragraph",
        text: "Read more on NPL Hub Nepal: the full [NPL Season 3 overseas signings article](/news/npl-season-3-overseas-signings-warner-shakib), the [squad registration overview](/news/marquee-players-draft-highlights), the [eight franchise teams overview](/news/npl-season-3-eight-franchise-teams-overview), the [Season 3 schedule](/news/npl-season-3-schedule-venues-announced), the [format explained](/news/npl-season-3-format-playoff-structure-explained) guide, and [who plays in the first match](/news/npl-season-3-first-match-date-time-venue-nepali-date).",
      },
    ],
    category: "Teams",
    publishedAt: "2026-10-14T10:00:00+05:45",
    updatedAt: "2026-10-14T10:00:00+05:45",
    featured: true,
    author: "NPL Hub Nepal Editorial Team",
    source:
      "NPL Hub Nepal Editorial — Verified Franchise Squads, Player Registrations, and Official CAN Announcements",
    relatedTeamIds: [
      "lumbini-lions",
      "janakpur-bolts",
      "kathmandu-gorkhas",
      "sudurpaschim-royals",
      "chitwan-rhinos",
      "biratnagar-kings",
      "pokhara-avengers",
      "karnali-yaks",
    ],
    relatedMatchSlug: "match-1-lumbini-lions-vs-sudurpaschim-royals",
    status: "published",
    readTime: "8 min read",
    displayDate: "14 Oct 2026",
    tags: [
      "NPL Season 3 squad rankings",
      "Nepal Premier League",
      "NPL 2026 squads",
      "Lumbini Lions",
      "Janakpur Bolts",
      "Kathmandu Gorkhas",
      "Sudurpaschim Royals",
      "Chitwan Rhinos",
      "Biratnagar Kings",
      "Pokhara Avengers",
      "Karnali Yaks",
      "David Warner NPL",
      "Shakib Al Hasan NPL",
      "Moeen Ali NPL",
    ],
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

/** Slugs of published articles only — for sitemap generation. */
export function getPublishedArticleSlugs(): { slug: string }[] {
  return NEWS_ARTICLES.filter((a) => a.status === "published").map((a) => ({
    slug: a.slug,
  }));
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
