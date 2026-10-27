# NPL Hub Nepal â€” Project Brain (BRAIN.md)

> **Persistent Project-State Document**  
> This file is the single compact source of truth for current project status, data architecture, routes, conventions, and roadmaps. Read this file to understand the project state without inspecting the entire repository.

---

## 1. Project Identity

- **Platform Name:** NPL Hub Nepal
- **Nature:** Independent, unofficial digital information platform for Nepal Premier League (NPL) Season 3 (2026).
- **Affiliation:** Not affiliated with, endorsed by, or presented as the official Cricket Association of Nepal (CAN) or NPL platform.
- **Core Audience:** Nepali cricket enthusiasts, domestic fans, diaspora followers, and sports researchers seeking accurate schedules, squads, standings, and tournament updates.
- **Tone & Style:** Authoritative sports-editorial media platform (similar to ESPNcricinfo/BBC Sport). High information density, strong typography, disciplined contrast, mobile-first design.

---

## 2. Current Development Status

- **Stage:** Phase 9 Complete â€” SEO Internal & External Linking System (canonical NPL entity directory, Ctrl+K shortcut, rich text renderer).
- **Core Stack:** Next.js 16.3.6 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4.
- **Calendar Engine:** `nepali-date-converter` for Gregorian to Bikram Sambat (BS 2083) conversions.
- **Database:** Supabase PostgreSQL â€” all repository modules query Supabase first, with deterministic static fallback.
- **Admin Console:** Protected `/admin` dashboard with full Teams CRUD, Players CRUD, Matches CRUD, News CRUD (with AI article structuring), and Stats CRUD â€” all using secure service-role API routes. No hard delete on any module.
- **AI Integration:** `GEMINI_API_KEY` (server-side env only) powers the `/api/admin/news/ai-structure` route. Gemini structures raw pasted article text into typed semantic blocks. Zero hallucination policy â€” AI only structures, never invents facts.
- **Build Status:** ✅ `npm run build` generates **228 static/dynamic routes** with **0 TypeScript errors** and **0 lint errors**.

---

## 3. Current Architecture

```
d:\NPL-Hub-Nepal\
â”œâ”€â”€ .agents\rules\project.md      # Antigravity project rules & guidelines
â”œâ”€â”€ BRAIN.md                      # Persistent project-state document (this file)
â”œâ”€â”€ src\
â”‚   â”œâ”€â”€ app\
â”‚   â”‚   â”œâ”€â”€ layout.tsx            # Root layout with Header, Footer, font configurations
â”‚   â”‚   â”œâ”€â”€ page.tsx              # Homepage
â”‚   â”‚   â”œâ”€â”€ schedule\page.tsx     # Full Schedule / Fixtures page
â”‚   â”‚   â”œâ”€â”€ matches\
â”‚   â”‚   â”‚   â””â”€â”€ [slug]\page.tsx   # Individual Match Page (/matches/[slug])
â”‚   â”‚   â”œâ”€â”€ teams\
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx          # Teams Directory (/teams)
â”‚   â”‚   â”‚   â””â”€â”€ [slug]\page.tsx   # Dynamic Team Profile (/teams/[slug])
â”‚   â”‚   â”œâ”€â”€ points-table\page.tsx # Full Points Table (/points-table)
â”‚   â”‚   â”œâ”€â”€ news\
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx          # News & Updates Directory (/news)
â”‚   â”‚   â”‚   â””â”€â”€ [slug]\page.tsx   # Dynamic Article Page (/news/[slug])
â”‚   â”‚   â””â”€â”€ about\page.tsx        # About placeholder route
â”‚   â”œâ”€â”€ components\
â”‚   â”‚   â”œâ”€â”€ ui\                   # Reusable UI primitives (Button, Card, Table, Layout, Header, Footer, TeamLogo)
â”‚   â”‚   â”‚   â””â”€â”€ ConstellationBackground.tsx # Interactive canvas background for hero sections
â”‚   â”‚   â”œâ”€â”€ home\                 # Homepage-specific section components
â”‚   â”‚   â”œâ”€â”€ schedule\             # Schedule components (Filters, FullFixtures, Summary, FAQ, Upcoming, Completed)
â”‚   â”‚   â”œâ”€â”€ matches\              # Match page components (Breadcrumb, Header, Scoreboard, Info, Teams, Nav, Links)
â”‚   â”‚   â”œâ”€â”€ teams\                # Team components (TeamCard, TeamHeader, TeamScheduleSection, TeamSquadSection)
â”‚   â”‚   â”œâ”€â”€ points-table\         # Points table components (PointsTableHeader, FullPointsTable, PointsTableRules)
â”‚   â”‚   â”œâ”€â”€ news\                 # News components (NewsBreadcrumb, NewsCard, CategoryFilter, NewsGrid)
â”‚   â”‚   â”œâ”€â”€ about\                # About components (AboutBreadcrumb, AboutHero, AboutTournamentOverview, AboutTeamsGrid, AboutFormatSection, AboutVenueSection, AboutPlatformSection, AboutNavigationSection)
â”‚   â”‚   â””â”€â”€ players\              # Player components (PlayerBreadcrumb, PlayerCard, PlayerSearchFilter, PlayerHero, PlayerDetailsCard, PlayerSeasonSection, PlayerRelatedMatches, PlayerRelatedNews)
â”‚   â””â”€â”€ lib\
â”‚       â”œâ”€â”€ utils.ts              # cn() class merger
â”‚       â””â”€â”€ data\                 # Local data sources (teams-data.ts, players-data.ts, schedule-data.ts, standings.ts, news-data.ts, homepage-data.ts)
```

---

## 4. Public Routes

| Route | Status | Description |
|---|---|---|
| `/` | **Complete** | Homepage: Hero, Upcoming Match, Standings Preview (data-driven), Latest Updates (connected to `news-data.ts`), Teams Preview, Newsletter. |
| `/schedule` | **Complete** | Full Tournament Schedule: 32 matches (28 league + 4 playoffs), BS primary date, stage/team/status filters, TU Ground venue. Internal links to match pages. |
| `/matches/[slug]` | **Complete** | 32 SSG dynamic match pages: Dual-calendar dates (BS + Gregorian), venue, teams/crests, pre-match verification state, result-ready structure, playoff placeholders, adjacent match navigation, and Schema.org SportsEvent structured data. |
| `/teams` | **Complete** | Teams Directory: 8 franchise cards, official crests, calm captain confidence handling, links to team pages. |
| `/teams/[slug]` | **Complete** | 8 SSG dynamic pages: Team hero with ConstellationBackground, live filtered schedule linked to individual matches, verified squad cards linked to `/players/[slug]`, and related team updates. |
| `/points-table` | **Complete** | Full 8-team standings table: data-driven calculation from `standings.ts`, pre-tournament unavailable (`â€”`) handling, top-4 qualification lines, points rules, NRR formula, and Page-Playoff system breakdown. |
| `/news` | **Complete** | News & Updates Directory: Hero section, featured articles, client-side category filtering (`Tournament`, `Teams`, `Matches`, `Points Table`, `Announcements`), and editorial coverage. |
| `/news/[slug]` | **Complete** | 6 SSG dynamic article pages: Schema.org `NewsArticle` JSON-LD, breadcrumb schema, draft/provisional notices, source attribution, related franchise links, and more articles footer. |
| `/about` | **Complete** | Comprehensive NPL Season 3 Information Hub: ConstellationBackground hero, tournament factsheet, 8 franchise grid, competition format & NRR rules, TU Stadium venue distinction, platform mission, statutory non-affiliation disclaimer, and Schema.org `AboutPage` + `SportsEvent` structured data. |
| `/privacy-policy` | **Complete** | Full privacy policy compliant with Google AdSense requirements (GA4 measurement, advertising cookies, opt-out mechanisms via Ads Settings/aboutads.info, data retention, contact info). |
| `/editorial-policy` | **Complete** | Journalistic and data accuracy standards: source verification, zero fabricated data, corrections protocol, separation of fact and opinion, trademark fair use, non-affiliation. |
| `/terms` | **Complete** | Terms of Use: acceptable use, accuracy limitations, intellectual property notices, limitation of liability, independent status. |
| `/contact` | **Complete** | Editorial contact page: interactive responsive contact form with client/server validation, honeypot spam protection, direct email contact (`nplhubnepal@gmail.com`), verified telephone (`+977 9814996840` with `tel:` link), correction request guidelines, non-affiliation distinction, and Formspree delivery integration. |
| `/players` | **Complete** | Players Directory: Search by player/team name, filters for franchise, playing role, and leadership (Captains/Marquee), ItemList JSON-LD, local WebP portrait avatars (`public/images/players/*.webp`) with team-initials fallback, displaying 127 confirmed squad players across all 8 franchises. |
| `/players/[slug]` | **Complete** | 127 SSG dynamic player profiles: ConstellationBackground hero, player portrait avatar, verified specs, bio, season status, result-ready statistics architecture, upcoming fixtures, related news, and Schema.org Person JSON-LD. |
| `/stats` | **Complete** | NPL Statistics Hub: Multi-season support with interactive selector between Season 2 (2025 verified historical dataset: authoritative ESPN points table, 8 awards, verified leaderboards, playoffs, player records, 7 verified scorecards, integrity notes) and Season 3 (2026 pre-tournament state). |

---

## 5. Shared Data Architecture

### Current Files & Roles
1. `src/lib/data/teams-data.ts`: Central source for 8 franchises (`NPL_TEAM_DETAILS`). Contains IDs, names, codes, regions, cities, brand colors, typographic crest colors, logo URLs, captain names with confidence metadata (`captainConfidence: "confirmed" | "reported"`, `captainSource`, `captainConfirmedAt`), coach, and squad status.
2. `src/lib/data/players-data.ts`: Central source for 127 verified NPL Season 3 squad members (`NPL_PLAYERS`). Contains player IDs, slugs, names, team IDs (`teamId`), roles (`Batter`, `Bowler`, `All-rounder`, `Wicketkeeper`), nationality, batting style, bowling style, status (`confirmed`), captaincy, marquee status, source attribution, bio, date of birth, `profileImage` local path (`/images/players/[slug].webp`), and result-ready `seasonStats?` structure. Lookups: `getPlayerBySlug(slug)`, `getPlayersByTeam(teamId)`, `getPlayersByRole(role)`, `getAllPlayers()`, `getAllPlayerSlugs()`, `getPlayerTeam(player)`. Reusable `PlayerAvatar.tsx` renders local WebP portraits with team initials fallback.
3. `src/lib/data/schedule-data.ts`: Central source for 32 NPL Season 3 matches (`SCHEDULE_FIXTURES`). Contains match numbers, stages, dates, formatted Gregorian dates, Bikram Sambat dates (`bsDate`, `bsDateNepali`), day of week, times (12:30 PM, 5:00 PM, Time TBA), venue, scores, and status (`upcoming` / `tba` / `completed`).
   - Extended with `MatchScoreDetails` and `MatchResultDetails` for result-ready scoreboards.
   - Provides lookup helpers: `getMatchBySlug(slug)`, `getAdjacentMatches(matchNumber)`, and `getAllMatchSlugs()`.
