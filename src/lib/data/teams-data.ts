/**
 * NPL Franchise Teams — Central Data Source
 *
 * Slugs match `homepage-data.ts` and `schedule-data.ts` exactly.
 *
 * Data accuracy rules:
 * - Do not invent logos, coaches, or squad members.
 * - Where information is not confirmed, use "Not yet available" / "To be announced".
 * - Captain fields carry a confidence value and source metadata so updates
 *   are a simple one-line edit.
 */

export type CaptainConfidence = "confirmed" | "reported";

export interface TeamDetail {
  id: string; // Slug, e.g. "lumbini-lions"
  slug: string;
  name: string;
  shortName: string; // e.g. "LL"
  initials: string;
  region: string; // Province / Region
  city: string;
  brandColor: string; // Hex for borders/accents
  brandBg: string; // Light tint for badges/cards
  crestBg: string; // Background for typographic crest
  crestText: string; // Text color for typographic crest
  logoUrl?: string; // Path to official team logo
  captain: string;
  captainConfidence: CaptainConfidence;
  captainSource: string;
  captainConfirmedAt: string | null;
  coach: string;
  squadStatus: string;
  established: string;
  description: string;
}

export const NPL_TEAM_DETAILS: TeamDetail[] = [
  {
    id: "lumbini-lions",
    slug: "lumbini-lions",
    name: "Lumbini Lions",
    shortName: "LL",
    initials: "LL",
    region: "Lumbini Province",
    city: "Rupandehi",
    brandColor: "#1d4ed8",
    brandBg: "#eff6ff",
    crestBg: "#1e40af",
    crestText: "#ffffff",
    logoUrl: "/images/teams/lumbini-lions.webp",
    captain: "Rohit Paudel",
    captainConfidence: "reported",
    captainSource: "2025 season; unconfirmed for S3",
    captainConfirmedAt: null,
    coach: "Not yet available",
    squadStatus: "Squad to be announced",
    established: "2024",
    description:
      "Representing the historic Lumbini Province, the Lions feature strong regional cricket backing across Rupandehi and Bhairahawa.",
  },
  {
    id: "sudurpaschim-royals",
    slug: "sudurpaschim-royals",
    name: "Sudurpaschim Royals",
    shortName: "SR",
    initials: "SR",
    region: "Sudurpaschim Province",
    city: "Dhangadhi",
    brandColor: "#b45309",
    brandBg: "#fffbeb",
    crestBg: "#92400e",
    crestText: "#ffffff",
    logoUrl: "/images/teams/sudurpaschim-royals.webp",
    captain: "Dipendra Singh Airee",
    captainConfidence: "reported",
    captainSource: "2025 season; unconfirmed for S3",
    captainConfirmedAt: null,
    coach: "Not yet available",
    squadStatus: "Squad to be announced",
    established: "2024",
    description:
      "Rooted in the far-western cricket hotbed of Dhangadhi, the Royals draw passionate support across Sudurpaschim Province.",
  },
  {
    id: "biratnagar-kings",
    slug: "biratnagar-kings",
    name: "Biratnagar Kings",
    shortName: "BK",
    initials: "BK",
    region: "Koshi Province",
    city: "Biratnagar",
    brandColor: "#0284c7",
    brandBg: "#f0f9ff",
    crestBg: "#0369a1",
    crestText: "#ffffff",
    logoUrl: "/images/teams/biratnagar-kings.webp",
    captain: "Sandeep Lamichhane",
    captainConfidence: "reported",
    captainSource: "2025 season; unconfirmed for S3",
    captainConfirmedAt: null,
    coach: "Not yet available",
    squadStatus: "Squad to be announced",
    established: "2024",
    description:
      "Representing Koshi Province and eastern Nepal's industrial hub of Biratnagar, the Kings feature a competitive T20 pedigree.",
  },
  {
    id: "chitwan-rhinos",
    slug: "chitwan-rhinos",
    name: "Chitwan Rhinos",
    shortName: "CR",
    initials: "CR",
    region: "Bagmati Province",
    city: "Chitwan",
    brandColor: "#059669",
    brandBg: "#ecfdf5",
    crestBg: "#065f46",
    crestText: "#ffffff",
    logoUrl: "/images/teams/chitwan-rhinos.webp",
    captain: "Kushal Malla",
    captainConfidence: "reported",
    captainSource: "2025 season; unconfirmed for S3",
    captainConfirmedAt: null,
    coach: "Not yet available",
    squadStatus: "Squad to be announced",
    established: "2024",
    description:
      "Proudly representing the fertile Terai plains and Bagmati Province, the Rhinos command an enthusiastic fan base in Bharatpur.",
  },
  {
    id: "karnali-yaks",
    slug: "karnali-yaks",
    name: "Karnali Yaks",
    shortName: "KY",
    initials: "KY",
    region: "Karnali Province",
    city: "Surkhet",
    brandColor: "#4f46e5",
    brandBg: "#eef2ff",
    crestBg: "#3730a3",
    crestText: "#ffffff",
    logoUrl: "/images/teams/karnali-yaks.webp",
    captain: "Sompal Kami",
    captainConfidence: "reported",
    captainSource: "2025 season; unconfirmed for S3",
    captainConfirmedAt: null,
    coach: "Not yet available",
    squadStatus: "Squad to be announced",
    established: "2024",
    description:
      "Representing the mountainous Karnali Province, the Yaks embody resilience and rising cricket passion from Surkhet and western Nepal.",
  },
  {
    id: "kathmandu-gorkhas",
    slug: "kathmandu-gorkhas",
    name: "Kathmandu Gorkhas",
    shortName: "KG",
    initials: "KG",
    region: "Kathmandu Valley",
    city: "Kathmandu",
    brandColor: "#b91c1c",
    brandBg: "#fef2f2",
    crestBg: "#991b1b",
    crestText: "#ffffff",
    logoUrl: "/images/teams/kathmandu-gorkhas.webp",
    captain: "Karan KC",
    captainConfidence: "reported",
    captainSource: "2025 season; unconfirmed for S3",
    captainConfirmedAt: null,
    coach: "Not yet available",
    squadStatus: "Squad to be announced",
    established: "2024",
    description:
      "The capital franchise representing Kathmandu Valley, drawing strong fan support from cricket enthusiasts across the capital region.",
  },
  {
    id: "pokhara-avengers",
    slug: "pokhara-avengers",
    name: "Pokhara Avengers",
    shortName: "PA",
    initials: "PA",
    region: "Gandaki Province",
    city: "Pokhara",
    brandColor: "#0891b2",
    brandBg: "#ecfeff",
    crestBg: "#155e75",
    crestText: "#ffffff",
    logoUrl: "/images/teams/pokhara-avengers.webp",
    captain: "Kushal Bhurtel",
    captainConfidence: "reported",
    captainSource: "2025 season; unconfirmed for S3",
    captainConfirmedAt: null,
    coach: "Not yet available",
    squadStatus: "Squad to be announced",
    established: "2024",
    description:
      "Set against the backdrop of the Annapurna range, the Avengers represent Gandaki Province with an energetic brand of T20 cricket.",
  },
  {
    id: "janakpur-bolts",
    slug: "janakpur-bolts",
    name: "Janakpur Bolts",
    shortName: "JB",
    initials: "JB",
    region: "Madhesh Province",
    city: "Janakpur",
    brandColor: "#d97706",
    brandBg: "#fffbeb",
    crestBg: "#b45309",
    crestText: "#ffffff",
    logoUrl: "/images/teams/janakpur-bolts.webp",
    captain: "Harmeet Singh",
    captainConfidence: "confirmed",
    captainSource: "Officially announced August 2026 for Season 3, replacing Anil Sah",
    captainConfirmedAt: "2026-08",
    coach: "Not yet available",
    squadStatus: "Squad to be announced",
    established: "2024",
    description:
      "Representing the cultural heartland of Madhesh Province, the Bolts boast passionate support from across Janakpur and the Mithila region.",
  },
];

/** Lookup helper by team id / slug */
export function getTeamBySlug(slug: string): TeamDetail | undefined {
  return NPL_TEAM_DETAILS.find((team) => team.slug === slug || team.id === slug);
}

/** All teams ordered for directory */
export function getAllTeams(): TeamDetail[] {
  return NPL_TEAM_DETAILS;
}
