import type { FixedCost, Platform, Sale } from '@prisma/client'

// ─────────────────────────────────────────────────────────────
// 룰 기반 현금흐름 예측 엔진 (Phase 3 / MVP)
// 시작 잔액 + 고정비 일정 + 플랫폼 정산일을 결합해 향후 30일 일별 잔액을 계산.
// frontend/src/data/mock.ts 의 dailyForecast 를 데이터 기반으로 대체한다.
// ─────────────────────────────────────────────────────────────

// 데모 페르소나 기준 상수 (운영 시 설정값으로 분리 가능)
export const BASE_DATE = new Date('2026-06-19') // 기준일(오늘)
export const STARTING_BALANCE = 3_120_000 // 시작 운영자금(원) — 312만
export const HORIZON_DAYS = 30 // 예측 기간(일)
export const SAFETY_LINE = 500_000 // 안전 잔액선(원) — 50만

type PlatformWithSales = Platform & { sales: Sale[] }

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function shortLabel(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`
}
const man = (won: number) => Math.round(won / 10_000)

export interface LedgerEvent {
  date: string // YYYY-MM-DD
  amount: number // 원 (+입금 / -출금)
  label: string
}

export interface DayBalance {
  date: string // MM-DD (YYYY-MM-DD 의 뒤 5자리)
  label: string // 차트 X축 라벨 (오늘 / 6/25 ...)
  balance: number // 예상 잔액(원)
  event?: string // 당일 주요 입출금 요약
  risk?: boolean // 안전선 미만 여부
}

// 플랫폼의 가장 최근 매출월 순익 (= 정산 예정 금액의 근거)
function latestMonthNet(p: PlatformWithSales) {
  const month = p.sales.reduce<string | null>((acc, s) => {
    const mk = monthKey(s.date)
    return !acc || mk > acc ? mk : acc
  }, null)
  const gross = p.sales
    .filter((s) => monthKey(s.date) === month)
    .reduce((sum, s) => sum + s.grossAmount, 0)
  const fee = Math.round(gross * p.feeRate)
  return { month, net: gross - fee }
}

// settleCycle 문자열을 해석해 예측 기간 내 정산 입금 이벤트를 만든다.
//  - "익월 N일"   → 다음 달 N일에 지난달 순익 전액 정산
//  - "결제 후 N일" → 근실시간 정산. 기준일+N일에 직전 N일치(월 순익÷30×N)만 in-transit 입금
function settlementEvents(p: PlatformWithSales, horizonEnd: Date): LedgerEvent[] {
  const { month, net } = latestMonthNet(p)
  if (!month || net <= 0) return []

  const monthly = p.settleCycle.match(/익월\s*(\d+)\s*일/)
  if (monthly) {
    const day = Number(monthly[1])
    const [y, m] = month.split('-').map(Number)
    const settleDate = new Date(y, m, day) // m(1-base 지난달) → 0-base 다음달
    if (settleDate >= BASE_DATE && settleDate <= horizonEnd) {
      return [{ date: ymd(settleDate), amount: net, label: `${p.name} 정산` }]
    }
    return []
  }

  const fast = p.settleCycle.match(/결제\s*후\s*(\d+)\s*일/)
  if (fast) {
    const n = Number(fast[1])
    const settleDate = addDays(BASE_DATE, n)
    const amount = Math.round((net / 30) * n)
    if (amount > 0 && settleDate <= horizonEnd) {
      return [{ date: ymd(settleDate), amount, label: `${p.name} 정산` }]
    }
  }
  return []
}

export interface Forecast {
  baseDate: string
  horizonDays: number
  startBalance: number
  safetyLine: number
  days: DayBalance[]
  settlements: LedgerEvent[]
  risk: RiskAlert | null
}

export interface RiskAlert {
  startLabel: string
  endLabel: string
  lowestLabel: string
  lowestBalance: number
  shortfall: number // 안전선까지 부족액(원)
  reason: string
  suggestion: string
}

// 일별 잔액 시계열 + 정산/고정비 이벤트를 계산
export function buildForecast(platforms: PlatformWithSales[], fixedCosts: FixedCost[]): Forecast {
  const horizonEnd = addDays(BASE_DATE, HORIZON_DAYS)

  const settlements = platforms.flatMap((p) => settlementEvents(p, horizonEnd))
  const byDate = new Map<string, LedgerEvent[]>()
  for (const e of settlements) {
    const arr = byDate.get(e.date) ?? []
    arr.push(e)
    byDate.set(e.date, arr)
  }

  const days: DayBalance[] = []
  let balance = STARTING_BALANCE

  for (let i = 0; i <= HORIZON_DAYS; i++) {
    const d = addDays(BASE_DATE, i)
    const iso = ymd(d)
    const events = [...(byDate.get(iso) ?? [])]
    for (const fc of fixedCosts) {
      if (fc.dayOfMonth === d.getDate()) {
        events.push({ date: iso, amount: -fc.amount, label: fc.item })
      }
    }
    balance += events.reduce((s, e) => s + e.amount, 0)

    const eventText = events
      .map((e) => `${e.label} ${e.amount > 0 ? '+' : '-'}${Math.abs(man(e.amount))}`)
      .join(' · ')

    days.push({
      date: iso.slice(5),
      label: i === 0 ? '오늘' : shortLabel(d),
      balance,
      event: eventText || undefined,
      risk: balance < SAFETY_LINE,
    })
  }

  return {
    baseDate: ymd(BASE_DATE),
    horizonDays: HORIZON_DAYS,
    startBalance: STARTING_BALANCE,
    safetyLine: SAFETY_LINE,
    days,
    settlements: settlements.sort((a, b) => (a.date > b.date ? 1 : -1)),
    risk: detectRisk(days, settlements),
  }
}

// 안전선 미만 구간을 위험 알림으로 추출
export function detectRisk(days: DayBalance[], settlements: LedgerEvent[]): RiskAlert | null {
  const riskDays = days.filter((d) => d.risk)
  if (!riskDays.length) return null

  const lowest = riskDays.reduce((a, b) => (b.balance < a.balance ? b : a))
  const start = riskDays[0]
  const end = riskDays[riskDays.length - 1]

  // 위험 구간 진입 이후 가장 먼저 들어오는 큰 정산
  const nextSettle = settlements.find((s) => s.date.slice(5) >= start.date)

  const reason =
    `임대료·공과금 등 고정비가 정산 입금보다 먼저 빠져나가 ` +
    `${lowest.label} 잔액이 ${man(lowest.balance)}만원까지 떨어집니다.`

  const suggestion = nextSettle
    ? `다음 큰 입금은 ${nextSettle.date.slice(5).replace('-', '/').replace(/^0/, '')} ${nextSettle.label}(+${man(nextSettle.amount)}만원)입니다. ` +
      `그 전까지 예약 추가 확보나 세금통장 자금의 일시 운영 전환을 검토하세요.`
    : '예약 추가 확보 또는 지출 시점 조정이 필요합니다.'

  return {
    startLabel: start.label,
    endLabel: end.label,
    lowestLabel: lowest.label,
    lowestBalance: lowest.balance,
    shortfall: Math.max(0, SAFETY_LINE - lowest.balance),
    reason,
    suggestion,
  }
}

// 월별 매출 추이에서 성수기/비수기 신호 텍스트 도출
export interface Seasonal {
  trend: 'up' | 'down' | 'flat'
  growthPct: number
  peakMessage: string
  prepMessage: string
}

export function analyzeSeasonal(monthlyGross: { month: string; gross: number }[]): Seasonal {
  if (monthlyGross.length < 2) {
    return { trend: 'flat', growthPct: 0, peakMessage: '', prepMessage: '' }
  }
  const recent = monthlyGross.slice(-3)
  const first = recent[0].gross
  const last = recent[recent.length - 1].gross
  const growthPct = first > 0 ? Math.round(((last - first) / first) * 100) : 0
  const trend = growthPct > 3 ? 'up' : growthPct < -3 ? 'down' : 'flat'

  // 다음 달 매출 단순 추정(최근 평균 증가율 연장) → 준비자금 = 추정 매출의 10%
  const projectedNext = Math.round(last * (1 + growthPct / 100 / recent.length))
  const prepFund = Math.round((projectedNext * 0.1) / 10_000)

  const peakMessage =
    trend === 'up'
      ? `최근 3개월 매출이 ${growthPct}% 상승 중입니다. 여름 성수기 진입 신호로 보입니다.`
      : trend === 'down'
        ? `최근 3개월 매출이 ${Math.abs(growthPct)}% 하락 중입니다. 비수기 진입 가능성이 있어 현금 보존이 필요합니다.`
        : '최근 매출이 안정적으로 유지되고 있습니다.'

  const prepMessage =
    trend === 'up'
      ? `성수기 4주 전, 소모품·인테리어 등 준비자금 약 ${prepFund}만원을 미리 확보해 두세요.`
      : `비수기 대비 고정비 ${recent.length}개월치 예비자금을 분리해 두는 것을 권장합니다.`

  return { trend, growthPct, peakMessage, prepMessage }
}