4. `src/lib/data/standings.ts`: Dedicated calculation and standings data module (`computeStandings()`, `getStandings()`).
   - Sourced directly from `NPL_TEAM_DETAILS` and `SCHEDULE_FIXTURES`.
   - Computes played, won, lost, no-result, points, and Net Run Rate (NRR) mathematically.
   - In pre-tournament state (0 completed matches), displays statistics as unavailable (`â€”`) rather than inventing zeros or fake records.
5. `src/lib/data/news-data.ts`: Canonical news and updates repository (`NEWS_ARTICLES`). Contains `NewsArticle` records with `id`, `slug`, `title`, `excerpt`, `content` (paragraphs), `category`, `publishedAt`, `updatedAt`, `featured`, `author`, `source`, `relatedTeamIds`, `relatedMatchSlug`, `status` (`published` | `draft`), `readTime`, and `displayDate`.
   - Categories: `Tournament`, `Teams`, `Matches`, `Points Table`, `Announcements`.
   - Access helpers: `getAllArticles()`, `getArticleBySlug(slug)`, `getFeaturedArticles()`, `getArticlesByCategory(category)`, `getLatestArticles(n)`, `getAllArticleSlugs()`, `getArticlesByTeam(teamId)`, `getAvailableCategories()`.
   - Strict data accuracy: Only verified NPL facts are included. Provisional/unconfirmed operational matters (broadcast/ticketing) carry explicit draft disclaimers.
6. `src/lib/data/homepage-data.ts`: Legacy placeholder data containing `NPL_TEAMS`, `FEATURED_UPCOMING_MATCH`. `LatestUpdatesSection` has been migrated to consume `news-data.ts`.
7. `src/lib/data/stats-types.ts`: Central contracts for multi-season statistics datasets (`SeasonStatsDataset`, `TournamentSummary`, `FinalStandingsRow`, `TournamentAward`, `Leaderboards`, `PlayerSeasonStats`, `PlayoffMatch`, `VerifiedLeagueMatch`, `DataIntegrityMetadata`).
8. `src/lib/data/stats-season2-data.ts`: Canonical Season 2 (2025) historical dataset imported from `NPL_Season2_Verified_Dataset.pdf`. Contains authoritative ESPN final points table, 8 awards, 4 playoffs (with unverified Q2 notation), batting & bowling leaderboards, per-player records (with `null` preserved as "â€”"), 7 verified league match scorecards, and documented research exclusions.
9. `src/lib/data/stats-season3-data.ts`: Canonical Season 3 (2026) live-tournament dataset. Updated after each match with verified ESPN Cricinfo scorecard data. Currently reflects Matches 1 & 2 fully (standings, leaderboards, awards, scorecards, player stats). Zero fabricated figures.
10. `src/lib/data/stats-registry.ts`: Multi-season query layer (`getSeasonStats()`, `AVAILABLE_SEASONS`) and entity link resolvers (`resolveCanonicalPlayerSlug()`, `resolveCanonicalTeamSlug()`, `getTeamMeta()`). Handles Kathmandu franchise naming history (`kathmandu-gorkhas` for S2 & S3) and canonical spelling for `sudurpaschim-royals`.

### How Match Pages, News Pages, Player Pages & Stats Hub Consume Data
- Stats Hub (`/stats`) dynamically switches between Season 2 and Season 3 datasets via `StatsHubClient` and URL query parameter (`?season=...`).
- Historical award recipients and leaderboards cross-link to canonical player profiles (`/players/[slug]`) for confirmed domestic players (Rohit Paudel, Sandeep Lamichhane, Sher Malla).
- Franchises across standings, awards, playoffs, and match scorecards cross-link to canonical team profiles (`/teams/[slug]`).
- Pre-tournament Season 3 state provides direct navigation to `/schedule`, `/teams`, and `/points-table`.
- Player profiles resolve team metadata dynamically via `getPlayerTeam(player)` referencing canonical `teams-data.ts`.
- Player pages cross-reference `schedule-data.ts` to show upcoming fixtures involving the player's franchise.
- Player pages cross-reference `news-data.ts` via `getArticlesByTeam(team.id)` to show matching tournament news.
- Team squad sections on `/teams/[slug]` dynamically render confirmed players using `getPlayersByTeam(team.id)` as clickable links to `/players/[slug]`.
- Match pages resolve fixtures strictly from `SCHEDULE_FIXTURES` via `getMatchBySlug(slug)`.
- Pre-match upcoming state enforces zero invented scores, toss decisions, or career records.
- Result-ready structure is designed so future Admin Panel writes to `seasonStats` automatically display on player profile scorecards.

---

## 6. Admin Architecture â€” Planned / Future

- **Core Goal:** Allow administrators to update match scores, match results, match statuses (live/completed), news articles, and squad sheets during NPL Season 3.
- **Data Flow:** `Admin Panel Writes â†’ Shared Data Layer / Database â†’ Public Website Reads`.
- **Interim Storage:** Static JSON / structured TypeScript records with strict interfaces.
- **Future Database:** Supabase PostgreSQL integration when live persistence is enabled. All public components consume identical TypeScript data contracts, ensuring zero UI rewrites when switching from static data to database queries.

---

## 7. Important Design Decisions

1. **Single Shared Venue:** TU International Cricket Stadium, Kirtipur is the sole venue for all NPL matches. Individual franchise "home grounds" do NOT exist. Venue is displayed once at page level (`TU Ground, Kirtipur`) and never as individual team home grounds.
2. **Dual-Calendar System:** Nepali Bikram Sambat (BS) is the primary calendar display (e.g., `à¤¸à¥‹à¤®à¤¬à¤¾à¤°, à¥¯ à¤•à¤¾à¤°à¥à¤¤à¤¿à¤• à¥¨à¥¦à¥®à¥©`), with Gregorian date visible secondary (e.g., `26 October 2026`). Conversions must use `nepali-date-converter`.
3. **Official Team Logos & Typographic Fallback:** Sourced logos for 8 franchises (`public/images/teams/*.webp`). Reusable `TeamLogo.tsx` provides clean typographic crest fallback for playoff placeholders.
4. **Calm Data-Quality Flags:** Captain confidence (`confirmed` vs `reported`) is an internal data-quality flag. It must never render as alarming red warning badges on public cards.
5. **Zero Hallucinated Data & Pre-Season Accuracy:** When tournament matches have not yet begun, Points Table statistics and match scorecards are presented in pre-match scheduled state without inventing fake scores, toss, or player of the match. News articles strictly avoid fabricated transfer rumors or unverified rosters.
6. **Playoff Placeholders Integrity:** Matches 29â€“32 respect Page Playoff format (Qualifier 1, Eliminator, Qualifier 2, Final) without guessing which teams will qualify.
7. **Constellation Background:** Used specifically for dark hero banners (`#052618`). Physics tuned to avoid floating card excess.

---

## 8. Completed Development

- [x] **Phase 1: System Foundation**
  - Design system tokens in `src/app/globals.css` (Brand `#0a5c36`, Accent `#c89f2a`).
  - Foundational UI components: `Button.tsx`, `Card.tsx`, `Table.tsx`, `Layout.tsx`, `ConstellationBackground.tsx`.
  - Global `Header.tsx` and `Footer.tsx`.
- [x] **Phase 2: Homepage (`/`)**
  - `HeroSection`, `UpcomingMatchSection`, `PointsTablePreview` (connected to `standings.ts`), `LatestUpdatesSection`, `TeamsPreview`.
- [x] **Phase 3: Schedule / Fixtures Page (`/schedule`)**
  - Complete 32-fixture dataset for NPL Season 3 (26 Oct â€“ 21 Nov 2026).
  - Bikram Sambat date conversion verified for all match days.
  - Interactive stage, team, and upcoming filters with real-time text search.
  - Tournament summary and contextual FAQ section.
- [x] **Phase 4: Teams Directory & Individual Team Pages (`/teams`, `/teams/[slug]`)**
  - Centralized `teams-data.ts` with 8 franchise teams and captain confidence tracking.
  - `/teams` directory with responsive 8-team grid and typographic crests.
  - Dynamic `/teams/[slug]` routes statically pre-rendered (SSG) for all 8 franchises.
  - Live filtered match fixtures pulled directly from `SCHEDULE_FIXTURES`.
  - Strict squad notice guarding against hallucinated player lists.
  - Removal of inaccurate individual "home ground" fields.
- [x] **Phase 5: Data Architecture Audit & BRAIN.md**
  - Completed inspection of data contracts and identified single-source-of-truth roadmap.
  - Established `BRAIN.md` with automated update rule in `.agents/rules/project.md`.
- [x] **Phase 6: Points Table Module (`/points-table`)**
  - Created dedicated pure calculation module `src/lib/data/standings.ts`.
  - Full 8-team points table with pre-tournament unavailable (`â€”`) state handling.
  - Top 4 / Playoff qualification indicators and cutoff line.
  - Comprehensive explanation of points system (2-1-0), NRR formula, and Page-Playoff format.
  - Updated homepage `PointsTablePreview.tsx` to consume live `standings.ts` data.
  - Direct team page navigation from table rows.
- [x] **Phase 7: Official Team Logos Integration**
  - Sourced official team logos for all 8 NPL franchises (`public/images/teams/*.webp`).
  - Created reusable `TeamLogo.tsx` component supporting responsive size presets (`xs`, `sm`, `md`, `lg`, `xl`) and automated fallback to typographic crests.
  - Integrated `TeamLogo` across all team-display components.
