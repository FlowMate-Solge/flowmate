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

export function getPlatforms() {
  return request<PlatformSummary[]>('/api/platforms')
}

export function getDashboardSummary() {
  return request<DashboardSummary>('/api/dashboard/summary')
}
