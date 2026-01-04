export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          client_email: string
          coach_id: string | null
          coach_note: string | null
          completed_at: string | null
          completed_verification_id: string | null
          created_at: string | null
          due_date: string | null
          engagement_id: string | null
          id: string
          practice_type: string
          status: string | null
          suggested_context: Json | null
        }
        Insert: {
          client_email: string
          coach_id?: string | null
          coach_note?: string | null
          completed_at?: string | null
          completed_verification_id?: string | null
          created_at?: string | null
          due_date?: string | null
          engagement_id?: string | null
          id?: string
          practice_type: string
          status?: string | null
          suggested_context?: Json | null
        }
        Update: {
          client_email?: string
          coach_id?: string | null
          coach_note?: string | null
          completed_at?: string | null
          completed_verification_id?: string | null
          created_at?: string | null
          due_date?: string | null
          engagement_id?: string | null
          id?: string
          practice_type?: string
          status?: string | null
          suggested_context?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "coaching_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assessments: {
        Row: {
          assessment_date: string
          assessment_name: string | null
          assessment_type: string
          client_email: string
          created_at: string | null
          engagement_id: string | null
          flags: Json | null
          id: string
          is_360: boolean | null
          respondent_name: string | null
          respondent_role: string | null
          responses: Json
          reviewed_at: string | null
          reviewer_notes: string | null
          scores: Json | null
          status: string | null
          summary: string | null
        }
        Insert: {
          assessment_date?: string
          assessment_name?: string | null
          assessment_type: string
          client_email: string
          created_at?: string | null
          engagement_id?: string | null
          flags?: Json | null
          id?: string
          is_360?: boolean | null
          respondent_name?: string | null
          respondent_role?: string | null
          responses: Json
          reviewed_at?: string | null
          reviewer_notes?: string | null
          scores?: Json | null
          status?: string | null
          summary?: string | null
        }
        Update: {
          assessment_date?: string
          assessment_name?: string | null
          assessment_type?: string
          client_email?: string
          created_at?: string | null
          engagement_id?: string | null
          flags?: Json | null
          id?: string
          is_360?: boolean | null
          respondent_name?: string | null
          respondent_role?: string | null
          responses?: Json
          reviewed_at?: string | null
          reviewer_notes?: string | null
          scores?: Json | null
          status?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_assessments_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "coaching_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      client_files: {
        Row: {
          category: string | null
          client_email: string
          created_at: string | null
          description: string | null
          engagement_id: string | null
          extracted_text: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string
          id: string
          mime_type: string | null
          storage_path: string
          storage_url: string | null
          tags: Json | null
          title: string | null
          uploaded_by_coach_id: string | null
          visible_to_client: boolean | null
        }
        Insert: {
          category?: string | null
          client_email: string
          created_at?: string | null
          description?: string | null
          engagement_id?: string | null
          extracted_text?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type: string
          id?: string
          mime_type?: string | null
          storage_path: string
          storage_url?: string | null
          tags?: Json | null
          title?: string | null
          uploaded_by_coach_id?: string | null
          visible_to_client?: boolean | null
        }
        Update: {
          category?: string | null
          client_email?: string
          created_at?: string | null
          description?: string | null
          engagement_id?: string | null
          extracted_text?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          storage_path?: string
          storage_url?: string | null
          tags?: Json | null
          title?: string | null
          uploaded_by_coach_id?: string | null
          visible_to_client?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_files_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "coaching_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_files_uploaded_by_coach_id_fkey"
            columns: ["uploaded_by_coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          coach_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          coach_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          coach_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_clients_coach"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          code: string
          created_at: string | null
          email: string
          id: string
          is_admin: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          id?: string
          is_admin?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean
          name?: string
        }
        Relationships: []
      }
      coaching_engagements: {
        Row: {
          ai_insights_generated_at: string | null
          ai_insights_version: number | null
          anchor_quote: string | null
          challenges: Json | null
          client_email: string
          coach_id: string | null
          created_at: string | null
          current_phase: string | null
          current_week: number | null
          end_date: string | null
          fires_focus: Json | null
          focus: string | null
          goals: Json | null
          id: string
          notes: string | null
          primary_arena: string | null
          start_date: string
          status: string
          story_past: string | null
          story_potential: string | null
          story_present: string | null
          superpowers_claimed: Json | null
          superpowers_emerging: Json | null
          superpowers_hidden: Json | null
          updated_at: string | null
          weekly_actions: Json | null
          weekly_creating: string | null
          weekly_tracking: string | null
          world_asking: Json | null
          zone_interpretation: Json | null
        }
        Insert: {
          ai_insights_generated_at?: string | null
          ai_insights_version?: number | null
          anchor_quote?: string | null
          challenges?: Json | null
          client_email: string
          coach_id?: string | null
          created_at?: string | null
          current_phase?: string | null
          current_week?: number | null
          end_date?: string | null
          fires_focus?: Json | null
          focus?: string | null
          goals?: Json | null
          id?: string
          notes?: string | null
          primary_arena?: string | null
          start_date: string
          status?: string
          story_past?: string | null
          story_potential?: string | null
          story_present?: string | null
          superpowers_claimed?: Json | null
          superpowers_emerging?: Json | null
          superpowers_hidden?: Json | null
          updated_at?: string | null
          weekly_actions?: Json | null
          weekly_creating?: string | null
          weekly_tracking?: string | null
          world_asking?: Json | null
          zone_interpretation?: Json | null
        }
        Update: {
          ai_insights_generated_at?: string | null
          ai_insights_version?: number | null
          anchor_quote?: string | null
          challenges?: Json | null
          client_email?: string
          coach_id?: string | null
          created_at?: string | null
          current_phase?: string | null
          current_week?: number | null
          end_date?: string | null
          fires_focus?: Json | null
          focus?: string | null
          goals?: Json | null
          id?: string
          notes?: string | null
          primary_arena?: string | null
          start_date?: string
          status?: string
          story_past?: string | null
          story_potential?: string | null
          story_present?: string | null
          superpowers_claimed?: Json | null
          superpowers_emerging?: Json | null
          superpowers_hidden?: Json | null
          updated_at?: string | null
          weekly_actions?: Json | null
          weekly_creating?: string | null
          weekly_tracking?: string | null
          world_asking?: Json | null
          zone_interpretation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_engagements_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_notes: {
        Row: {
          client_email: string
          coach_curiosity: string | null
          coach_id: string | null
          coach_next: string | null
          coach_trap: string | null
          content: string | null
          created_at: string | null
          engagement_id: string | null
          id: string
          note_date: string | null
          related_session_id: string | null
          related_snapshot_id: string | null
          related_verification_id: string | null
          session_type: string | null
        }
        Insert: {
          client_email: string
          coach_curiosity?: string | null
          coach_id?: string | null
          coach_next?: string | null
          coach_trap?: string | null
          content?: string | null
          created_at?: string | null
          engagement_id?: string | null
          id?: string
          note_date?: string | null
          related_session_id?: string | null
          related_snapshot_id?: string | null
          related_verification_id?: string | null
          session_type?: string | null
        }
        Update: {
          client_email?: string
          coach_curiosity?: string | null
          coach_id?: string | null
          coach_next?: string | null
          coach_trap?: string | null
          content?: string | null
          created_at?: string | null
          engagement_id?: string | null
          id?: string
          note_date?: string | null
          related_session_id?: string | null
          related_snapshot_id?: string | null
          related_verification_id?: string | null
          session_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_notes_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "coaching_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_notes_related_session_id_fkey"
            columns: ["related_session_id"]
            isOneToOne: false
            referencedRelation: "session_transcripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_notes_related_snapshot_id_fkey"
            columns: ["related_snapshot_id"]
            isOneToOne: false
            referencedRelation: "snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_notes_related_verification_id_fkey"
            columns: ["related_verification_id"]
            isOneToOne: false
            referencedRelation: "impact_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          code: string
          created_at: string | null
          default_fires: Json | null
          default_intensity: string | null
          default_timeframe: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_entries: number | null
          name: string
          tool_type: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          default_fires?: Json | null
          default_intensity?: string | null
          default_timeframe?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_entries?: number | null
          name: string
          tool_type?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          default_fires?: Json | null
          default_intensity?: string | null
          default_timeframe?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_entries?: number | null
          name?: string
          tool_type?: string | null
        }
        Relationships: []
      }
      impact_verifications: {
        Row: {
          alignment: Json | null
          clarity_signal: string | null
          client_email: string
          confidence_signal: string | null
          created_at: string | null
          event_code: string | null
          evidence: Json | null
          fires_focus: Json | null
          id: string
          impact_card: Json | null
          integrity_line: string | null
          intensity: string | null
          interpretation: string | null
          ownership_signal: string | null
          recipient_completed_at: string | null
          recipient_email: string | null
          recipient_responses: Json | null
          recipient_skipped: boolean | null
          responses: Json | null
          sender_notified_at: string | null
          share_id: string | null
          shared_at: string | null
          status: string | null
          target_email: string | null
          target_name: string | null
          target_relationship: string | null
          timeframe: string | null
          type: string
        }
        Insert: {
          alignment?: Json | null
          clarity_signal?: string | null
          client_email: string
          confidence_signal?: string | null
          created_at?: string | null
          event_code?: string | null
          evidence?: Json | null
          fires_focus?: Json | null
          id?: string
          impact_card?: Json | null
          integrity_line?: string | null
          intensity?: string | null
          interpretation?: string | null
          ownership_signal?: string | null
          recipient_completed_at?: string | null
          recipient_email?: string | null
          recipient_responses?: Json | null
          recipient_skipped?: boolean | null
          responses?: Json | null
          sender_notified_at?: string | null
          share_id?: string | null
          shared_at?: string | null
          status?: string | null
          target_email?: string | null
          target_name?: string | null
          target_relationship?: string | null
          timeframe?: string | null
          type: string
        }
        Update: {
          alignment?: Json | null
          clarity_signal?: string | null
          client_email?: string
          confidence_signal?: string | null
          created_at?: string | null
          event_code?: string | null
          evidence?: Json | null
          fires_focus?: Json | null
          id?: string
          impact_card?: Json | null
          integrity_line?: string | null
          intensity?: string | null
          interpretation?: string | null
          ownership_signal?: string | null
          recipient_completed_at?: string | null
          recipient_email?: string | null
          recipient_responses?: Json | null
          recipient_skipped?: boolean | null
          responses?: Json | null
          sender_notified_at?: string | null
          share_id?: string | null
          shared_at?: string | null
          status?: string | null
          target_email?: string | null
          target_name?: string | null
          target_relationship?: string | null
          timeframe?: string | null
          type?: string
        }
        Relationships: []
      }
      integrity_primer_responses: {
        Row: {
          clarity_score: number | null
          client_email: string
          confidence_score: number | null
          created_at: string | null
          engagement_id: string | null
          id: string
          influence_score: number | null
          phase_week: number | null
          primer_type: string
          responses: Json | null
        }
        Insert: {
          clarity_score?: number | null
          client_email: string
          confidence_score?: number | null
          created_at?: string | null
          engagement_id?: string | null
          id?: string
          influence_score?: number | null
          phase_week?: number | null
          primer_type: string
          responses?: Json | null
        }
        Update: {
          clarity_score?: number | null
          client_email?: string
          confidence_score?: number | null
          created_at?: string | null
          engagement_id?: string | null
          id?: string
          influence_score?: number | null
          phase_week?: number | null
          primer_type?: string
          responses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "integrity_primer_responses_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "coaching_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      more_less_markers: {
        Row: {
          baseline_score: number | null
          client_email: string
          created_at: string | null
          current_score: number | null
          engagement_id: string | null
          exchange_insight: string | null
          fires_connection: string | null
          id: string
          is_active: boolean
          marker_text: string
          marker_type: string
          paired_marker_id: string | null
          retired_at: string | null
          target_score: number | null
        }
        Insert: {
          baseline_score?: number | null
          client_email: string
          created_at?: string | null
          current_score?: number | null
          engagement_id?: string | null
          exchange_insight?: string | null
          fires_connection?: string | null
          id?: string
          is_active?: boolean
          marker_text: string
          marker_type: string
          paired_marker_id?: string | null
          retired_at?: string | null
          target_score?: number | null
        }
        Update: {
          baseline_score?: number | null
          client_email?: string
          created_at?: string | null
          current_score?: number | null
          engagement_id?: string | null
          exchange_insight?: string | null
          fires_connection?: string | null
          id?: string
          is_active?: boolean
          marker_text?: string
          marker_type?: string
          paired_marker_id?: string | null
          retired_at?: string | null
          target_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "more_less_markers_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "coaching_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "more_less_markers_paired_marker_id_fkey"
            columns: ["paired_marker_id"]
            isOneToOne: false
            referencedRelation: "more_less_markers"
            referencedColumns: ["id"]
          },
        ]
      }
      more_less_updates: {
        Row: {
          created_at: string | null
          exchange_marker_id: string | null
          exchange_note: string | null
          id: string
          marker_id: string
          note: string | null
          score: number
          source: string | null
          source_id: string | null
          update_date: string
        }
        Insert: {
          created_at?: string | null
          exchange_marker_id?: string | null
          exchange_note?: string | null
          id?: string
          marker_id: string
          note?: string | null
          score: number
          source?: string | null
          source_id?: string | null
          update_date?: string
        }
        Update: {
          created_at?: string | null
          exchange_marker_id?: string | null
          exchange_note?: string | null
          id?: string
          marker_id?: string
          note?: string | null
          score?: number
          source?: string | null
          source_id?: string | null
          update_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "more_less_updates_exchange_marker_id_fkey"
            columns: ["exchange_marker_id"]
            isOneToOne: false
            referencedRelation: "more_less_markers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "more_less_updates_marker_id_fkey"
            columns: ["marker_id"]
            isOneToOne: false
            referencedRelation: "more_less_markers"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_map_history: {
        Row: {
          changed_at: string | null
          changed_by: string
          engagement_id: string | null
          field_name: string
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          engagement_id?: string | null
          field_name: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          engagement_id?: string | null
          field_name?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "narrative_map_history_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "coaching_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          action_text: string | null
          checked_at: string | null
          client_email: string
          created_at: string | null
          engagement_id: string | null
          id: string
          learning: string | null
          outcome: string | null
          prediction_text: string
          status: string | null
          validation_id: string | null
          week_of: string | null
        }
        Insert: {
          action_text?: string | null
          checked_at?: string | null
          client_email: string
          created_at?: string | null
          engagement_id?: string | null
          id?: string
          learning?: string | null
          outcome?: string | null
          prediction_text: string
          status?: string | null
          validation_id?: string | null
          week_of?: string | null
        }
        Update: {
          action_text?: string | null
          checked_at?: string | null
          client_email?: string
          created_at?: string | null
          engagement_id?: string | null
          id?: string
          learning?: string | null
          outcome?: string | null
          prediction_text?: string
          status?: string | null
          validation_id?: string | null
          week_of?: string | null
        }
        Relationships: []
      }
      scheduled_sessions: {
        Row: {
          client_email: string
          coach_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          session_date: string
          session_type: string | null
          status: string | null
        }
        Insert: {
          client_email: string
          coach_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          session_date: string
          session_type?: string | null
          status?: string | null
        }
        Update: {
          client_email?: string
          coach_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          session_date?: string
          session_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      session_transcripts: {
        Row: {
          action_items: Json | null
          client_breakthroughs: string | null
          client_email: string
          coach_id: string | null
          coach_observations: string | null
          created_at: string | null
          duration_minutes: number | null
          engagement_id: string | null
          id: string
          is_processed: boolean | null
          key_quotes: Json | null
          key_themes: Json | null
          next_session_focus: string | null
          processed_at: string | null
          session_date: string
          session_number: number | null
          session_type: string | null
          source: string | null
          source_url: string | null
          summary: string | null
          transcript_text: string | null
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          client_breakthroughs?: string | null
          client_email: string
          coach_id?: string | null
          coach_observations?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          engagement_id?: string | null
          id?: string
          is_processed?: boolean | null
          key_quotes?: Json | null
          key_themes?: Json | null
          next_session_focus?: string | null
          processed_at?: string | null
          session_date: string
          session_number?: number | null
          session_type?: string | null
          source?: string | null
          source_url?: string | null
          summary?: string | null
          transcript_text?: string | null
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          client_breakthroughs?: string | null
          client_email?: string
          coach_id?: string | null
          coach_observations?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          engagement_id?: string | null
          id?: string
          is_processed?: boolean | null
          key_quotes?: Json | null
          key_themes?: Json | null
          next_session_focus?: string | null
          processed_at?: string | null
          session_date?: string
          session_number?: number | null
          session_type?: string | null
          source?: string | null
          source_url?: string | null
          summary?: string | null
          transcript_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_transcripts_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_transcripts_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "coaching_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshots: {
        Row: {
          alignment_scores: Json | null
          client_email: string
          confidence_scores: Json | null
          created_at: string | null
          edge_cases: Json | null
          event_code: string | null
          focus: string | null
          forty_eight_hour_question: string | null
          fs_answers: Json | null
          future_support: string | null
          goal: string | null
          growth_opportunity_category: string | null
          growth_opportunity_zone: string | null
          id: string
          narrative: Json | null
          overall_zone: string | null
          owning_highlight_category: string | null
          owning_highlight_is_fallback: boolean | null
          owning_highlight_zone: string | null
          past_support: string | null
          pdf_url: string | null
          ps_answers: Json | null
          success: string | null
          total_alignment: number | null
          total_confidence: number | null
          zone_breakdown: Json | null
        }
        Insert: {
          alignment_scores?: Json | null
          client_email: string
          confidence_scores?: Json | null
          created_at?: string | null
          edge_cases?: Json | null
          event_code?: string | null
          focus?: string | null
          forty_eight_hour_question?: string | null
          fs_answers?: Json | null
          future_support?: string | null
          goal?: string | null
          growth_opportunity_category?: string | null
          growth_opportunity_zone?: string | null
          id?: string
          narrative?: Json | null
          overall_zone?: string | null
          owning_highlight_category?: string | null
          owning_highlight_is_fallback?: boolean | null
          owning_highlight_zone?: string | null
          past_support?: string | null
          pdf_url?: string | null
          ps_answers?: Json | null
          success?: string | null
          total_alignment?: number | null
          total_confidence?: number | null
          zone_breakdown?: Json | null
        }
        Update: {
          alignment_scores?: Json | null
          client_email?: string
          confidence_scores?: Json | null
          created_at?: string | null
          edge_cases?: Json | null
          event_code?: string | null
          focus?: string | null
          forty_eight_hour_question?: string | null
          fs_answers?: Json | null
          future_support?: string | null
          goal?: string | null
          growth_opportunity_category?: string | null
          growth_opportunity_zone?: string | null
          id?: string
          narrative?: Json | null
          overall_zone?: string | null
          owning_highlight_category?: string | null
          owning_highlight_is_fallback?: boolean | null
          owning_highlight_zone?: string | null
          past_support?: string | null
          pdf_url?: string | null
          ps_answers?: Json | null
          success?: string | null
          total_alignment?: number | null
          total_confidence?: number | null
          zone_breakdown?: Json | null
        }
        Relationships: []
      }
      validation_invitations: {
        Row: {
          completed_at: string | null
          conversation_starter: string | null
          created_at: string | null
          entry_type: string
          expires_at: string | null
          fires_insight: string | null
          id: string
          learning_prompt: string | null
          recipient_email: string
          recipient_intensity: string | null
          recipient_name: string
          recipient_q0: string | null
          recipient_q1: string | null
          recipient_q2: string | null
          recipient_q3: string | null
          recipient_q4: string | null
          recipient_relationship: string | null
          sender_email: string
          sender_name: string | null
          share_id: string
          status: string | null
          transferable_method: string | null
          viewed_at: string | null
          what_sender_noticed: string
          why_learn: string | null
        }
        Insert: {
          completed_at?: string | null
          conversation_starter?: string | null
          created_at?: string | null
          entry_type: string
          expires_at?: string | null
          fires_insight?: string | null
          id?: string
          learning_prompt?: string | null
          recipient_email: string
          recipient_intensity?: string | null
          recipient_name: string
          recipient_q0?: string | null
          recipient_q1?: string | null
          recipient_q2?: string | null
          recipient_q3?: string | null
          recipient_q4?: string | null
          recipient_relationship?: string | null
          sender_email: string
          sender_name?: string | null
          share_id: string
          status?: string | null
          transferable_method?: string | null
          viewed_at?: string | null
          what_sender_noticed: string
          why_learn?: string | null
        }
        Update: {
          completed_at?: string | null
          conversation_starter?: string | null
          created_at?: string | null
          entry_type?: string
          expires_at?: string | null
          fires_insight?: string | null
          id?: string
          learning_prompt?: string | null
          recipient_email?: string
          recipient_intensity?: string | null
          recipient_name?: string
          recipient_q0?: string | null
          recipient_q1?: string | null
          recipient_q2?: string | null
          recipient_q3?: string | null
          recipient_q4?: string | null
          recipient_relationship?: string | null
          sender_email?: string
          sender_name?: string | null
          share_id?: string
          status?: string | null
          transferable_method?: string | null
          viewed_at?: string | null
          what_sender_noticed?: string
          why_learn?: string | null
        }
        Relationships: []
      }
      validations: {
        Row: {
          client_email: string
          created_at: string | null
          engagement_id: string | null
          entry_type: string
          fires_elements: Json | null
          fires_insight: string | null
          id: string
          intensity: string
          method_clarity_level: string | null
          method_clarity_reflection: string | null
          pattern_for_client: string | null
          pattern_for_coach: string | null
          q0_response: string | null
          q1_response: string | null
          q2_response: string | null
          q3_response: string | null
          q4_response: string | null
          source_impact_id: string | null
          source_invitation_id: string | null
          transferable_method: string | null
        }
        Insert: {
          client_email: string
          created_at?: string | null
          engagement_id?: string | null
          entry_type: string
          fires_elements?: Json | null
          fires_insight?: string | null
          id?: string
          intensity: string
          method_clarity_level?: string | null
          method_clarity_reflection?: string | null
          pattern_for_client?: string | null
          pattern_for_coach?: string | null
          q0_response?: string | null
          q1_response?: string | null
          q2_response?: string | null
          q3_response?: string | null
          q4_response?: string | null
          source_impact_id?: string | null
          source_invitation_id?: string | null
          transferable_method?: string | null
        }
        Update: {
          client_email?: string
          created_at?: string | null
          engagement_id?: string | null
          entry_type?: string
          fires_elements?: Json | null
          fires_insight?: string | null
          id?: string
          intensity?: string
          method_clarity_level?: string | null
          method_clarity_reflection?: string | null
          pattern_for_client?: string | null
          pattern_for_coach?: string | null
          q0_response?: string | null
          q1_response?: string | null
          q2_response?: string | null
          q3_response?: string | null
          q4_response?: string | null
          source_impact_id?: string | null
          source_invitation_id?: string | null
          transferable_method?: string | null
        }
        Relationships: []
      }
      voice_memos: {
        Row: {
          audio_storage_path: string
          audio_url: string | null
          client_email: string
          coach_id: string | null
          context: string | null
          created_at: string | null
          created_by: string
          duration_seconds: number | null
          engagement_id: string | null
          id: string
          is_private: boolean | null
          is_transcribed: boolean | null
          recorded_at: string | null
          related_session_id: string | null
          tags: Json | null
          title: string | null
          transcribed_at: string | null
          transcription: string | null
        }
        Insert: {
          audio_storage_path: string
          audio_url?: string | null
          client_email: string
          coach_id?: string | null
          context?: string | null
          created_at?: string | null
          created_by: string
          duration_seconds?: number | null
          engagement_id?: string | null
          id?: string
          is_private?: boolean | null
          is_transcribed?: boolean | null
          recorded_at?: string | null
          related_session_id?: string | null
          tags?: Json | null
          title?: string | null
          transcribed_at?: string | null
          transcription?: string | null
        }
        Update: {
          audio_storage_path?: string
          audio_url?: string | null
          client_email?: string
          coach_id?: string | null
          context?: string | null
          created_at?: string | null
          created_by?: string
          duration_seconds?: number | null
          engagement_id?: string | null
          id?: string
          is_private?: boolean | null
          is_transcribed?: boolean | null
          recorded_at?: string | null
          related_session_id?: string | null
          tags?: Json | null
          title?: string | null
          transcribed_at?: string | null
          transcription?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_memos_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_memos_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "coaching_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_memos_related_session_id_fkey"
            columns: ["related_session_id"]
            isOneToOne: false
            referencedRelation: "session_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_narrative_maps: {
        Row: {
          client_email: string
          client_map: Json
          coach_map: Json
          created_at: string | null
          data_from: string | null
          data_summary: Json | null
          data_to: string | null
          engagement_id: string | null
          id: string
          phase: string | null
          published_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          week_number: number
        }
        Insert: {
          client_email: string
          client_map: Json
          coach_map: Json
          created_at?: string | null
          data_from?: string | null
          data_summary?: Json | null
          data_to?: string | null
          engagement_id?: string | null
          id?: string
          phase?: string | null
          published_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          week_number: number
        }
        Update: {
          client_email?: string
          client_map?: Json
          coach_map?: Json
          created_at?: string | null
          data_from?: string | null
          data_summary?: Json | null
          data_to?: string | null
          engagement_id?: string | null
          id?: string
          phase?: string | null
          published_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_narrative_maps_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "coaching_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_pulse_responses: {
        Row: {
          clarity_score: number | null
          clarity_variant: string | null
          client_email: string
          confidence_score: number | null
          confidence_variant: string | null
          created_at: string | null
          engagement_id: string | null
          id: string
          influence_score: number | null
          influence_variant: string | null
          rotation_week: number | null
          validation_id: string | null
        }
        Insert: {
          clarity_score?: number | null
          clarity_variant?: string | null
          client_email: string
          confidence_score?: number | null
          confidence_variant?: string | null
          created_at?: string | null
          engagement_id?: string | null
          id?: string
          influence_score?: number | null
          influence_variant?: string | null
          rotation_week?: number | null
          validation_id?: string | null
        }
        Update: {
          clarity_score?: number | null
          clarity_variant?: string | null
          client_email?: string
          confidence_score?: number | null
          confidence_variant?: string | null
          created_at?: string | null
          engagement_id?: string | null
          id?: string
          influence_score?: number | null
          influence_variant?: string | null
          rotation_week?: number | null
          validation_id?: string | null
        }
        Relationships: []
      }
      zone_defaults: {
        Row: {
          created_at: string | null
          description: string
          headline: string
          id: string
          the_work: string
          zone_name: string
        }
        Insert: {
          created_at?: string | null
          description: string
          headline: string
          id?: string
          the_work: string
          zone_name: string
        }
        Update: {
          created_at?: string | null
          description?: string
          headline?: string
          id?: string
          the_work?: string
          zone_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
