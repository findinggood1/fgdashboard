import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'coach' | 'client' | null;

export interface Coach {
  id: string;
  code: string;
  name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  email: string;
  name: string;
  coach_id: string | null;
  status: string;
  approved_at: string | null;
  approved_by: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tool_type: string;
  expires_at: string | null;
  is_active: boolean;
  max_entries: number | null;
  created_at: string;
}

export interface ZoneInterpretation {
  zone?: string;
  current_zone?: string;
  headline?: string;
  description?: string;
  the_work?: string;
  custom_note?: string;
  source?: string;
  updated_at?: string;
}

export interface Superpower {
  superpower: string;
  description: string;
  evidence: string[];
  fires_element: 'feelings' | 'influence' | 'resilience' | 'ethics' | 'strengths';
  source?: 'AI' | 'Coach' | 'Client';
  created_at?: string;
}

export interface WorldAskingInsight {
  insight: string;
  fires_element: 'feelings' | 'influence' | 'resilience' | 'ethics' | 'strengths';
  source?: 'AI' | 'Coach' | 'Client';
  created_at?: string;
}

export interface WeeklyAction {
  action: string;
  fires_element: 'feelings' | 'influence' | 'resilience' | 'ethics' | 'strengths';
  status: 'active' | 'completed';
  assigned_date?: string;
  source?: 'AI' | 'Coach' | 'Client';
  created_at?: string;
}

export interface CoachingEngagement {
  id: string;
  client_email: string;
  coach_id: string;
  start_date: string;
  end_date: string | null;
  current_phase: string;
  current_week: number;
  status: string;
  story_present: string | null;
  story_past: string | null;
  story_potential: string | null;
  goals: any;
  challenges: any;
  fires_focus: any;
  focus: string | null;
  zone_interpretation: ZoneInterpretation | null;
  superpowers_claimed: Superpower[] | null;
  superpowers_emerging: Superpower[] | null;
  superpowers_hidden: Superpower[] | null;
  world_asking: WorldAskingInsight[] | null;
  weekly_tracking: string | null;
  weekly_creating: string | null;
  weekly_actions: WeeklyAction[] | null;
  ai_insights_generated_at: string | null;
  created_at: string;
}
