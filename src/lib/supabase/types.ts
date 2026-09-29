/**
 * NPL Hub Nepal — Supabase Database Types Definition
 * Matches 20260928000000_initial_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      seasons: {
        Row: {
          id: string;
          name: string;
          short_name: string;
          year: number;
          status: 'completed' | 'pre-tournament' | 'in-progress';
          edition: string | null;
          dates_display: string | null;
          start_date: string | null;
          end_date: string | null;
          venue: string | null;
          venue_city: string | null;
          total_teams: number;
          total_matches: number;
          league_matches: number;
          playoff_matches: number;
          format: string;
          points_system: string | null;
          champion_team_id: string | null;
          runner_up_team_id: string | null;
          confidence: 'High' | 'Medium' | 'Low' | null;
          confidence_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          short_name: string;
          year: number;
          status: 'completed' | 'pre-tournament' | 'in-progress';
          edition?: string | null;
          dates_display?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          venue?: string | null;
          venue_city?: string | null;
          total_teams?: number;
          total_matches?: number;
          league_matches?: number;
          playoff_matches?: number;
          format?: string;
          points_system?: string | null;
          champion_team_id?: string | null;
          runner_up_team_id?: string | null;
          confidence?: 'High' | 'Medium' | 'Low' | null;
          confidence_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['seasons']['Insert']>;
      };
      teams: {
        Row: {
          id: string;
          slug: string;
          name: string;
          short_name: string;
          initials: string;
          region: string;
          city: string;
          brand_color: string;
          brand_bg: string;
          crest_bg: string;
          crest_text: string;
          logo_url: string | null;
          established: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          short_name: string;
          initials: string;
          region: string;
          city: string;
          brand_color: string;
          brand_bg: string;
          crest_bg: string;
          crest_text: string;
          logo_url?: string | null;
          established?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['teams']['Insert']>;
      };
      team_seasons: {
        Row: {
          id: string;
          season_id: string;
          team_id: string;
          captain_name: string | null;
          captain_confidence: 'confirmed' | 'reported' | null;
          captain_source: string | null;
          captain_confirmed_at: string | null;
          coach: string | null;
          squad_status: string | null;
          standing_position: number | null;
          played: number;
          won: number;
          lost: number;
          no_result: number;
          points: number;
          net_run_rate: number | null;
          runs_scored: number;
          overs_faced_decimal: number;
          runs_conceded: number;
          overs_bowled_decimal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          season_id: string;
          team_id: string;
          captain_name?: string | null;
          captain_confidence?: 'confirmed' | 'reported' | null;
          captain_source?: string | null;
          captain_confirmed_at?: string | null;
          coach?: string | null;
          squad_status?: string | null;
          standing_position?: number | null;
          played?: number;
          won?: number;
          lost?: number;
          no_result?: number;
          points?: number;
          net_run_rate?: number | null;
          runs_scored?: number;
          overs_faced_decimal?: number;
          runs_conceded?: number;
          overs_bowled_decimal?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['team_seasons']['Insert']>;
      };
      players: {
        Row: {
          id: string;
          slug: string;
          name: string;
          display_name: string | null;
          nationality: string;
          date_of_birth: string | null;
          birth_place: string | null;
          batting_style: string | null;
          bowling_style: string | null;
          profile_image: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          display_name?: string | null;
          nationality?: string;
          date_of_birth?: string | null;
          birth_place?: string | null;
          batting_style?: string | null;
          bowling_style?: string | null;
          profile_image?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['players']['Insert']>;
      };
      player_seasons: {
        Row: {
          id: string;
          season_id: string;
          player_id: string;
          team_id: string;
          role: 'Batter' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
          status: 'confirmed' | 'reported' | 'not-announced';
          captain: boolean;
          marquee: boolean;
          player_number: number | null;
          confidence: 'confirmed' | 'reported' | 'unknown';
          source: string | null;
          source_url: string | null;
          source_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          season_id: string;
          player_id: string;
          team_id: string;
          role: 'Batter' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
          status?: 'confirmed' | 'reported' | 'not-announced';
          captain?: boolean;
          marquee?: boolean;
          player_number?: number | null;
          confidence?: 'confirmed' | 'reported' | 'unknown';
          source?: string | null;
          source_url?: string | null;
          source_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['player_seasons']['Insert']>;
      };
      matches: {
        Row: {
          id: string;
          season_id: string;
          match_number: number;
          slug: string;
          stage: 'League' | 'Qualifier 1' | 'Eliminator' | 'Qualifier 2' | 'Final';
          team1_id: string | null;
          team1_placeholder: string | null;
          team2_id: string | null;
          team2_placeholder: string | null;
          match_date: string;
          formatted_date: string;
          bs_date: string;
          bs_date_nepali: string;
          day_of_week: string;
          match_time: string;
          venue: string;
          status: 'upcoming' | 'completed' | 'live' | 'tba';
          result: string | null;
          winner_team_id: string | null;
          winner_name: string | null;
          win_margin: string | null;
          win_type: 'runs' | 'wickets' | 'super_over' | 'no_result' | 'abandoned' | null;
          result_statement: string | null;
          player_of_the_match: string | null;
          toss_winner_team_id: string | null;
          toss_decision: 'bat' | 'bowl' | null;
          scores: Json | null;
          is_provisional: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          season_id: string;
          match_number: number;
          slug: string;
          stage: 'League' | 'Qualifier 1' | 'Eliminator' | 'Qualifier 2' | 'Final';
          team1_id?: string | null;
          team1_placeholder?: string | null;
          team2_id?: string | null;
          team2_placeholder?: string | null;
          match_date: string;
          formatted_date: string;
          bs_date: string;
          bs_date_nepali: string;
          day_of_week: string;
          match_time: string;
          venue: string;
          status: 'upcoming' | 'completed' | 'live' | 'tba';
          result?: string | null;
          winner_team_id?: string | null;
          winner_name?: string | null;
          win_margin?: string | null;
          win_type?: 'runs' | 'wickets' | 'super_over' | 'no_result' | 'abandoned' | null;
          result_statement?: string | null;
          player_of_the_match?: string | null;
          toss_winner_team_id?: string | null;
          toss_decision?: 'bat' | 'bowl' | null;
          scores?: Json | null;
          is_provisional?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['matches']['Insert']>;
      };
      news_articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string;
          content: Json;
          category: 'Tournament' | 'Teams' | 'Matches' | 'Points Table' | 'Announcements';
          status: 'published' | 'draft';
          featured: boolean;
          image_url: string | null;
          author: string;
          author_role: string;
          read_time: string;
          tags: string[];
          source: string | null;
          source_url: string | null;
          published_at: string;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          title: string;
          excerpt: string;
          content: Json;
          category: 'Tournament' | 'Teams' | 'Matches' | 'Points Table' | 'Announcements';
          status?: 'published' | 'draft';
          featured?: boolean;
          image_url?: string | null;
          author: string;
          author_role: string;
          read_time: string;
          tags?: string[];
          source?: string | null;
          source_url?: string | null;
          published_at?: string;
          updated_at?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['news_articles']['Insert']>;
      };
      news_team_relations: {
        Row: {
          id: string;
          article_id: string;
          team_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          team_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['news_team_relations']['Insert']>;
      };
      player_season_stats: {
        Row: {
          id: string;
          player_season_id: string | null;
          season_id: string;
          player_name: string;
          player_slug: string | null;
          team_id: string;
          team_name: string;
          matches: number | null;
          innings: number | null;
          runs: number | null;
          highest_score: string | null;
          average: number | null;
          strike_rate: number | null;
          wickets: number | null;
          best_bowling: string | null;
          economy: number | null;
          fours: number | null;
          sixes: number | null;
          hundreds: number | null;
          fifties: number | null;
          catches: number | null;
          wicketkeeper_dismissals: number | null;
          confidence: 'High' | 'Medium' | 'Low';
          source_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          player_season_id?: string | null;
          season_id: string;
          player_name: string;
          player_slug?: string | null;
          team_id: string;
          team_name: string;
          matches?: number | null;
          innings?: number | null;
          runs?: number | null;
          highest_score?: string | null;
          average?: number | null;
          strike_rate?: number | null;
          wickets?: number | null;
          best_bowling?: string | null;
          economy?: number | null;
          fours?: number | null;
          sixes?: number | null;
          hundreds?: number | null;
          fifties?: number | null;
          catches?: number | null;
          wicketkeeper_dismissals?: number | null;
          confidence?: 'High' | 'Medium' | 'Low';
          source_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['player_season_stats']['Insert']>;
      };
      tournament_awards: {
        Row: {
          id: string;
          season_id: string;
          award_type: string;
          award_name: string;
          recipient_name: string;
          recipient_player_slug: string | null;
          recipient_team_id: string | null;
          recipient_team_name: string;
          stat_metric: string | null;
          secondary_detail: string | null;
          confidence: 'High' | 'Medium' | 'Low';
          source_note: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          award_type: string;
          award_name: string;
          recipient_name: string;
          recipient_player_slug?: string | null;
          recipient_team_id?: string | null;
          recipient_team_name: string;
          stat_metric?: string | null;
          secondary_detail?: string | null;
          confidence?: 'High' | 'Medium' | 'Low';
          source_note?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tournament_awards']['Insert']>;
      };
    };
  };
}
