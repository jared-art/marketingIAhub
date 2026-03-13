-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================
-- ALLOWED USERS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.allowed_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  auth_user_id UUID REFERENCES auth.users(id) UNIQUE
);

ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

-- Admins can see all users; analysts can see themselves
CREATE POLICY "Admins can manage all users" ON public.allowed_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.allowed_users au
      WHERE au.auth_user_id = auth.uid() AND au.role = 'admin'
    )
  );

CREATE POLICY "Users can see themselves" ON public.allowed_users
  FOR SELECT USING (auth_user_id = auth.uid());

-- ========================
-- ANALYSES TABLE
-- ========================
CREATE TYPE analysis_status AS ENUM ('pending', 'running', 'completed', 'error');

CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status analysis_status DEFAULT 'pending',
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own analyses" ON public.analyses
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Admins can see all analyses" ON public.analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.allowed_users au
      WHERE au.auth_user_id = auth.uid() AND au.role = 'admin'
    )
  );

-- ========================
-- ANALYSIS CONNECTIONS TABLE
-- ========================
CREATE TYPE platform_type AS ENUM ('meta', 'google_ads', 'hubspot');
CREATE TYPE connection_status AS ENUM ('pending', 'connected', 'error');

CREATE TABLE IF NOT EXISTS public.analysis_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}',
  selected_account_id TEXT,
  selected_account_name TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  status connection_status DEFAULT 'pending'
);

ALTER TABLE public.analysis_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their connections" ON public.analysis_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.analyses a
      WHERE a.id = analysis_id AND a.created_by = auth.uid()
    )
  );

-- ========================
-- ANALYSIS RESULTS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.analysis_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  data_type TEXT NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their results" ON public.analysis_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.analyses a
      WHERE a.id = analysis_id AND a.created_by = auth.uid()
    )
  );

-- ========================
-- ANALYSIS INSIGHTS TABLE
-- ========================
CREATE TYPE insight_type AS ENUM ('problem', 'opportunity', 'recommendation');
CREATE TYPE insight_severity AS ENUM ('critical', 'warning', 'info');

CREATE TABLE IF NOT EXISTS public.analysis_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  type insight_type NOT NULL,
  severity insight_severity NOT NULL,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metric_value TEXT,
  metric_benchmark TEXT,
  action_recommended TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.analysis_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their insights" ON public.analysis_insights
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.analyses a
      WHERE a.id = analysis_id AND a.created_by = auth.uid()
    )
  );

-- ========================
-- HELPER FUNCTION
-- ========================
CREATE OR REPLACE FUNCTION public.is_user_allowed(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.allowed_users
    WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
