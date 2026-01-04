CREATE TABLE weekly_narrative_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES coaching_engagements(id),
  client_email TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  phase TEXT,
  client_map JSONB NOT NULL,
  coach_map JSONB NOT NULL,
  data_summary JSONB,
  data_from TIMESTAMP,
  data_to TIMESTAMP,
  status TEXT DEFAULT 'draft',
  reviewed_at TIMESTAMP,
  reviewed_by UUID,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_weekly_maps_engagement ON weekly_narrative_maps(engagement_id);
CREATE INDEX idx_weekly_maps_client ON weekly_narrative_maps(client_email);
CREATE INDEX idx_weekly_maps_week ON weekly_narrative_maps(engagement_id, week_number);
CREATE INDEX idx_weekly_maps_status ON weekly_narrative_maps(status);
CREATE UNIQUE INDEX idx_weekly_maps_unique ON weekly_narrative_maps(engagement_id, week_number);

-- Enable RLS
ALTER TABLE weekly_narrative_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage weekly maps" ON weekly_narrative_maps
  FOR ALL USING (true) WITH CHECK (true);