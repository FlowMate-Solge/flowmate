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

export interface PolicyFunds {
  funds: { name: string; desc: string }[]
  note: string
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

export async function uploadSalesCsv(file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE_URL}/api/sales/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`CSV upload failed: ${res.status}`)
  return res.json() as Promise<{ created: number; errors: string[] }>
}
