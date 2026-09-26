-- Mind-Mesh additive migration v2
-- Apply after supabase_schema.sql. The baseline already creates the ED-03 tables;
-- this migration only upgrades activity outcome snapshots and is safe to rerun.

ALTER TABLE public.activity_outcomes
    ADD COLUMN IF NOT EXISTS before_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS after_snapshot JSONB;

ALTER TABLE public.analysis_snapshots
    ADD COLUMN IF NOT EXISTS activity_id TEXT
    REFERENCES public.activities(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_activity_outcomes_activity
    ON public.activity_outcomes(activity_id);

CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_activity
    ON public.analysis_snapshots(activity_id);
