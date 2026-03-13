// ========================
// CORE ENTITIES
// ========================

export interface AllowedUser {
  id: string
  email: string
  role: 'admin' | 'analyst'
  invited_at: string
  activated_at: string | null
  invited_by: string | null
  auth_user_id: string | null
}

export interface Analysis {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
  status: 'pending' | 'running' | 'completed' | 'error'
  date_range_start: string
  date_range_end: string
}

export interface AnalysisConnection {
  id: string
  analysis_id: string
  platform: 'meta' | 'google_ads' | 'hubspot'
  credentials: Record<string, string>
  selected_account_id: string | null
  selected_account_name: string | null
  connected_at: string
  status: 'pending' | 'connected' | 'error'
}

export interface AnalysisResult {
  id: string
  analysis_id: string
  platform: string
  data_type: string
  raw_data: Record<string, unknown>
  computed_at: string
}

export interface AnalysisInsight {
  id: string
  analysis_id: string
  type: 'problem' | 'opportunity' | 'recommendation'
  severity: 'critical' | 'warning' | 'info'
  platform: string
  title: string
  description: string
  metric_value: string | null
  metric_benchmark: string | null
  action_recommended: string | null
  created_at: string
}

// ========================
// PLATFORM ACCOUNT TYPES
// ========================

export interface MetaAccount {
  id: string
  name: string
  currency: string
  timezone_name: string
  account_id: string
}

export interface GoogleAccount {
  id: string
  name: string
  loginCustomerId: string
}

export interface HubSpotPortal {
  portalId: number
  timeZone: string
  companyCurrency: string
  companyName: string
}

// ========================
// WIZARD TYPES
// ========================

export interface WizardStep1Data {
  name: string
  description: string
  dateRangeStart: string
  dateRangeEnd: string
}

export interface WizardStep2PlatformData {
  meta?: {
    accessToken: string
    accountId: string
    accountName: string
  }
  google?: {
    developerToken: string
    clientId: string
    clientSecret: string
    refreshToken: string
    managerAccountId?: string
    customerId: string
    customerName: string
  }
  hubspot?: {
    token: string
    portalId: string
    portalName: string
  }
}

export interface WizardData {
  step1: WizardStep1Data
  step2: WizardStep2PlatformData
}

// ========================
// ANALYSIS SUMMARY TYPE
// ========================

export interface InsightCounts {
  total: number
  critical: number
  warning: number
  info: number
  problems: number
  opportunities: number
  recommendations: number
}

export interface KeyMetrics {
  totalSpend: number
  totalRevenue: number
  combinedROAS: number
  totalLeads: number
  costPerLead: number
  conversionRate: number
}

export interface AnalysisSummary extends Analysis {
  connections: AnalysisConnection[]
  insightCounts: InsightCounts
  keyMetrics: KeyMetrics
}

// ========================
// PLATFORM SUMMARY TYPES
// ========================

export interface MetaSummary {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpa: number
  roas: number
}

export interface GoogleSummary {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpa: number
  roas: number
}

export interface HubSpotSummary {
  totalLeads: number
  totalDeals: number
  closedDeals: number
  totalRevenue: number
  totalPipeline: number
  conversionRate: number
  avgDealValue: number
}
