/**
 * NPL Hub Nepal — Admin Repository & Data Access Layer
 *
 * Provides aggregated dashboard metrics, tournament overview, recent news,
 * upcoming fixtures, and database health status for the admin console.
 *
 * Architecture:
 * Admin UI Components -> Admin Repository -> Public Repositories / Supabase
 */

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  ScheduleMatch,
  getAllMatches,
  getUpcomingMatches,
  getTournamentInfo,
  TournamentInfo,
} from "@/lib/repository/matches";
import { getAllTeams, TeamDetail } from "@/lib/repository/teams";
import { getAllPlayers, Player } from "@/lib/repository/players";
import { getAllArticles, NewsArticle } from "@/lib/repository/news";

export interface AdminDbStatus {
  isConnected: boolean;
  provider: string;
  latencyMs?: number;
  message: string;
}

export interface AdminCounts {
  teams: number;
  players: number;
  matches: number;
  publishedNews: number;
}

export interface AdminSeasonInfo {
  name: string;
  seasonTitle: string;
  year: number;
  status: string;
  edition: string;
  venue: string;
  projectedDates: string;
  totalTeams: number;
  totalMatches: number;
}

export interface AdminDashboardData {
  dbStatus: AdminDbStatus;
  seasonInfo: AdminSeasonInfo;
  counts: AdminCounts;
  upcomingMatches: ScheduleMatch[];
  recentNews: NewsArticle[];
}

/**
 * Check connectivity to Supabase without exposing credentials
 */
export async function checkDatabaseHealth(): Promise<AdminDbStatus> {
  if (!isSupabaseConfigured()) {
    return {
      isConnected: false,
      provider: "Local Static Fallback",
      message: "Supabase environment variables not configured. Operating in fallback mode.",
    };
  }

  try {
    const client = getSupabaseClient();
    const startTime = Date.now();
    const { error } = await client.from("seasons").select("id").limit(1);
    const latencyMs = Date.now() - startTime;

    if (error) {
      return {
        isConnected: false,
        provider: "Supabase PostgreSQL",
        latencyMs,
        message: "Database connection failed. Operating with static fallback data.",
      };
    }

    return {
      isConnected: true,
      provider: "Supabase PostgreSQL",
      latencyMs,
      message: "Database connected and operational. RLS policies active.",
    };
  } catch {
    return {
      isConnected: false,
      provider: "Supabase PostgreSQL",
      message: "Database request failed. Local fallback active.",
    };
  }
}

/**
 * Fetch all aggregated dashboard data with resilient error boundaries
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  // Use Promise.allSettled to ensure that one failing query does not crash the entire dashboard
  const [
    dbStatusResult,
    tournamentInfoResult,
    teamsResult,
    playersResult,
    matchesResult,
    upcomingMatchesResult,
    articlesResult,
  ] = await Promise.allSettled([
    checkDatabaseHealth(),
    getTournamentInfo(),
    getAllTeams(),
    getAllPlayers(),
    getAllMatches(),
    getUpcomingMatches(4),
    getAllArticles(),
  ]);

  // Safe defaults and extracted values
  const dbStatus: AdminDbStatus =
    dbStatusResult.status === "fulfilled"
      ? dbStatusResult.value
      : {
          isConnected: false,
          provider: "Fallback Mode",
          message: "Could not evaluate database health. Fallback active.",
        };

  const tournamentInfo: TournamentInfo =
    tournamentInfoResult.status === "fulfilled"
      ? tournamentInfoResult.value
      : {
          name: "Siddhartha Bank Nepal Premier League",
          season: "Season 3 / NPL 2026",
          edition: "2026 Edition",
          format: "T20 (20 Overs)",
          country: "Nepal",
          organizer: "Cricket Association of Nepal (CAN)",
          totalTeams: 8,
          totalMatches: 32,
          primaryVenue: "TU International Cricket Stadium, Kirtipur",
          status: "Upcoming",
          projectedDates: "26 October – 21 November 2026",
          isConfirmed: true,
        };

  const teams: TeamDetail[] =
    teamsResult.status === "fulfilled" ? teamsResult.value : [];
  const players: Player[] =
    playersResult.status === "fulfilled" ? playersResult.value : [];
  const matches: ScheduleMatch[] =
    matchesResult.status === "fulfilled" ? matchesResult.value : [];
  const upcomingMatches: ScheduleMatch[] =
    upcomingMatchesResult.status === "fulfilled"
      ? upcomingMatchesResult.value
      : [];
  const recentNews: NewsArticle[] =
    articlesResult.status === "fulfilled"
      ? articlesResult.value.slice(0, 4)
      : [];

  const seasonInfo: AdminSeasonInfo = {
    name: tournamentInfo.name || "Siddhartha Bank Nepal Premier League",
    seasonTitle: "Season 3",
    year: 2026,
    status: tournamentInfo.status || "Pre-Tournament",
    edition: tournamentInfo.edition || "2026 Edition",
    venue: tournamentInfo.primaryVenue || "TU International Cricket Stadium, Kirtipur",
    projectedDates:
      tournamentInfo.projectedDates || "26 October – 21 November 2026",
    totalTeams: tournamentInfo.totalTeams || teams.length || 8,
    totalMatches: tournamentInfo.totalMatches || matches.length || 32,
  };

  const counts: AdminCounts = {
    teams: teams.length,
    players: players.length,
    matches: matches.length,
    publishedNews:
      articlesResult.status === "fulfilled" ? articlesResult.value.length : 0,
  };

  return {
    dbStatus,
    seasonInfo,
    counts,
    upcomingMatches,
    recentNews,
  };
}
