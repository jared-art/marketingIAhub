-- ========================
-- CLIENT GOALS TABLE
-- Monthly objectives per analysis (one set of goals per analysis period)
-- ========================
CREATE TABLE IF NOT EXISTS public.client_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE UNIQUE,
  leads_goal INTEGER,
  conversion_goal DECIMAL(5,2),   -- percentage (e.g. 5.00 = 5%)
  revenue_goal DECIMAL(12,2),     -- currency amount
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.client_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own goals" ON public.client_goals
  FOR ALL USING (created_by = auth.uid());
