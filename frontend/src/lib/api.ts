const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export interface PlatformSummary {
  id: string
  key: string
  name: string
  color: string
  feeRate: number
  settleCycle: string
  connected: boolean
  occupancy: number
  vacancy: number
  gross: number
  fee: number
  net: number
  bookings: number
  netRate: number
  perBooking: number
}

export interface DashboardSummary {
  totals: { gross: number; fee: number; net: number; bookings: number }
  monthlyTrend: { month: string; gross: number; net: number }[]
}

export interface FixedCost {
  id: string
  item: string
  dayOfMonth: number
  amount: number
  createdAt: string
}

export interface PlatformBreakdown {
  month: string | null
  breakdown: {
    id: string
    key: string
    name: string
    color: string
    feeRate: number
    settleCycle: string
    gross: number
    fee: number
    net: number
    netRate: number
  }[]
}

export interface PlatformStrategy {
  title: string
  body: string
  tone: 'positive' | 'warning' | 'neutral'
}

export interface PriceBenchmark {
  benchmark: {
    low: number
    golden: number
    high: number
    current: number
    weekendMax: number
  }
  headroom: number // 골든 최적가 대비 인상 여유(원)
  bands: { band: string; share: number }[]
  insight: string
}

export interface PolicyFund {
  name: string
  org: string
  desc: string
  target: string
  deadline: string
  url: string
}

export interface PolicyFunds {
  funds: PolicyFund[]
  note: string
  source?: 'live' | 'curated'
}

export function getPlatformStrategy() {
  return request<PlatformStrategy[]>('/api/platform-strategy')
}

export function getPriceBenchmark() {
  return request<PriceBenchmark>('/api/price-benchmark')
}

export function getPolicyFunds() {
  return request<PolicyFunds>('/api/policy-funds')
}

export interface ForecastDay {
  date: string
  label: string
  balance: number // 원
  event?: string
  risk?: boolean
}

export interface Settlement {
  date: string // YYYY-MM-DD
  amount: number // 원
  label: string
}

export interface RiskAlert {
  startLabel: string
  endLabel: string
  lowestLabel: string
  lowestBalance: number // 원
  shortfall: number // 원
  reason: string
  suggestion: string
}

export interface Seasonal {
  trend: 'up' | 'down' | 'flat'
  growthPct: number
  peakMessage: string
  prepMessage: string
}

export interface Forecast {
  baseDate: string
  horizonDays: number
  startBalance: number
  safetyLine: number // 원
  days: ForecastDay[]
  settlements: Settlement[]
  risk: RiskAlert | null
  seasonal: Seasonal
}

export interface RoiInput {
  investment: number
  monthlyFixed: number
  avgMonthlyNet: number
}

export interface RoiResult {
  monthlyProfit: number
  recoverable: boolean
  months: number | null
}

export interface TaxReserve {
  rate: number
  currentBalance: number // 원
  nextFilingDate: string
  filingType: string
  monthlyRevenue: number // 원
  recommended: number // 원
  shortfall: number // 원
}

export interface HealthFactor {
  label: string
  score: number
  note: string
}

export interface HealthScore {
  total: number
  grade: string
  factors: HealthFactor[]
}

export function getForecast() {
  return request<Forecast>('/api/forecast/daily-balance')
}

export function getRoiDefaults() {
  return request<RoiInput>('/api/roi/defaults')
}

export function calculateRoi(data: RoiInput) {
  return request<RoiResult>('/api/roi/calculate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getTaxReserve() {
  return request<TaxReserve>('/api/tax-reserve')
}

export function updateTaxReserve(data: { currentBalance: number; rate?: number }) {
  return request<TaxReserve>('/api/tax-reserve', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getHealthScore() {
  return request<HealthScore>('/api/health-score')
}

export interface Briefing {
  date: string
  expectedBalance: number // 원
  weekSettlement: { platform: string; amount: number; date: string }[]
  upcoming: { label: string; amount: number; date: string; urgent: boolean }[]
  vacancy: string
  cashRisk?: {
    period: string       // "6/25~6/27"
    lowestBalance: number // 원
    reason: string
    suggestion: string
  }
}

export interface AiAnswer {
  configured: boolean
  answer?: string
  error?: string
}

export function getBriefing() {
  return request<Briefing>('/api/briefing/today')
}

export interface Business {
  id: number
  name: string
  type: string
  ownerName: string
  yearsOpen: number
  lastDataAt: string | null
}

export function getBusiness() {
  return request<Business>('/api/business')
}

export function askAi(question: string) {
  return request<AiAnswer>('/api/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
}

export function getPlatforms() {
  return request<PlatformSummary[]>('/api/platforms')
}

export function connectPlatform(key: string) {
  return request<PlatformSummary>(`/api/platforms/${key}/connect`, { method: 'POST' })
}

export function getDashboardSummary() {
  return request<DashboardSummary>('/api/dashboard/summary')
}

export function getPlatformBreakdown(month?: string) {
  const qs = month ? `?month=${month}` : ''
  return request<PlatformBreakdown>(`/api/dashboard/platform-breakdown${qs}`)
}

export function getFixedCosts() {
  return request<FixedCost[]>('/api/fixed-costs')
}

export function addFixedCost(data: { item: string; dayOfMonth: number; amount: number }) {
  return request<FixedCost>('/api/fixed-costs', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function addSale(data: { platformKey: string; date: string; grossAmount: number; bookings?: number }) {
  return request<{ id: string }>('/api/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function uploadSalesCsv(file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE_URL}/api/sales/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`CSV upload failed: ${res.status}`)
  return res.json() as Promise<{ created: number; errors: string[] }>
}
