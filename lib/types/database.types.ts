export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SessionStatus = 'active' | 'on_break' | 'completed' | 'abandoned'

export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          user_id: string
          default_duration_seconds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          default_duration_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          default_duration_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          id: string
          user_id: string
          label: string | null
          planned_duration_seconds: number
          actual_focus_seconds: number
          status: SessionStatus
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string | null
          planned_duration_seconds: number
          actual_focus_seconds?: number
          status?: SessionStatus
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string | null
          planned_duration_seconds?: number
          actual_focus_seconds?: number
          status?: SessionStatus
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'focus_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      breaks: {
        Row: {
          id: string
          session_id: string
          user_id: string
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'breaks_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'focus_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'breaks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      session_status: SessionStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
