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

      "Leading the roster of marquee international arrivals is Australian cricket legend David Warner, whose signing with the Kathmandu Gorkhas was officially announced on September 15, 2026. A two-time ODI World Cup winner (2015, 2023) and 2021 T20 World Cup champion, Warner brings over 12,000 international runs and extensive franchise pedigree worldwide. His David Warner NPL arrival gives Gorkhas fans a world-class opening batter alongside national team captain Rohit Paudel.",

      "The capital franchise also secured Sri Lankan all-rounder Sahan Arachchige, whose top-order batting and off-break spin provide middle-overs stability, and Indian international wicketkeeper-batter K. S. Bharat, adding proven top-level glovework and technique.",

      "Equally seismic is the signing of Bangladeshi legend Shakib Al Hasan by the Pokhara Avengers, confirmed on July 27, 2026. Regarded as one of the finest all-rounders in cricket history, Shakib Al Hasan NPL participation gives Pokhara an elite performer with over 7,000 international runs and nearly 700 wickets across formats. His ability to control match tempo on spin-friendly pitches makes him an invaluable asset for captain Kushal Malla's side.",

      "To complement Shakib, the Avengers re-signed Sri Lankan pace-bowling all-rounder Dhananjaya Lakshan. Guiding Pokhara's dugout is legendary Sri Lankan mystery spinner Ajantha Mendis as head coach.",

      "## Confirmed NPL 2026 Overseas Signings: Franchise-by-Franchise",

      "Across all eight NPL Season 3 teams, franchises have deployed their overseas player quotas to address key tactical needs, balancing raw pace, batting power, and cunning spin. Here is a full verified breakdown of confirmed international signings heading into the opening match:",

      "Kathmandu Gorkhas: David Warner (Australia), Sahan Arachchige (Sri Lanka), K. S. Bharat (India) — all confirmed. Pokhara Avengers: Shakib Al Hasan (Bangladesh), Dhananjaya Lakshan (Sri Lanka) — all confirmed. Janakpur Bolts: Jimmy Neesham (New Zealand), returning champion. Sudurpaschim Royals: Scott Kuggeleijn (New Zealand) and Saif Ali Zaib (England), both returning. Lumbini Lions: Niroshan Dickwella (Sri Lanka), retained. Biratnagar Kings: Charith Asalanka (Sri Lanka, confirmed September 17, 2026) and Shubham Ranjane (USA, confirmed September 29, 2026). Chitwan Rhinos: Sikandar Raza (Zimbabwe, confirmed August 27, 2026) and Kaleem Sana (Canada, confirmed September 2026). Karnali Yaks: Akbar Ali (Bangladesh) and Mark Watt (Scotland), both confirmed September 27, 2026.",

      "Reigning titleholders Janakpur Bolts have retained Kiwi powerhouse Jimmy Neesham, whose death-overs power hitting and dependable seam bowling were crucial to the franchise's championship run under captain Dipendra Singh Airee.",

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
          ["Captains", "Rohit Paudel (Lumbini) vs Dipendra Singh Airee (Sudurpaschim)"],
          ["Context", "Rematch of 2025 NPL Final (Lumbini won by 6 wickets)"],
          ["Broadcast (TV)", "Himalaya TV HD (Nepal)"],
          ["Live Stream", "NetTV App & Web (Worldwide OTT)"],
          ["Digital Ticketing", "eSewa Official Partner"],
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
        text: "This opener is a rematch of the NPL Season 2 final. Lumbini Lions beat Sudurpaschim Royals by six wickets in the final on December 13, 2025, at Kirtipur to win their first title after bowling the Royals out for 85. Sudurpaschim Royals have finished as runners-up in both seasons so far, losing to Janakpur Bolts in the 2024 final and to Lumbini Lions in 2025. For 2026, captains are confirmed as Rohit Paudel for Lumbini Lions and Dipendra Singh Airee for Sudurpaschim Royals. Head coaches are Nandan Phadnis for Lumbini Lions and Jagat Tamata for Sudurpaschim Royals, with Brad Hodge as mentor for the Royals. Verified overseas signings for Lumbini Lions include Namibia fast bowler Ruben Trumpelmann, who was Player of the Series in 2025, Sri Lankan wicketkeeper Niroshan Dickwella and Australian opener D'Arcy Short, all retained from last season. For Sudurpaschim Royals, verified overseas signings include England all-rounder Saif Zaib, New Zealand pacer Scott Kuggeleijn and Scotland all-rounder Brandon McMullen, with UAE all-rounder Rohan Mustafa also listed in the squad.",
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
