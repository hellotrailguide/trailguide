export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          github_username: string | null
          github_access_token: string | null
          created_at: string
        }
        Insert: {
          id: string
          github_username?: string | null
          github_access_token?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          github_username?: string | null
          github_access_token?: string | null
          created_at?: string
        }
      }
      repos: {
        Row: {
          id: string
          user_id: string
          github_repo_id: number
          repo_name: string
          repo_owner: string
          installation_id: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          github_repo_id: number
          repo_name: string
          repo_owner: string
          installation_id?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          github_repo_id?: number
          repo_name?: string
          repo_owner?: string
          installation_id?: number | null
          created_at?: string
        }
      }
      trails: {
        Row: {
          id: string
          repo_id: string
          path: string
          content: Json
          sha: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          repo_id: string
          path: string
          content: Json
          sha?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          repo_id?: string
          path?: string
          content?: Json
          sha?: string | null
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          status: string
          current_period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          status: string
          current_period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          status?: string
          current_period_end?: string
          created_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          trail_id: string
          user_id: string
          event_type: string
          step_id: string | null
          step_index: number | null
          session_id: string
          created_at: string
        }
        Insert: {
          id?: string
          trail_id: string
          user_id: string
          event_type: string
          step_id?: string | null
          step_index?: number | null
          session_id: string
          created_at?: string
        }
        Update: {
          id?: string
          trail_id?: string
          user_id?: string
          event_type?: string
          step_id?: string | null
          step_index?: number | null
          session_id?: string
          created_at?: string
        }
      }
    }
  }
}
