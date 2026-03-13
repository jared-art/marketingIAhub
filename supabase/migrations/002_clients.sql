-- ========================
-- CLIENTS TABLE
-- ========================
-- Tags existing analyses as agency clients for future global dashboard
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE UNIQUE,
  client_name TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own clients" ON public.clients
  FOR ALL USING (created_by = auth.uid());
