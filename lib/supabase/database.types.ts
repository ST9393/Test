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
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          message_count: number
          message_limit: number
          rgpd_consent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          message_count?: number
          message_limit?: number
          rgpd_consent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          message_count?: number
          message_limit?: number
          rgpd_consent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          greeting_message: string
          primary_color: string
          secondary_color: string
          logo_url: string | null
          is_trained: boolean
          training_status: string
          widget_enabled: boolean
          remove_branding: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          greeting_message?: string
          primary_color?: string
          secondary_color?: string
          logo_url?: string | null
          is_trained?: boolean
          training_status?: string
          widget_enabled?: boolean
          remove_branding?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          greeting_message?: string
          primary_color?: string
          secondary_color?: string
          logo_url?: string | null
          is_trained?: boolean
          training_status?: string
          widget_enabled?: boolean
          remove_branding?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          agent_id: string
          name: string
          type: string
          source_url: string | null
          content: string | null
          chunk_count: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          name: string
          type: string
          source_url?: string | null
          content?: string | null
          chunk_count?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          name?: string
          type?: string
          source_url?: string | null
          content?: string | null
          chunk_count?: number
          status?: string
          created_at?: string
        }
      }
      embeddings: {
        Row: {
          id: string
          document_id: string
          agent_id: string
          content: string
          embedding: number[]
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          agent_id: string
          content: string
          embedding: number[]
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          agent_id?: string
          content?: string
          embedding?: number[]
          metadata?: Json | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          agent_id: string
          session_id: string
          visitor_id: string | null
          created_at: string
          ended_at: string | null
          satisfaction_rating: number | null
          handover_requested: boolean
        }
        Insert: {
          id?: string
          agent_id: string
          session_id: string
          visitor_id?: string | null
          created_at?: string
          ended_at?: string | null
          satisfaction_rating?: number | null
          handover_requested?: boolean
        }
        Update: {
          id?: string
          agent_id?: string
          session_id?: string
          visitor_id?: string | null
          created_at?: string
          ended_at?: string | null
          satisfaction_rating?: number | null
          handover_requested?: boolean
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          agent_id: string
          role: string
          content: string
          confidence_score: number | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          agent_id: string
          role: string
          content: string
          confidence_score?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          agent_id?: string
          role?: string
          content?: string
          confidence_score?: number | null
          metadata?: Json | null
          created_at?: string
        }
      }
      ai_actions: {
        Row: {
          id: string
          agent_id: string
          action_type: string
          config: Json
          enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          action_type: string
          config: Json
          enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          action_type?: string
          config?: Json
          enabled?: boolean
          created_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          agent_id: string
          date: string
          conversation_count: number
          message_count: number
          avg_confidence: number | null
          handover_count: number
          avg_satisfaction: number | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          date: string
          conversation_count?: number
          message_count?: number
          avg_confidence?: number | null
          handover_count?: number
          avg_satisfaction?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          date?: string
          conversation_count?: number
          message_count?: number
          avg_confidence?: number | null
          handover_count?: number
          avg_satisfaction?: number | null
          created_at?: string
        }
      }
    }
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[]
          match_agent_id: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          content: string
          similarity: number
          metadata: Json | null
        }[]
      }
    }
  }
}
