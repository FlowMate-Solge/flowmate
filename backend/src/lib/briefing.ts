import type { FixedCost, Platform, Sale, TaxReserve } from '@prisma/client'
import { BASE_DATE, buildForecast } from './forecast.js'

// ─────────────────────────────────────────────────────────────
// 오늘의 운영 브리핑 (Phase 5 / 데이터 집계 — Claude API 불필요)
// 오늘 예상 잔액 / 이번 주 정산 / 임박 세금·고정비 / 공실 위험.
// frontend mock.ts 의 briefing 을 데이터 기반으로 대체한다.
// ─────────────────────────────────────────────────────────────

type PlatformWithSales = Platform & { sales: Sale[] }

const man = (won: number) => Math.round(won / 10_000)
function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
function mmdd(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`
}
function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export interface Briefing {
  date: string
  expectedBalance: number // 오늘 예상 잔액(원)
  weekSettlement: { platform: string; amount: number; date: string }[]
  upcoming: { label: string; amount: number; date: string; urgent: boolean }[]
  vacancy: string
}

// 가장 최근 달 총매출(원) — 세금 권장액 산정용
function currentMonthlyRevenue(platforms: PlatformWithSales[]) {
  const byMonth = new Map<string, number>()
  for (const p of platforms) {
    for (const s of p.sales) {
      const mk = monthKey(s.date)
      byMonth.set(mk, (byMonth.get(mk) ?? 0) + s.grossAmount)
    }
  }
  const latest = Array.from(byMonth.keys()).sort().at(-1)
  return latest ? byMonth.get(latest)! : 0
}

export function buildBriefing(
  platforms: PlatformWithSales[],
  fixedCosts: FixedCost[],
  taxReserve: TaxReserve | null,
): Briefing {
  const forecast = buildForecast(platforms, fixedCosts)
  const today = forecast.days[0]
  const weekEnd = addDays(BASE_DATE, 7)

  // 이번 주(7일 내) 정산 입금
  const weekSettlement = forecast.settlements
    .filter((s) => new Date(s.date) <= weekEnd)
    .map((s) => ({
      platform: s.label.replace(/\s*정산$/, ''),
      amount: s.amount,
      date: mmdd(new Date(s.date)),
    }))

  // 임박 지출: 7일 내 고정비 + 다가오는 세금 신고
  const upcoming: Briefing['upcoming'] = []
  for (const fc of fixedCosts) {
    // 이번 달/다음 달 중 기준일 이후 첫 발생일
    for (const base of [BASE_DATE, addDays(new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() + 1, 1), 0)]) {
      const occ = new Date(base.getFullYear(), base.getMonth(), fc.dayOfMonth)
      if (occ >= BASE_DATE && occ <= weekEnd) {
        upcoming.push({ label: fc.item, amount: fc.amount, date: mmdd(occ), urgent: fc.amount >= 1_000_000 })
        break
      }
    }
  }
  if (taxReserve) {
    const filing = new Date(taxReserve.nextFilingDate)
    const daysLeft = Math.round((filing.getTime() - BASE_DATE.getTime()) / 86_400_000)
    const recommended = Math.round(currentMonthlyRevenue(platforms) * taxReserve.rate)
    upcoming.push({
      label: taxReserve.filingType,
      amount: recommended,
      date: mmdd(filing),
      urgent: daysLeft <= 40,
    })
  }
  upcoming.sort((a, b) => (a.date > b.date ? 1 : -1))

  // 공실 위험: 공실률이 가장 높은 플랫폼
  const worst = platforms.length
    ? platforms.reduce((a, b) => (b.vacancy > a.vacancy ? b : a))
    : null
  const vacancy = worst
    ? `${worst.name} 공실률이 ${worst.vacancy}%로 가장 높습니다. 비어있는 시간대에 할인 노출을 권장합니다.`
    : '공실 데이터가 없습니다.'

  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'long' }).format(BASE_DATE)
  const date = `${BASE_DATE.getFullYear()}년 ${BASE_DATE.getMonth() + 1}월 ${BASE_DATE.getDate()}일 ${weekday}`

  return {
    date,
    expectedBalance: today?.balance ?? 0,
    weekSettlement,
    upcoming,
    vacancy,
  }
}
