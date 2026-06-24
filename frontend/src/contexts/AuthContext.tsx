import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  buildBriefing,
  buildForecast,
  computeHealthScore,
  createInitialDemoStore,
  deriveDashboardSummary,
  derivePlatformBreakdown,
  derivePlatforms,
  deriveTaxReserve,
  type DemoStore,
} from '../lib/demoEngine'

type Mode = 'demo' | null

interface DemoApi {
  store: DemoStore
  platforms: ReturnType<typeof derivePlatforms>
  dashboardSummary: ReturnType<typeof deriveDashboardSummary>
  platformBreakdown: ReturnType<typeof derivePlatformBreakdown>
  forecast: ReturnType<typeof buildForecast>
  healthScore: ReturnType<typeof computeHealthScore>
  taxReserve: ReturnType<typeof deriveTaxReserve>
  briefing: ReturnType<typeof buildBriefing>
  connectPlatform: (key: string) => void
  addFixedCost: (item: string, dayOfMonth: number, amount: number) => void
  addSales: (rows: { platformKey: string; grossAmount: number; bookings?: number }[]) => {
    created: number
    errors: string[]
  }
  updateTaxBalance: (currentBalance: number) => void
}

interface AuthState {
  mode: Mode
  enterDemo: () => void
  demo: DemoApi
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // localStorage 미사용 — 새로고침하면 항상 랜딩부터 시작
  const [mode, setMode] = useState<Mode>(null)
  const [store, setStore] = useState<DemoStore>(() => createInitialDemoStore())

  function enterDemo() {
    setMode('demo')
  }

  function connectPlatform(key: string) {
    setStore((prev) => ({
      ...prev,
      platforms: prev.platforms.map((p) => (p.key === key ? { ...p, connected: true } : p)),
    }))
  }

  function addFixedCost(item: string, dayOfMonth: number, amount: number) {
    setStore((prev) => ({
      ...prev,
      fixedCosts: [...prev.fixedCosts, { id: `fc-${Date.now()}`, item, dayOfMonth, amount }],
    }))
  }

  function addSales(rows: { platformKey: string; grossAmount: number; bookings?: number }[]) {
    const errors: string[] = []
    let created = 0
    setStore((prev) => {
      const byKey = new Map(prev.platforms.map((p) => [p.key, p]))
      const deltas = new Map<string, { gross: number; bookings: number }>()
      for (const row of rows) {
        if (!byKey.has(row.platformKey)) {
          errors.push(`unknown platform: ${row.platformKey}`)
          continue
        }
        const acc = deltas.get(row.platformKey) ?? { gross: 0, bookings: 0 }
        acc.gross += row.grossAmount
        acc.bookings += row.bookings ?? 1
        deltas.set(row.platformKey, acc)
        created++
      }
      return {
        ...prev,
        platforms: prev.platforms.map((p) => {
          const d = deltas.get(p.key)
          return d ? { ...p, gross: p.gross + d.gross, bookings: p.bookings + d.bookings } : p
        }),
      }
    })
    return { created, errors }
  }

  function updateTaxBalance(currentBalance: number) {
    setStore((prev) => ({ ...prev, taxReserve: { ...prev.taxReserve, currentBalance } }))
  }

  // store가 바뀔 때마다(연결/고정비/CSV 업로드) 모든 화면용 파생값을 다시 계산
  const demo: DemoApi = useMemo(
    () => ({
      store,
      platforms: derivePlatforms(store),
      dashboardSummary: deriveDashboardSummary(store),
      platformBreakdown: derivePlatformBreakdown(store),
      forecast: buildForecast(store),
      healthScore: computeHealthScore(store),
      taxReserve: deriveTaxReserve(store),
      briefing: buildBriefing(store),
      connectPlatform,
      addFixedCost,
      addSales,
      updateTaxBalance,
    }),
    [store],
  )

  return <AuthContext.Provider value={{ mode, enterDemo, demo }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