- [x] **Phase 8: Individual Match Pages Module (`/matches/[slug]`)**
  - Statically generated (SSG) all 32 tournament fixtures via `generateStaticParams()`.
  - Dual-calendar match header with `ConstellationBackground`, Nepali BS primary date, Gregorian date, time (NPT), TU Stadium venue, and match status.
  - Teams faceoff displaying crests/logos, linking to verified `/teams/[slug]` pages, and handling playoff placeholders cleanly.
  - Pre-match verified state guaranteeing zero fabricated scores, toss results, or winner assumptions.
  - Result-ready scoreboard data model (`MatchScoreDetails`, `MatchResultDetails`) prepared for future score entries.
  - Support for Page Playoff placeholders (Qualifier 1, Eliminator, Qualifier 2, Final) with qualification rules explainer.
  - Match sequence navigation (`Previous Match`, `Next Match`, `Back to Schedule`).
  - Related tournament links linking teams, full schedule, and points table.
  - Full Schema.org `SportsEvent` and `BreadcrumbList` JSON-LD structured data and dynamic SEO metadata.
  - Bidirectional internal linking connected across `/schedule`, `/teams/[slug]`, and homepage.
- [x] **Phase 9: News & Updates System (`/news`, `/news/[slug]`)**
  - Canonical data layer in `src/lib/data/news-data.ts` with strict TypeScript contracts (`NewsArticle`, `NewsCategory`) and 6 factual articles based on verified NPL Season 3 facts.
  - Full `/news` directory page with editorial header, featured articles section, and interactive client-side category filter (`Tournament`, `Teams`, `Matches`, `Points Table`, `Announcements`).
  - Dynamic `/news/[slug]` SSG article pages with Schema.org `NewsArticle` + `BreadcrumbList` JSON-LD, draft/provisional notices, source attribution, related franchise links, and "More Updates" navigation.
  - Connected homepage `LatestUpdatesSection` to `getLatestArticles(4)` from `news-data.ts`.
  - Connected team pages (`/teams/[slug]`) to display matching editorial updates via `getArticlesByTeam(team.id)`.
  - Total static routes expanded from 49 to 55 with 0 build errors.
- [x] **Phase 10: About & Tournament Information Hub (`/about`)**
  - Upgraded `/about` into an evergreen, comprehensive tournament guide and platform authority center.
  - ConstellationBackground hero banner with editorial title, badges, and prominent non-affiliation disclosure.
  - Dynamically derived Tournament Overview factsheet from `TOURNAMENT_INFO` and `SCHEDULE_FIXTURES` (8 teams, 32 matches, 28 league + 4 playoffs, T20 format, Oct 26 â€“ Nov 21 2026, CAN organizer).
  - 8-Franchise grid reusing centralized `teams-data.ts` and `TeamLogo`, linking to `/teams/[slug]`.
  - Thorough format explanation breaking down single round-robin group phase, 2-1-0 points system, Net Run Rate (NRR) formula, and 4-match Page Playoff progression without invented rules.
  - Venue section clarifying Tribhuvan University International Cricket Stadium, Kirtipur as the single shared host venue, explicitly distinguishing tournament venue from franchise regional identities.
  - Platform mission, editorial integrity principles, and statutory non-affiliation disclaimer.
  - "Explore NPL Season 3" multi-column navigation linking to Teams, Schedule, Points Table, News, and Match Centers.
  - Schema.org `AboutPage`, `BreadcrumbList`, and `SportsEvent` structured data.
  - Production build verified with 55 static pages and 0 errors.
- [x] **Phase 11: Complete Players Directory & Local Portrait Integration (`/players`, `/players/[slug]`)**
  - Canonical data layer in `src/lib/data/players-data.ts` containing 127 verified NPL Season 3 squad members across all 8 franchises (`NPL_PLAYERS`), with strict type contracts (`Player`, `PlayerRole`, `PlayerStatus`, `PlayerConfidence`, `SeasonStats`).
  - Zero fabricated career records, statistics, auction prices, or fake images. Unsold auction participants excluded.
  - Real player portraits sourced, optimized, and stored locally in `public/images/players/*.webp` for all 127 players with zero external hotlinking.
  - `PlayerAvatar.tsx` reusable avatar component rendering WebP portraits with automatic onError fallback to team-brand initials.
  - Dynamic status badges: "Confirmed Retained" vs "Confirmed Squad".
  - Result-ready `seasonStats?` architecture prepared for future live scorekeeping and Admin Panel population without requiring UI changes.
  - Comprehensive `/players` directory with client-side real-time search by player/franchise name, filtering by team, role, and leadership (Captains/Marquee), and Schema.org `ItemList` JSON-LD with player thumbnail images.
  - 127 SSG dynamic individual player profile pages (`/players/[slug]`) with ConstellationBackground hero, team connection, verified specs, bio, season status, result-ready stats block, upcoming fixtures (via `SCHEDULE_FIXTURES`), related news (via `news-data.ts`), and Schema.org `Person` JSON-LD with image metadata.
  - Updated `/teams/[slug]` squad section (`TeamSquadSection.tsx`) to dynamically render verified squad player cards with portraits as clickable links to `/players/[slug]`.
  - Integrated Players into global Header navigation, Footer links, and subtle homepage TeamsPreview link.
  - Total static routes expanded from 144 to 220 with 0 build errors.

- [x] **Phase 12: Statistics Module (`/stats`) & Multi-Season Architecture**
  - Canonical data contracts in `src/lib/data/stats-types.ts` supporting multi-season schema (`SeasonStatsDataset`, `TournamentSummary`, `FinalStandingsRow`, `TournamentAward`, `Leaderboards`, `PlayerSeasonStats`, `PlayoffMatch`, `VerifiedLeagueMatch`, `DataIntegrityMetadata`).
  - Strict integrity rules: Unavailable values remain `null` and render as `â€”` (never "0"). Missing leaderboards are not padded with fake Top 10/20 entries.
  - Sourced initial Season 2 dataset strictly from canonical `NPL_Season2_Verified_Dataset.pdf`:
    - Authoritative ESPN Final Points Table preserved as-is without recomputing from partial records (8 franchises, P, W, L, T, NR, Pts, NRR).
    - 8 verified tournament awards: Ruben Trumpelmann (Player of the Tournament & Player of the Final), Rohit Kumar Paudel (Best Nepali Player & Best Batter), Sandeep Lamichhane (Best Bowler & Leading Wicket Taker), Sher Malla (Emerging Player), Adam Rossington (Leading Run Scorer).
    - Playoff results with confirmed scores for Qualifier 1, Eliminator, and Final; Qualifier 2 scorecard marked as NOT FOUND without hallucinated scores.
    - Verified batting leaderboards (Most Runs, High Score, Average, Strike Rate, 4s, 6s, 100s, 50s) and bowling leaderboards (Most Wickets, Best Figures).
    - Per-player statistical model tracking matches, innings, runs, highestScore, average, strikeRate, wickets, bestBowling, economy, fours, sixes, hundreds, fifties, catches, and wicketkeeperDismissals with zero invented numbers.
    - 7 verified league match scorecards from Section 6 with 21 matches flagged as awaiting ESPN/Cricbuzz scorecard extraction.
    - Transparent documentation of excluded raw inconsistencies (duplicate Match 24, unconfirmed Match 26, conflicting winner inferences).
  - Built Season 3 pre-tournament state: "Season 3 statistics are not available yet" with zero fake zeros or mock rankings, highlighting future live ingestion roadmap.
  - Interactive season selector (`[ Season 2 â€” 2025 ] [ Season 3 â€” 2026 ]`) synced seamlessly with URL query parameters (`?season=season-2` / `?season=season-3`) with `/stats` as canonical route.
  - Cross-linked canonical players to `/players/[slug]` (Rohit Paudel, Sandeep Lamichhane, Sher Malla) and teams to `/teams/[slug]`.
  - Full SEO suite: Title, meta description, canonical, OpenGraph, Twitter, semantic H1/H2, Schema.org `SportsEvent` + `BreadcrumbList` JSON-LD.
  - Production build verified with 110 static pages and 0 errors.

---

## 9. Current Development Task

- **Task:** Phase 1 of Admin Panel Readiness Roadmap â€” COMPLETED.
  - Refactored `schedule-data.ts` to replace embedded `team1`/`team2` `Team` objects with canonical `team1Id` and `team2Id` string slug references.
  - Implemented `resolveMatchTeam` and `resolveMatchTeams` with `PLAYOFF_PLACEHOLDERS` fallback for playoff seeds.
  - Created thin repository/data-access layer under `src/lib/repository/` (`teams.ts`, `players.ts`, `matches.ts`, `news.ts`, `stats.ts`, `index.ts`).
  - Migrated consuming public components to repository layer and canonical team resolvers.
  - Audited and cleaned `homepage-data.ts`: permanently removed fabricated `STANDINGS_PREVIEW`, dead `LATEST_UPDATES`, and duplicate interfaces.
  - Preserved 100% of public behavior, routes, slugs, SEO metadata, Schema.org JSON-LD, Season 2/3 datasets, and styling.
  - Production build verified: 110 static pages, 0 errors.

---

## 10. Next Planned Tasks

1. **Phase 2 â€” Database Layer (Supabase Read-Only):**
   - Create Supabase project and PostgreSQL schema matching proposed models.
   - Seed tables from static TypeScript datasets (`teams`, `seasons`, `players`, `matches`, `news`).
   - Switch `/src/lib/repository/` functions to read from Supabase at build/request time with ISR revalidation.
2. **Phase 3 â€” Admin Panel (Protected Writes):**
   - Introduce `middleware.ts` protecting `/admin/*`.
   - Admin authentication via Supabase Auth.
   - Server Actions for match result entry, live match status updates, news publishing, and squad adjustments.
3. **Phase 4 â€” Live Match Scoring:**
   - Active tournament scorekeeping, 30s ISR on live matches, and automatic standings/stats updates.

---

## 11. Important Constraints / Do Not Do

- **DO NOT** invent match scores, player rosters, coaches, dates, news rumors, or ticket prices.
- **DO NOT** convert missing statistics (`null`) to `0`. Display unavailable values as "â€”".
- **DO NOT** add individual "home ground" fields to team cards or team headers (every match is at TU Stadium, Kirtipur).
- **DO NOT** start building an entire backend, database, or admin UI automatically before approval.
- **DO NOT** make captain confidence look like an alarming red error badge.
- **DO NOT** use generic AI templates, excessive gradients, glassmorphism, or floating card overload.
- **DO NOT** rewrite working components or alter `ConstellationBackground.tsx` physics without instruction.

---

## 12. Short Change Log

