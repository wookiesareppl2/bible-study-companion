console.log("supabaseClient.ts loaded");

import { createClient } from '@supabase/supabase-js';
import type { ChapterIdentifier, CachedChapterContent } from '../types.ts';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Note: The generic is a placeholder for your database types.
// You can generate these types from your Supabase project for full type safety.
// See: https://supabase.com/docs/guides/api/javascript/generating-types

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          study_mode: string | null
          read_through_index: number | null
          user_selected_chapter: Json | null
          completed_chapters: string[] | null
          bookmarks: string[] | null
          notes: Json | null
          cached_content: Json | null
          translation: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          study_mode?: string | null
          read_through_index?: number | null
          user_selected_chapter?: Json | null
          completed_chapters?: string[] | null
          bookmarks?: string[] | null
          notes?: Json | null
          cached_content?: Json | null
          translation?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          study_mode?: string | null
          read_through_index?: number | null
          user_selected_chapter?: Json | null
          completed_chapters?: string[] | null
          bookmarks?: string[] | null
          notes?: Json | null
          cached_content?: Json | null
          translation?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// IMPORTANT: In a production environment, you should use environment variables
// (like process.env.SUPABASE_URL) to keep your Supabase credentials secure.
// These keys are hardcoded here for development convenience.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        "Supabase URL and Anon Key are required. " +
        "For local development, create a .env.local file with:\n" +
        "VITE_SUPABASE_URL=your_supabase_url\n" +
        "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n" +
        "Get these values from your Supabase project Settings > API"
    );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Add this at the bottom of supabaseClient.ts for a quick test
supabase
  .from('profiles')
  .select('*')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('Supabase test error:', error);
    } else if (data && data.length === 0) {
      console.warn('Supabase test: profiles table is empty or inaccessible (data is empty array)');
    } else {
      console.log('Supabase test data:', data);
    }
  }, (e) => {
    // This is the error handler for the promise
    console.error('Supabase test fatal error:', e);
  });

// Directly test Supabase Auth session retrieval
supabase.auth.getSession().then(
  (result) => console.log("[supabaseClient] getSession result:", result),
  (error) => console.error("[supabaseClient] getSession error:", error)
);