- **2026-09-26:** Built complete `/schedule` page with 32 NPL Season 3 fixtures and verified Nepali Bikram Sambat (BS 2083) date conversions.
- **2026-09-26:** Implemented Teams Directory (`/teams`) and dynamic team pages (`/teams/[slug]`) with live schedule filtering and calm captaincy confidence metadata.
- **2026-09-27:** Removed inaccurate individual franchise "ground" fields across data, team cards, and headers to reflect TU Stadium as the single shared tournament venue.
- **2026-09-27:** Conducted comprehensive Data Architecture Audit for future Admin Panel and Points Table integration. Created `BRAIN.md`.
- **2026-09-27:** Built complete Points Table module (`/points-table`): pure calculation module `standings.ts` using centralized `teams-data.ts` and `schedule-data.ts`, 8-team pre-season unavailable (`â€”`) table, top-4 qualification system, points and NRR rules breakdown, and updated homepage preview.
- **2026-09-27:** Sourced and integrated official team logos for all 8 NPL franchises (`public/images/teams/*.webp`), created reusable `TeamLogo.tsx` component with fallback, and updated all UI components across homepage, schedule, teams, team detail, and points table.
- **2026-09-27:** Built complete Individual Match Page module (`/matches/[slug]`): 32 SSG dynamic routes powered directly by centralized `schedule-data.ts`, dual-calendar dates (BS + Gregorian), pre-match state guarantee with zero fabricated scores, result-ready structure for future scores/margins, playoff progression placeholders (Q1, Eliminator, Q2, Final), previous/next match navigation, Schema.org SportsEvent metadata, and bidirectional internal links from schedule, team pages, and homepage.
- **2026-09-27:** Built complete News & Updates system (`/news`, `/news/[slug]`): canonical `news-data.ts` with 6 factual articles, filterable category tabs, SSG dynamic article pages with Schema.org `NewsArticle` JSON-LD, draft/provisional notices, connected homepage updates section to `getLatestArticles(4)`, and integrated related team updates on `/teams/[slug]`. Production build verified at 55 static pages.
- **2026-09-27:** Upgraded `/about` page into a comprehensive NPL Season 3 Information Hub: ConstellationBackground hero, tournament overview factsheet (derived from `TOURNAMENT_INFO` and `SCHEDULE_FIXTURES`), 8 franchise grid linking to `/teams/[slug]`, competition format breakdown (single round-robin, 2-1-0 points, NRR formula, 4-stage Page Playoff), TU Stadium venue distinction, platform mission and statutory non-affiliation disclaimer, and "Explore NPL Season 3" navigation. Production build verified at 55 static pages.
- **2026-09-28:** Built complete Players Directory + Individual Player Profiles module (`/players`, `/players/[slug]`): canonical `players-data.ts` with 53 confirmed retained players across all 8 franchises, client-side interactive search & filtering by team, role, and leadership, 53 SSG dynamic player profiles with Schema.org `Person` JSON-LD, result-ready `seasonStats?` architecture without fabricated numbers, cross-linked team fixtures and related news, updated `/teams/[slug]` squad section with clickable player links, and added navigation links. Production build expanded from 55 to 109 static pages with 0 errors.
- **2026-09-28:** Built complete Statistics Module (`/stats`) with multi-season architecture (`stats-types.ts`, `stats-season2-data.ts`, `stats-season3-data.ts`, `stats-registry.ts`): Season 2 verified historical dataset imported AS-IS from `NPL_Season2_Verified_Dataset.pdf` (authoritative points table, 8 awards, verified leaderboards, 4 playoffs with unverified Q2 scorecard notation, 7 verified league scorecards, per-player records with `null` preserved as "â€”", and exclusion documentation); Season 3 pre-tournament state ("Season 3 statistics are not available yet" with zero dummy zeros or fake rankings); interactive season selector; player/team cross-linking; Schema.org JSON-LD; and global header/footer navigation. Production build expanded from 109 to 110 static pages with 0 errors.
- **2026-09-28:** Implemented Phase 1 Foundation Cleanup: decoupled `StatsHubClient` server/client boundary in `/stats` with preloaded dataset props; made `FullFixturesSection` prop-driven; refactored `ScheduleMatch` to relationally safe nullable team IDs (`team1Id: string | null`, `team1Placeholder: string | null`) with exclusive invariant for playoff matches 29â€“32 (`rank-1`, `rank-2`, `rank-3`, `rank-4`, `q1-loser`, `elim-winner`, `q1-winner`, `q2-winner`); updated all consumers (`MatchHeader`, `MatchTeamsSection`, `MatchRelatedLinks`, `MatchScoreboard`, `TeamScheduleSection`, `PlayerRelatedMatches`, `standings.ts`); added automated invariant validator (`scripts/validate-playoff-invariant.mjs`); verified production build at 110 static pages with 0 errors.
- **2026-09-28:** Implemented Phase 2 Supabase Database Foundation: installed `@supabase/supabase-js`; configured client layer (`src/lib/supabase/{client,types,index}.ts`); created `.env.local` and `.env.example` with public connection keys; verified live connection to Supabase endpoint (`https://zohmcgjixebuiconrven.supabase.co`); authored complete PostgreSQL migration `supabase/migrations/20260928000000_initial_schema.sql` (10 core tables: `seasons`, `teams`, `team_seasons`, `players`, `player_seasons`, `matches`, `news_articles`, `news_team_relations`, `player_season_stats`, `tournament_awards`, RLS public read policies, indexes, and exclusive playoff placeholder CHECK constraints); verified 0 lint errors and 110 static page production build without breaking existing static data.
- **2026-10-01:** Technical SEO & Google Search Identity Audit: generated custom NPL Hub Nepal favicons (`favicon.ico`, `icon.png`, `apple-icon.png`, `icon-192.png`, `icon-512.png`) and brand logo (`public/images/logo.{png,webp}`) from uploaded logo image; updated `layout.tsx` metadata with `applicationName`, explicit `icons` array, `alternates.canonical`, and `googleBot` directives; updated `page.tsx` home JSON-LD schema with `WebSite` (`alternateName`) and `Organization` (logo `https://nplhubnepal.vercel.app/images/logo.png`); integrated logo into Header and Footer navigation; verified `robots.ts` and `sitemap.ts` (114 static SSG routes generated with 0 errors).
- **2026-10-02:** Phase 5A â€” Admin Authentication & Protected Dashboard Shell: built Supabase Auth client integration with `AdminAuthProvider` (`src/lib/auth/admin-auth-context.tsx`); implemented `AdminGuard` protecting all `/admin/*` routes and redirecting unauthenticated users to `/admin/login` (and authenticated users away from `/admin/login` to `/admin`); created dedicated `/admin/login` page styled to the sports-editorial design system with credential validation; built `AdminShell` with responsive sidebar, topbar, user email badge, and secure logout; set up module placeholder routes (`/admin/teams`, `/admin/players`, `/admin/matches`, `/admin/news`, `/admin/stats`) ready for Phase 5B CRUD; hidden public Header and Footer on `/admin` routes; verified 0 TypeScript errors, 0 ESLint errors, and 119 static routes in production build.
- **2026-10-02:** Phase 5B â€” Admin Dashboard Foundation: implemented aggregated admin repository (`src/lib/repository/admin.ts`) fetching real database metrics from Supabase with safe fallback and connection health latency tests; built modular dashboard subcomponents (`AdminSummaryCards`, `AdminCurrentSeason`, `AdminUpcomingMatches`, `AdminRecentNews`, `AdminQuickActions`, `AdminDatabaseStatus`); verified Season 3 tournament pre-tournament status and 32 upcoming fixture cards with canonical team resolvers; refined `AdminShell` with crisp SVG navigation icons, active states, and mobile drawer logout; verified 0 TypeScript errors, 0 ESLint errors, and 119 static routes in production build.
- **2026-10-02:** Phase 5C â€” Admin Teams CRUD: added `src/lib/supabase/server.ts` (server-only Supabase admin client using `SUPABASE_SERVICE_ROLE_KEY`, never browser-exposed); created `src/app/api/admin/teams/route.ts` (GET + PUT API route that verifies Supabase Auth JWT and uses admin client for RLS-bypassed writes to `teams` + `team_seasons`); extended `src/lib/repository/teams.ts` with `AdminTeamRow`, `AdminTeamSeasonRow`, `UpdateTeamInput`, `getAllTeamsAdmin()`, and `updateTeamAdmin()` repository functions; replaced `/admin/teams` placeholder with full management UI: 8-team table, client-side search, Season 2/3 filter, slide-in edit panel with form validation (team identity + captain/coach/squad status), optimistic UI update on save, no hard delete (FK integrity preserved with on-screen explanation); 120 static pages, 0 TypeScript errors, 0 ESLint errors; committed as `1c89c6e`, pushed to `main`.
- **2026-10-02:** Phase 5D â€” Admin Players Management: created `src/app/api/admin/players/route.ts` (GET + PUT API route verifying Supabase Auth JWT and executing server-only service-role queries/mutations against `players` and `player_seasons`); extended `src/lib/repository/players.ts` with `AdminPlayerRow`, `AdminPlayerSeasonRow`, `UpdatePlayerInput`, `getAllPlayersAdmin()`, and `updatePlayerAdmin()`; built full `/admin/players` management console with real-time text search, franchise filter, season filter, role filter, refresh action, and slide-in edit panel for player bio, batting/bowling styles, franchise assignment, role, captain, marquee, number, and confidence; strict delete preservation policy (no hard delete, preventing orphan records in `player_seasons` and `player_season_stats`); verified 121 static routes, 0 TypeScript errors, 0 ESLint errors.
- **2026-10-02:** Phase 5E â€” Admin Matches & Fixtures Management: created `src/app/api/admin/matches/route.ts` (secure GET + PUT API route verifying Supabase Auth JWT and executing server-only mutations on `matches` table with strict invariant validation: side 1 and side 2 exclusive franchise vs placeholder checks, unique match number validation, stage & status verification); extended `src/lib/repository/matches.ts` with `AdminMatchRow`, `UpdateMatchInput`, `getAllMatchesAdmin()`, and `updateMatchAdmin()`; replaced `/admin/matches` placeholder with full management console: 32-fixture table with stage pills, status badges, real-time multi-attribute search, season/stage/status filters, refresh action, and slide-in edit drawer supporting dual-calendar inputs (Gregorian & Bikram Sambat), timing, venue, confirmed franchise vs playoff placeholder selection; deletion disabled for relational integrity; verified 122 static routes, 0 TypeScript errors, 0 ESLint errors.
- **2026-10-03:** Phase 5F ï¿½ Admin News Management: created `src/app/api/admin/news/route.ts` (GET returns ALL articles including drafts + team relations; POST creates new article with slug uniqueness check; PUT updates article + replaces news_team_relations via DELETE+re-INSERT ï¿½ all verifying Supabase Auth JWT and using server-only service-role client); extended `src/lib/repository/news.ts` with `AdminNewsTeamRelation`, `AdminNewsRow`, `CreateNewsInput`, `UpdateNewsInput` types and `getAllNewsAdmin()`, `createNewsAdmin()`, `updateNewsAdmin()` repository functions; replaced `/admin/news` placeholder with full management UI: article table with status badges, category badges, associated team short codes, real-time title/slug search, status/category filters, article creation form with auto-slug generation, edit drawer with all fields, publish/unpublish quick toggle, and no-hard-delete policy notice; verified 123 static routes, 0 TypeScript errors, 0 ESLint errors.
- **2026-10-03:** Phase 5G ï¿½ Admin Stats Management: created `src/app/api/admin/stats/route.ts` (GET fetches all player_season_stats + tournament_awards with optional season filter; PUT updates either a stat row or award row via type discriminator 'stat'|'award', with server-side validation of confidence enums and non-negative numeric constraints, NULL values preserved); extended `src/lib/repository/stats.ts` with `AdminPlayerSeasonStatRow`, `AdminTournamentAwardRow`, `UpdatePlayerSeasonStatInput`, `UpdateTournamentAwardInput`, `StatConfidence` types and `getAllStatsAdmin()`, `updatePlayerSeasonStatAdmin()`, `updateTournamentAwardAdmin()` repository functions; replaced `/admin/stats` placeholder with full management UI: two-tab layout (Player Stats / Awards), season filter (S2/S3), team filter, player search, stats table with all player_season_stats fields shown null-safe (blank=null enforced, never auto-zero), confidence badges, edit drawer for all numeric+text fields, awards tab with recipient/team/metric editing, Season 3 pre-tournament warning, no-hard-delete policy notice; verified 124 static routes, 0 TypeScript errors, 0 ESLint errors.
- **2026-10-03:** SEO ï¿½ SportsEvent Structured Data Upgrade: created src/lib/structuredData.ts (reusable helper with uildMatchJsonLd(), 	oNepalISO(), safeJsonLd(), uildSportsTeamNode()); updated src/app/matches/[slug]/page.tsx to use the helper; added all 5 missing recommended GSC fields ï¿½ eventStatus (mapped from match.status), eventAttendanceMode (OfflineEventAttendanceMode), homeTeam/wayTeam (SportsTeam with logo, url, location), performer (both teams), image (absolute team logo URLs, default OG fallback), organizer (CAN with https://can.org.np); startDate is now full ISO 8601 with Nepal +05:45 offset (e.g. 2026-10-26T16:30:00+05:45); offers intentionally omitted ï¿½ no confirmed ticketing/pricing data; XSS safety via safeJsonLd() replacer; verified 0 TypeScript errors, production build 124/124 pages clean.
- **2026-10-03:** Date Accuracy Fix ï¿½ NPL Season 3 tournament dates corrected project-wide: (1) article-01 (
pl-season-3-schedule-venues-announced) ï¿½ title, excerpt, all body content corrected from 28 Nov-21 Dec to 26 Oct-21 Nov 2026; unsourced 'CAN confirmed' claim removed; source updated; updatedAt set to 2026-10-03; correction note added to bottom; relatedMatchSlug added for opening match; (2) article-02 squad article opening date fixed; (3) article-05 Final date fixed from 5 Poush (21 Dec) to 5 Mangsir (21 Nov); (4) TournamentSummary.tsx Nepali BS start date corrected from ?? ??????? (10 Kartik) to ? ??????? (9 Kartik) to match schedule-data.ts Match #1; (5) fallback strings in matches.ts, admin.ts (x2), admin/page.tsx corrected; verified 0 TypeScript errors, 124 static pages; committed d540aec, pushed to main, Vercel deployment triggered.
- **2026-10-03:** Live Match Countdown Hero Card: built client-side MatchCountdown component (src/components/home/MatchCountdown.tsx) and pure countdown engine (src/lib/countdown.ts); placed in HeroSection.tsx with responsive layout (desktop: right column vertically centered; mobile: below CTAs); features glassmorphism styling (g-[#052618]/70, gold border, tabular numbers, subtle tick animation with @keyframes tickGlow in globals.css), automatic NPT (+05:45) time calculations, state machine handling 5 tournament phases (kickoff, today, next, live with pulsing badge, tba, season complete), useSyncExternalStore for hydration safety and clean timer updates, screen-reader accessibility summary with ria-live='polite', and prefers-reduced-motion compliance; verified with zero TS errors, 0 ESLint errors, and 124 SSG static pages.

- **2026-10-03:** Phase 6B â€” NPL Data & Live System Implementation:
  - **Database Migration:** supabase/migrations/20261003000000_phase6b_live_data.sql adds external_provider, external_match_id to matches, external_team_id to 	eams, expands status CHECK to include postponed and bandoned, creates match_commentary table with RLS and deduplication index.
  - **Cricket API Abstraction:** Pluggable multi-provider engine in src/lib/cricket-api/ with ICricketDataProvider interface, TheSportsDB provider (League 5533, 8 team slug resolvers), SportMonks v3 provider stub, and deterministic Mock provider. Ingestion module (ingestion.ts) synchronizes live matches, prevents duplicates, and triggers standings recalculation upon match completion.
  - **Automated Standings Recalculation:** src/lib/standings/calculator.ts computes tournament standings from completed Supabase match rows using verified NRR rules and persists them to 	eam_seasons.
  - **AI Commentary Layer:** src/lib/ai-commentary/ integrates Google Gemini with anti-hallucination prompts (temperature 0.2, strictly bounded to input events), rule-based fallback provider, deduplication, and persistence.
  - **Match Center Live UI:** Created src/components/matches/LiveCommentaryFeed.tsx with live 25s polling, event badges, upcoming placeholder, and test simulation action; wired into /matches/[slug].
  - **Admin Panel Enhancements:** Added AdminLiveSyncCard to /admin and /admin/matches; updated /admin/matches with full Scorecard & Results editor (runs, wickets, overs, toss, winner, margin, player of match, external IDs); updated pi/admin/matches route to handle results and trigger auto-recalculation.
  - **Public Frontend Data Connection:** Homepage, Schedule, and Points Table converted to async server components fetching real database standings and fixtures.
  - **Production Build:** âœ… 130 static routes, 0 TypeScript errors, 0 ESLint errors.

- **2026-10-04:** Phase 7 â€” AI Article Structuring System: `src/lib/types/article-blocks.ts` (`ArticleBlock` discriminated union, `normalizeArticleBlocks`, `sanitizeBlock`, `blocksToPlainText`); `src/lib/ai-news/gemini-structurer.ts` (Gemini 2.5/2.0/1.5-flash fallback chain, zero-hallucination system prompt, `responseMimeType: "application/json"`); `/api/admin/news/ai-structure` POST route (JWT auth, server-side only); `AdminArticleContentEditor.tsx` (two-tab block editor: Raw/Paste + Structured Blocks, heading H2â†”H3 toggle, list style toggle, FAQ editor, "Format with AI" button, "Re-run AI", "Back to Raw Text" recovery); updated news repository with `normalizeArticleBlocks` backward-compatible normalization; admin news page sends `{ blocks: [...] }` JSONB to Supabase; admin API calls `revalidatePath` on publish; public article renderer uses full semantic block switch (h2, h3, p, ul, ol, blockquote, FAQ div, link a); `force-dynamic` + `revalidate = 0` on `/news` and `/news/[slug]`; homepage receives live Supabase articles via `getLatestArticles(4)` in `Promise.all`. `GEMINI_API_KEY` required in Vercel env. Committed `cf8377f`, pushed to `main` + `master`. Production build: 128 static routes, 0 TypeScript errors.
- **2026-10-05:** Phase 8 â€” Article Image Management System (Featured & Inline):
  - **Storage Infrastructure:** Created and configured public `article-images` bucket in Supabase Storage with 10MB limit and image MIME-type filtering; added migration `supabase/migrations/20261005000000_article_images_storage.sql`; configured `images.remotePatterns` for `**.supabase.co` in `next.config.ts`.
  - **Secure Upload API:** Built `/api/admin/news/upload-image` POST route with Supabase Auth JWT verification, file size limits (<=10MB), MIME/extension validation, Sharp binary header and dimension extraction, safe randomized pathing (`articles/{articleId}/{timestamp}-{random}.ext`), and service-role upload returning permanent public URLs.
  - **Featured Image Management:** Created `AdminFeaturedImageUploader.tsx` in admin article drawer with drag-and-drop, laptop file picker, loading spinner, real-time preview, replace, and remove capabilities without storing base64 in the database.
  - **Inline Article Images:** Extended `ArticleBlock` with `ImageBlock` (`{ type: "image", src, alt, caption, width, height }`), updated `sanitizeBlock`, `blocksToPlainText`, and `normalizeArticleBlocks`; upgraded `AdminArticleContentEditor.tsx` with between-block `[ + ]` inserter dividers, direct laptop drag-and-drop between blocks, inline upload picker, metadata editing (alt text & caption), and image replacement.
  - **Frontend Semantic Rendering:** Updated `src/app/news/[slug]/page.tsx` to render `image` blocks as semantic `<figure><img ... /><figcaption>...</figcaption></figure>` with lazy loading and aspect ratio preservation; updated `NewsCard.tsx` to display featured images cleanly while keeping inline images inside article content.
  - **Verification:** 29 automated tests passed in `scripts/test-image-system.mjs`; production build: 129 routes compiled with 0 TypeScript/ESLint errors.
- **2026-10-06:** Database & Article Date Sync Fix: Diagnosed discrepancy where `/news/npl-season-3-schedule-venues-announced` on Vercel displayed outdated tournament dates (28 Nov â€“ 21 Dec 2026) because Supabase database rows in `news_articles` retained old initial seed data while git repository (`news-data.ts`) had been corrected. Regenerated `supabase/seed.sql` via `generate-seed-sql.ts`, created `scripts/sync-news-to-supabase.ts` (added to `package.json` as `sync:news`), and synchronized all 7 canonical articles and team relations directly to Supabase production. Verified live Vercel URL now renders correct dates (26 October â€“ 21 November 2026, 9 Kartik â€“ 5 Mangsir 2083 BS) with 0 errors.
- **2026-10-06:** Google Analytics 4 Integration: Installed `@next/third-parties` and integrated `GoogleAnalytics` with Measurement ID `G-VBLLG090FH` (with `NEXT_PUBLIC_GA_ID` env variable support) in root `src/app/layout.tsx`. Followed official Next.js App Router third-party script guidelines (`afterInteractive` loading strategy, zero duplication, global layout integration). Added `NEXT_PUBLIC_GA_ID` to `.env.local` and `.env.example`. Verified production build with 130 static/dynamic routes and 0 TypeScript errors.
- **2026-10-06:** Phase 9 â€” SEO Internal & External Linking System:
  - **Entity Directory & Utilities:** Built `src/lib/seo/internal-links.ts` providing a canonical searchable index of all 8 franchise teams, 53 confirmed squad players, 32 fixtures, core tournament pages (`/schedule`, `/points-table`, `/teams`, `/players`, `/stats`, `/news`, `/about`), published news, and TU venue with relevance-scored search algorithm; HTTP/HTTPS validation & sanitization for external links; markdown link extraction and unlinking helpers.
  - **Rich Text Renderer:** Built `src/lib/seo/rich-text.tsx` to safely parse markdown links `[anchor](url)` into Next.js `<Link>` elements for internal canonical relative URLs and secure `<a>` tags (`target="_blank" rel="noopener noreferrer"` with `â†—` icon) for external URLs. Zero `dangerouslySetInnerHTML`.
  - **Admin Link Modal UI:** Built `src/components/admin/AdminLinkModal.tsx` modal dialog supporting instant NPL entity search recommendations, category tabs, canonical URL previews, external web URL validation with editorial safety tips, and unlinking.
  - **Editor Integration:** Upgraded `AdminArticleContentEditor.tsx` with selection tracking across all block types (headings, paragraphs, lists, quotes, FAQs), `Ctrl+K` keyboard shortcut, active link chips bar under blocks, block header `[ ðŸ”— Link ]` tool button, floating selection pill `[ ðŸ”— Link Selection: "Janakpur Bolts" (Ctrl+K) ]`, edit modal, and unlinking.
  - **Public Frontend Wiring:** Updated `src/app/news/[slug]/page.tsx` with `renderRichText` across headings, paragraphs, lists, quotes, FAQs, and standalone link blocks.
  - **Production Build:** âœ… 130 static/dynamic routes compiled cleanly with 0 TypeScript/ESLint errors.
- **2026-10-06:** Inline Rich Text Formatting & Selection Actions: Added full formatting support in article editor (`AdminArticleContentEditor.tsx`) including `Ctrl+B` (bold `**...**`), `Ctrl+I` (italic `*...*`), `Ctrl+K` (link modal), and floating selection toolbar with Bold, Italic, Link, Copy, and Cut actions; upgraded `src/lib/seo/rich-text.tsx` to render markdown `**bold**` as `<strong>` and `*italic*` as `<em>` in public articles alongside internal/external links. Production build: 131 routes, 0 errors.
- **2026-10-07:** Schedule Date Mismatch Fix & Accuracy Notice Removal: Corrected typographical error in `src/components/schedule/TournamentSummary.tsx` where Nepali date showed `à¥© à¤•à¤¾à¤°à¥à¤¤à¤¿à¤•` (3 Kartik) instead of `à¥¯ à¤•à¤¾à¤°à¥à¤¤à¤¿à¤•` (9 Kartik); aligned Nepali date range in `src/components/stats/PreTournamentStatsState.tsx` from `à¥¬ à¤®à¤‚à¤¸à¤¿à¤°` to `à¥« à¤®à¤‚à¤¸à¤¿à¤°`; updated `TOURNAMENT_INFO.isConfirmed` from `false` to `true` in `src/lib/data/schedule-data.ts`; removed provisional "Schedule Accuracy Notice" warning banner from `TournamentSummary.tsx` following official announcement of tournament dates (26 Oct â€“ 21 Nov 2026 / 9 Kartik â€“ 5 Mangsir 2083 BS) by CAN; updated `ScheduleFAQSection.tsx` confirmation FAQ; production build: 132 routes compiled with 0 errors.
- **2026-10-09:** Interactive Match Showcase & Table Blocks in Editorial Articles: Created `ArticleMatchShowcase.tsx` (`src/components/news/ArticleMatchShowcase.tsx`) providing an interactive match showcase card with official franchise logos (`/images/teams/*.webp`), team headers, captain bylines, VS badge, 3 interactive tabs (Match Factsheet Table, Squad & Rivalry Comparison, Venue & Broadcast), and scorecard / team squad links. Extended `ArticleBlockType` with `TableBlock` and `MatchBlock` across `article-blocks.ts`, `AdminArticleContentEditor.tsx`, and `news/[slug]/page.tsx`. Synchronized Supabase article `npl-season-3-first-match-date-time-venue-nepali-date` with embedded match and schedule specification table blocks after the opening details section, and added `article-08` into static fallback dataset `news-data.ts`. Production build: 135 routes compiled with 0 errors.
- **2026-10-10:** Google Search Site Name SEO Fix: Resolved issue where Google Search displayed default hosting provider title ("Vercel") instead of "NPL Hub Nepal". Created `public/manifest.json` with site name and brand icons; added `public/favicon.ico`; updated `src/app/layout.tsx` metadata with `appleWebApp.title = "NPL Hub Nepal"`, `manifest: "/manifest.json"`, `icons` array (`favicon.ico` + `images/logo.png`), canonical URL `/`, and embedded Schema.org `WebSite` and `Organization` JSON-LD structured data with site name and official logo URL in `<body>`. Production build: 135 routes compiled cleanly with 0 errors.
- **2026-10-12:** Evergreen Live Hub Article ("NPL 2026 Points Table, Live Score & Today's Match"): Created `src/components/news/LiveHubWidgets.tsx` delivering 4 server-rendered live tournament widgets (`TodayMatch`, `PointsTableWidget`, `LatestResults`, `UpcomingFixtures`) with zero-state alphabetical 8-team standings, NPT timezone handling, top-4 qualification marker ("Q") & legend, and internal link to `/points-table`. Extended article renderer in `src/app/news/[slug]/page.tsx` supporting token replacement (`[[TODAY_MATCH]]`, `[[POINTS_TABLE]]`, `[[LATEST_RESULTS]]`, `[[UPCOMING_FIXTURES]]`) and `## ` headings while escaping plain text. Added `FAQPage` JSON-LD structured data and visible last-updated NPT date. Added canonical article (`article-09`, slug: `npl-2026-points-table-live-score`) to `news-data.ts` and synchronized to Supabase with 8 franchise relations. Production build: 138 static routes compiled cleanly with 0 errors.
- **2026-10-14:** NPL Season 3 Squad Rankings Editorial Article: Published new article (`article-10`, slug: `npl-season-3-squad-rankings-strongest-team`, title: "NPL Season 3 Squad Rankings: Which Team Looks Strongest on Paper?") as an independent editorial ranking of all 8 franchise squads assessed on 4 criteria (batting, bowling, overseas power, squad depth, 1â€“10 each). Rankings: 1 Janakpur Bolts (33), 2 Lumbini Lions (33), 3 Kathmandu Gorkhas (31), 4 Sudurpaschim Royals (29), 5 Chitwan Rhinos (28), 6 Biratnagar Kings (27), 7 Pokhara Avengers (25, provisional), 8 Karnali Yaks (22, provisional). Article inserted into Supabase `news_articles` with 8 franchise team relations. Static fallback entry added to `news-data.ts`. Internal links added to 3 existing Supabase articles (overseas signings, Kathmandu Gorkhas squad, Lumbini Lions squad). Also fixed missing space in "NPL 2026 Live Stream:How to Watch Season 3 Free" â†’ "NPL 2026 Live Stream: How to Watch Season 3 Free" title in Supabase. Production build: 139 routes compiled cleanly, 0 TypeScript errors, `/news/npl-season-3-squad-rankings-strongest-team` returns HTTP 200, URL present in `/sitemap.xml`.
- **2026-10-16:** AdSense Readiness & Policy Remediation: Completed comprehensive Google AdSense compliance fixes across the platform: (1) Created standalone `/privacy-policy` covering GA4 measurement (`G-VBLLG090FH`), Google AdSense advertising cookies, personalization opt-outs (Ads Settings & aboutads.info), contact handling, and data retention; (2) Created standalone `/contact` with official email (`nplhubnepal@gmail.com`), correction guidelines, and CAN separation; (3) Created standalone `/editorial-policy` detailing source verification, zero fabricated data, corrections protocol, and trademark fair use; (4) Created standalone `/terms` outlining acceptable use, accuracy limits, and IP notices; (5) Resolved factual risks: qualified Rohit Paudel's Lumbini Lions captaincy as reported for Season 3, corrected Pokhara Avengers captain to Kushal Bhurtel in article-07, corrected Janakpur Bolts title attribution, marked broadcast and ticketing partners in article-08 as provisional/subject to official confirmation; (6) Verified all match slugs (`match-1-lumbini-lions-vs-sudurpaschim-royals` is valid canonical Match 1 fixture); (7) Standardized `public/manifest.json` with separate `any` and `maskable` icon entries and light background; (8) Corrected fallback OG image in code and created `public/og-image.png`; (9) Updated `sitemap.ts` to include policy pages and strictly filter published news via `getPublishedArticleSlugs` (112 URLs in sitemap); (10) Added `robots: { index: false, follow: false }` for draft articles and suppressed raw placeholder tokens; (11) Updated global Footer with dedicated Platform & Legal navigation. Production build: 144 static/dynamic routes compiled with 0 TypeScript errors and 0 ESLint errors.
- **2026-10-17:** Contact Form & Public Contact Details: Built and integrated a functional contact form and verified public contact details on `/contact`: (1) Created server-side API route `/api/contact` (validates name, email, subject, message; enforces min/max length constraints; honeypot `_gotcha` anti-spam filter; forwards submissions to Formspree via `FORMSPREE_FORM_ID` / `CONTACT_FORM_ENDPOINT`; provides graceful 503 fallback when pending owner configuration); (2) Created responsive client component `ContactForm.tsx` matching sports-editorial design tokens, complete with subject suggestion chips, live character counter, accessible aria attributes, loading spinner, and success/error states; (3) Displayed owner's phone number `+977 9814996840` (`tel:+9779814996840`) in contact card on `/contact` and in `/privacy-policy`; (4) Updated Section 2 and Section 13 in `/privacy-policy` describing contact form data collection, encryption, retention, and telephone contact; (5) Documented Formspree setup instructions in `.env.example`. Production build: 144 static/dynamic routes, 0 TypeScript errors, 0 ESLint errors.
- **2026-10-20:** NPL Season 3 Complete Player Directory & Local Portrait Integration: Audited all 8 NPL Season 3 franchise rosters against official reference APIs and confirmed signings; expanded player directory from 53 retained players to all 127 confirmed squad members (Biratnagar Kings: 16, Chitwan Rhinos: 17, Janakpur Bolts: 17, Karnali Yaks: 14, Kathmandu Gorkhas: 16, Lumbini Lions: 16, Pokhara Avengers: 16, Sudurpaschim Royals: 15); downloaded and converted/compressed all 127 authentic player portraits into local optimized WebP assets in `public/images/players/` (480px, quality 85) with zero hotlinking; built reusable client-side `PlayerAvatar.tsx` component with graceful fallback to team brand-colored initials on load error; connected portraits and dynamic status badges ("Confirmed Retained" vs "Confirmed Squad") into `PlayerCard.tsx`, `PlayerHero.tsx`, and `TeamSquadSection.tsx`; upgraded Schema.org `ItemList` and `Person` JSON-LD schemas and OpenGraph/Twitter cards with player image URLs; updated franchise squad counts in `teams-data.ts`; synchronized all 127 players and `player_seasons` to remote Supabase PostgreSQL; regenerated `supabase/seed.sql`; verified with `qa-verify.mjs` (0 errors), `npm run lint` (0 errors), `npm run validate:playoff` (0 errors), and `npm run build` (220 static routes generated with 0 errors).
- **2026-10-26 (Session A â€” Pre-deploy audit):** Comprehensive production audit and repair pass on tournament opening day (NPT). Key changes:
  - **Evening match time correction:** All 17 evening match times corrected from `4:30 PM NPT` -> `5:00 PM NPT` across schedule-data.ts, news-data.ts (13+ occurrences + diaspora timezone conversions), supabase/seed.sql, and 5 other source files. Supabase DB directly updated. News synced (all 10 articles).
  - **TheSportsDB API key fix:** Default free key `3` (permanently disabled) -> `123` in thesportsdb-provider.ts. Verified: 8 NPL teams registered; NO 2026 Season 3 fixtures in TheSportsDB (only 2024/2025). Match management remains manual via admin scorecard.
  - **Mock provider fix:** Corrected mock live match teams to Lumbini Lions vs Sudurpaschim Royals (Match 1 opener).
  - **Gemini commentary multi-model fallback:** gemini-provider.ts chains gemini-2.5-flash -> gemini-3.5-flash-lite -> gemini-3.8-flash -> gemini-2.0-flash; added response cleaning and minimum length validation.
  - **AI commentary sample events:** ai-commentary/index.ts â€” replaced hardcoded wrong team names with match-aware resolveMatchTeams() lookup.
  - **LiveCommentaryFeed.tsx:** Feed now renders for all match states (upcoming/live/completed) with contextual empty-state messages.
  - **MatchScoreboard.tsx RR fix:** Uses oversToDecimal(overs, wickets) â€” correctly handles all-out innings (10 wkts -> full 20 overs quota per NRR rules).
  - **src/lib/date-utils.ts (new):** Nepal timezone utilities â€” getNepalDateString(), getNepalTimeString(), getNepalDateDetails() (BS conversion), resolveTodayMatches().
  - **sync-news-to-supabase.ts bug fix:** Slug-based pre-lookup before upsert handles articles with UUID-style primary keys.
  - **Build:** npm run build â€” 223 static pages, 0 TypeScript errors, 0 ESLint errors. Committed 916e670, pushed to master; Vercel redeploy triggered.




- **2026-10-26 (Phase 10 — AI News Agent Milestone 1):** Built isolated AI News Agent foundation:
  - **Database Migration:** `supabase/migrations/20261023000000_ai_news_agent.sql` created with `agent_config` singleton, `agent_runs` audit log, and `news_articles.ai_generated` column.
  - **Agent Engine:** Created `src/lib/agent/` modules (`types.ts`, `config-repository.ts`, `run-repository.ts`, `sources/google-news-rss.ts`, `deduplication.ts`, `gemini-news-generator.ts`, `article-builder.ts`, `runner.ts`).
  - **Execution Routes:** Built protected `/api/agent/news-scan` endpoint (`x-cron-secret` auth) and `/api/admin/agent/trigger` (Supabase JWT auth for manual testing).
  - **Admin Control UI:** Built `/admin/agent` page with master toggle, interval guide, source toggles, manual scan trigger, and live run log table. Added navigation link to `AdminShell.tsx`.
  - **Vercel Scheduling:** Created `vercel.json` with daily cron stub; documented `cron-job.org` integration for 1–2 hour sub-daily execution.
  - **Production Build:** ✅ 228 routes compiled cleanly with 0 TypeScript errors.

- **2026-10-26 (Live Match #1 & Scorecard Integration):**
  - **Live Score Source Identified:** Discovered active ESPN Cricinfo live scorecard for NPL Season 3 Match #1 (SPR vs LUL) at Tribhuvan University Ground.
  - **Live Score Embed & Route:** Added espnMatchPath to ScheduleMatch and mapped in src/lib/repository/matches.ts. Built /api/matches/[slug]/live-score route and LiveScoreEmbed.tsx component providing interactive real-time ball-by-ball scorecard directly on /matches/[slug].
  - **Clean Commentary Experience:** Removed fake mock commentary events from Supabase match_commentary table; removed public 'Test AI Commentary' button to protect free Gemini quota; configured clean upcoming placeholder.
  - **Supabase Match State Synchronized:** Set Match #1 status to 'live' with initial live score data.
  - **Production Deployed:** Verified on https://nplhubnepal.vercel.app/matches/match-1-lumbini-lions-vs-sudurpaschim-royals (HTTP 200).

- **2026-10-26 (Full In-Play Overhaul, Multi-Match Sync & Automated Standings Engine):**
  - **Dual-Innings Scorecard Persistence:** Fixed issue where 1st innings (Sudurpaschim Royals) score was lost when 2nd innings (Lumbini Lions) started. The parser in `route.ts` and `live-sync-score.mjs` now iterates through all innings in `d.innings`, preserving both `team1` and `team2` scores (`88/3 (9.5 ov)` and `87/10 (17.2 ov)`).
  - **Native In-Play Center (Cookie Loop Eliminated):** Completely removed third-party `<iframe>` embed from `LiveScoreEmbed.tsx`, eliminating browser third-party cookie consent infinite reloads. Replaced with clean, responsive in-play stats showing live batters at the crease (with active striker badge, balls, 4s, 6s, SR), active bowlers (O, M, R, W, Econ), and live situation note. Only renders when `status === "live"`.
  - **Redesigned Commentary Feed:** Upgraded `LiveCommentaryFeed.tsx` from monospace CLI aesthetic to broadcast-grade sports UI with interactive filter tabs (`[ All Deliveries ]`, `[ 🚨 Wickets ]`, `[ 💥 Boundaries ]`), over pills (`17.2`), color-coded event badges (`WICKET`, `SIX!`, `FOUR!`), bold event headlines, and batter/bowler chips.
  - **Multi-Match Live Sync Daemon:** Upgraded `scripts/live-sync-score.mjs` to dynamically map all 32 NPL fixtures sequentially (`1558581 + matchNumber`), auto-detect when upcoming matches begin, stream ball-by-ball commentary to Supabase `match_commentary`, and detect match completion.
  - **Automated Points Table Recalculation:** Built `scripts/recalculate-standings.mjs` and hooked into `live-sync-score.mjs` and `/api/matches/[slug]/live-score`. Computes standard T20 points (2 for win, 1 for tie/NR, 0 for loss) and exact mathematical NRR (all-out innings counted as full 20.0 overs). Corrected NRR sorting in `src/lib/data/standings.ts` so negative NRR teams rank below unplayed teams with 0 points. Match 1 results synchronized to `team_seasons`: Lumbini Lions (Position 1, 2 pts, +4.599 NRR) and Sudurpaschim Royals (Position 8, 0 pts, -4.599 NRR).
  - **Production Verification:** Built cleanly with Next.js Turbopack (`229 static/dynamic routes`, 0 TypeScript errors, 0 ESLint errors). Daemon running in background monitoring Match #2 (Biratnagar Kings vs Chitwan Rhinos).

- **2026-10-26 (UX Overhaul — Commentary Feed, Hero Countdown, Schedule Badge, Stats Season 3):**
  - **LiveCommentaryFeed.tsx (full rewrite):** Shows only latest 5 deliveries by default (not all 82). "View All Deliveries" expand button for full history. Easy-language formatter (`formatEasyCommentary()`) converts ESPN raw text into plain human-readable commentary. Match equation banner (green card showing "X runs needed off Y balls" or result). Filter tabs (All / Wickets / Boundaries) preserved. Fetches both `/api/matches/{slug}/commentary` AND `/api/matches/{slug}/live-score`.
  - **Hero Countdown (`src/lib/countdown.ts`, `page.tsx`, `HeroSection.tsx`):** Countdown now explicitly skips `completed` / `abandoned` / `postponed` matches. Homepage server component (`page.tsx`) calls `getAllMatches()` async to get Supabase-fresh data and passes it to `<HeroSection matches={allMatches} />`. Hero now correctly advances to Match 2 countdown when Match 1 is marked completed.
  - **Schedule Status Badge (`FullFixturesSection.tsx`):** Updated both desktop and mobile badge components to render correct status: `completed` → "Completed", `live` → "Live Now", `tba` → "Time TBA", default → "Scheduled". Desktop badge also shows result text below for completed matches.
  - **schedule-data.ts:** Match 1 static fixture updated to `status: "completed"` with full verified result, scores, and `resultDetails`. `TOURNAMENT_INFO.status` updated to `"Live"`.
  - **Stats Page Season 3 Default:** `stats/page.tsx` and `StatsHubClient.tsx` now default to `season-3`. Season 3 is `/stats`; Season 2 is `/stats?season=season-2`. Render condition uses `isAvailable` (true when `status === "completed" || "in-progress"`). Stats page now shows Season 3 Match 1 verified data by default.
  - **stats-registry.ts:** Season 3 first in `AVAILABLE_SEASONS`, `status: "in-progress"`, `badgeText: "Current Tournament"`. Default season in `getSeasonStats()` changed to `"season-3"`. Local `SeasonOption.status` type extended to accept `"in-progress"`.
  - **stats-season3-data.ts (full rewrite):** Real Match 1 data. Standings: All 8 teams (LL #1, 2pts, +4.599 NRR; SPR #8, 0pts, -4.599 NRR). Awards: Sher Malla 3/11 POTM. Leaderboards: Matt Short 40 (222.22 SR), Aasif Sheikh 32, Bibek Mahato 4/14. `PlayerSeasonStats` array with all required fields (null for missing). `VerifiedLeagueMatch` shape corrected. `SourceReference.description` field used (no `verified`).
  - **stats-types.ts:** `SeasonStatus` type already included `"in-progress"`. `SeasonOption.status` uses `SeasonStatus`. `PlayerSeasonStats` all required fields enforced.
  - **Build:** ✅ `npm run build` → 229 routes, 0 TypeScript errors. Committed `262fa32`, pushed to master; Vercel redeploy triggered.

- **2026-10-26 (Hybrid AI Commentary & Delivery Feed Clarity):**
  - **Hybrid AI Engine (`/api/matches/[slug]/ai-commentary`):** Built dedicated server-side endpoint invoking Gemini (`gemini-2.5-flash-lite` -> `gemini-2.0-flash` -> `gemini-1.5-flash`) with multi-key failover via `executeWithKeyFailover`. Only high-impact moments (wickets, sixes, fours, pressure dots) trigger AI enrichment; routine balls run via client-side varied phrase templates. In-memory deduplication cache prevents repeated Gemini calls for identical deliveries.
  - **UI Readability & Visual Hierarchy (`LiveCommentaryFeed.tsx`):**
    - High-contrast flat backgrounds replacing washed-out gradients (`#1a0505` for wickets, `#110a1c` for sixes, `#1a1000` for fours, `#071410` for latest ball, `#0b101b` for normal).
    - Left accent stripe indicator per event type.
    - Crisp white/light-slate typography for instant readability on mobile/desktop.
    - `✨ AI Commentary` badge for Gemini-generated moments and subtle `enhancing…` indicator during streaming.
    - Varied template seed algorithm ensuring consecutive 1-run or dot balls display distinct phrasing without repeating.
  - **Build & Verification:** ✅ `npm run build` completed with 0 errors (230 routes compiled).

- **2026-10-27 (Match 2 Live Scoreboard & Commentary Feed Polish):**
  - **Live Scoreboard Visibility & Contrast Fix:** Replaced light-pink low-contrast banner with solid deep dark crimson `#120406` and bright white typography for the live match status banner, rendering `🔴 LIVE MATCH IN PROGRESS` and current score summary with 100% readability in both light and dark modes.
  - **Graceful "Yet to bat" Handling:** Configured `MatchScoreboard.tsx` so fielding teams with 0.0 overs display `"Yet to bat"` instead of confusing `0/0 (0.0)` figures while the opposing side is actively batting.
  - **Live Sync Daemon Upgrade (`scripts/live-sync-score.mjs`):**
    - Multi-over aggregation: Iterates through all ESPN `comms` over blocks instead of just `comms[0]`, capturing all deliveries from ball 0.1 onward into Supabase.
    - Full-text event synthesis: Automatically translates raw event codes (`FOUR`, `SIX`, `no run`, `1 run`) into clean descriptive ball commentary with real player names.
    - Real-time in-play roster: Ingests active batters (`batters`) and current bowlers (`bowlers`) directly into match state for immediate display.
  - **Build & Verification:** ✅ `npm run build` completed with 0 errors (230 routes compiled).

- **2026-10-27 (AI News Agent — Gemini Fallback & Model Modernization):**
  - **Model Modernization:** Replaced retired `gemini-1.5-flash` with verified active models in `gemini-news-generator.ts`: `gemini-2.5-flash` -> `gemini-3.5-flash-lite` -> `gemini-3.8-flash`, aligning with `gemini-structurer.ts`.
  - **404 Model Not Found Fast-Fail:** Upgraded `executeWithKeyFailover` in `gemini-keys.ts` so HTTP 404 immediately returns `isModelNotFound=true`, preventing wasteful key-rotation attempts on non-existent model endpoints.
  - **Model Fallback Chain:** `gemini-news-generator.ts` immediately advances to the next candidate model upon encountering a 404, while preserving key rotation for 429 rate limits and 5xx transient errors.
  - **Test Suite & Verification:** 13/13 Gemini failover and fallback tests passed (`scripts/test-gemini-failover.mjs`); 20/20 admin authorization tests passed (`scripts/test-admin-authorization.mjs`); TypeScript check passed (0 errors); Next.js production build succeeded (229 routes).

- **2026-10-27 (Match 2 Result Accuracy, Live Commentary Sync, and Status Transition Automation):**
  - **Commentary Player Mismatch Resolved:** Purged 4 stale test commentary deliveries with fake players (`Mousley`, `Bopara`, `Russell` over 19.4-19.6) from `match_commentary` for Match 2. Top deliveries now accurately show final overs bowled by Taylor, Rijan Dhakal, and Kamal Singh Airee to Shubham Ranjane and Sandeep Lamichhane, aligning 100% with in-play statistics.
  - **In-Play Batter/Bowler Fallback:** Enhanced `LiveCommentaryFeed.tsx` so if a delivery record lacks explicit player names, it gracefully falls back to the active striker/batter and current bowler from live in-play stats.
  - **Match Result Statement Bug Fixed:** Eliminated bug where ESPN's `current_summary` (the losing side's scorecard string e.g. `"Biratnagar Kings (NPL) 149 (19.3 ov...)"`) was written to `result_statement`. Fixed in both `src/app/api/matches/[slug]/live-score/route.ts` and `scripts/live-sync-score.mjs` to extract or compute clean winner statements (e.g. `"Chitwan Rhinos won by 8 runs"`). Match 2 updated in Supabase and standings recomputed (Chitwan Rhinos #2, 2 pts, +0.400 NRR).
  - **Automated Match Status Transitions (Scheduled → Live → Completed):**
    - Both `scripts/live-sync-score.mjs` daemon and server-side `mapSupabaseMatch` now compare scheduled start time with Nepal Standard Time (`nowMs >= startMs`).
    - When scheduled time is reached, toss occurs, or innings start, status flips automatically to `live` without requiring manual admin intervention.
    - When ESPN reports outcome (`"won by"`, `"Match over"`, or innings complete), status flips automatically to `completed`, stores clean winner statement, and recalculates tournament standings.
    - Updated `MatchHeader.tsx` to display a dedicated high-contrast `🔴 Live Match in Progress` banner during active play instead of falling back to pre-match notice.
    - Updated `getFeaturedUpcomingMatch()` in `src/lib/repository/matches.ts` to prioritize `live` matches before upcoming fixtures.
  - **Build & Verification:** ✅ `npm run build` passed with 0 errors across all 229 routes. Continuous live sync daemon active for Match 3 (Janakpur Bolts vs Karnali Yaks).

- **2026-10-27 (Automated Stats Pipeline — Season 3 live-update engine):**
  - **ESPN Scorecard Sync Engine (`scripts/sync-season3-stats.mjs`):** Crawls ESPN Cricinfo full-scorecard via canonical `__NEXT_DATA__` JSON. Extracts batters (`battedType === "yes"`), bowlers (overs, maidens, runs, wickets, economy), and Player of the Match award. Accumulates cumulative season stats and upserts to `player_season_stats` (keyed `s3_${slug}`). Triggers `recalculateStandings("season-3")` to keep `team_seasons` accurate after each completed match. Verified ingestion: 2 tournament awards + 44 player records across Matches 1 & 2.
  - **Daemon Integration (`scripts/live-sync-score.mjs`):** When any live match reaches `isCompleted`, the daemon now automatically calls `syncCompletedMatchStats()` — zero manual intervention required for `/stats` to update when Match 3 (or any subsequent match) finishes.
  - **Dynamic `/stats` Page (`src/app/stats/page.tsx`):** Added `force-dynamic` + `revalidate = 0` so the page executes server-side on every request with no stale build-time cache.
  - **Live Supabase Scorecards (`src/lib/repository/stats.ts`):** `verifiedLeagueMatches` now fetched dynamically from Supabase `matches` table (`season_id = "season-3" AND status = "completed"`) rather than hardcoded static data.
  - **Static Fallback Updated (`src/lib/data/stats-season3-data.ts`):** Match 2 data fully reflected:
    - Standings: Chitwan Rhinos #2 (2pts, +0.400 NRR), Biratnagar Kings #7 (0pts, -0.400 NRR).
    - Award: Kamal Airee, PotM Match #2 (4/26, 4.0 ov).
    - Match 2 scorecard: CHR 157/3 (20.0) def BIK 149/10 (19.3) by 8 runs.
    - Batting leaderboard extended with Match 2 batters: Dawid Malan 70 (#1 run scorer in Season 3), Imran Sheikh 39, Andre Russell 33, Ravi Bopara 32*, Dan Mousley 29*, Lokesh Bam 26.
    - Bowling leaderboard extended: Kishor Mahato 4/22 and Kamal Airee 4/26 join Bibek Mahato 4/14 at top.
    - `playerStats` array extended with 10 new Match 2 player entries (all null-safe, verified figures).
    - Integrity count: `verifiedLeagueMatchesCount: 2`.
  - **Build & Commit:** ✅ `npm run build` → 228 routes, 0 TypeScript errors. Committed `e03de82`, pushed to `origin/master`. Vercel redeploy triggered. Live sync daemon active for Match 3.

- **2026-10-27 (Adstra Advertising Integration & Scope Invariant Fix):**
  - **Adstra / Adsterra Integration:** Added Adstra advertising container (`#container-3b5bf07b9b8bde0648233957a035a39b`) and script (`https://czernik.org/21/3b5bf07b9b8bde0648233957a035a39b`) for monetization during NPL Season 3 while AdSense review remains pending.
  - **Modular Architecture:** Created `src/components/ads/AdstraBanner.tsx` client component positioned beneath `<Header />` across all public pages, safely disabled on `/admin` management routes.
  - **AdSense & SEO Preserved:** Retained existing Google AdSense verification script (`ca-pub-8861868952444352`), `public/ads.txt`, GA4 tracking, and JSON-LD schema intact.
  - **Core Sync Scope Fix:** Resolved variable redeclaration (`matchDate`, `matchTime`, `startMs`, `nowMs`) in `src/lib/sync/live-sync-core.ts`.
  - **Build & Verification:** ✅ `npx tsc --noEmit` passed with 0 errors. `npm run build` generated 228 routes cleanly in Turbopack. Confirmed script and container presence in SSR HTML.






