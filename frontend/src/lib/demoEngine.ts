// ─────────────────────────────────────────────────────────────
// 데모 모드 전용 클라이언트 계산 엔진.
// 백엔드가 없어도(Netlify 정적 배포) Connect에서 입력한 데이터가
// 대시보드·매출·예측 화면에 그대로 반영되도록, backend/src/lib의
// forecast.ts / healthScore.ts / briefing.ts 룰 기반 로직을 그대로 옮긴 것.
// (DB 대신 DemoStore의 플랫폼 현재월 집계치를 입력으로 받는다는 점만 다름)
// ─────────────────────────────────────────────────────────────
import type {
  Briefing,
  CalendarEvent,
  DailyRecord,
  DashboardSummary,
  Forecast,
  ForecastDay,
  HealthScore,
  PlatformBreakdown,
  PlatformSummary,
  RiskAlert,
  RoiResult,
  Seasonal,
  Settlement,
  TaxReserve,
} from './api'

export interface DemoPlatform {
  id: string
  key: string
  name: string
  color: string
  feeRate: number
  settleCycle: string
  connected: boolean
  occupancy: number
  vacancy: number
  gross: number // 이번 달 매출(원)
  bookings: number // 이번 달 예약 건수
}

export interface DemoFixedCost {
  id: string
  item: string
  dayOfMonth: number
  amount: number
}

export interface DemoTaxReserve {
  rate: number
  currentBalance: number
  nextFilingDate: string
  filingType: string
}

export interface DemoStore {
  platforms: DemoPlatform[]
  pastMonths: { month: string; gross: number; net: number }[] // 1~5월 (고정 히스토리)
  currentMonthKey: string // '2026-06'
  fixedCosts: DemoFixedCost[]
  taxReserve: DemoTaxReserve
}

export const BASE_DATE = new Date('2026-06-19')
export const STARTING_BALANCE = 3_120_000
export const SAFETY_LINE = 500_000

const man = (won: number) => Math.round(won / 10_000)
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
function mmdd(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ── 플랫폼별 매출/수수료/순익 ────────────────────────────────────
export function derivePlatforms(store: DemoStore): PlatformSummary[] {
  return store.platforms.map((p) => {
    const fee = Math.round(p.gross * p.feeRate)
    const net = p.gross - fee
    return {
      id: p.id,
      key: p.key,
      name: p.name,
      color: p.color,
      feeRate: p.feeRate,
      settleCycle: p.settleCycle,
      connected: p.connected,
      occupancy: p.occupancy,
      vacancy: p.vacancy,
      gross: p.gross,
      fee,
      net,
      bookings: p.bookings,
      netRate: p.gross > 0 ? net / p.gross : 0,
      perBooking: p.bookings > 0 ? Math.round(net / p.bookings) : 0,
    }
  })
}

export function deriveDashboardSummary(store: DemoStore): DashboardSummary {
  const platforms = derivePlatforms(store)
  const totals = platforms.reduce(
    (acc, p) => {
      acc.gross += p.gross
      acc.fee += p.fee
      acc.net += p.net
      acc.bookings += p.bookings
      return acc
    },
    { gross: 0, fee: 0, net: 0, bookings: 0 },
  )
  const monthlyTrend = [
    ...store.pastMonths,
    { month: store.currentMonthKey, gross: totals.gross, net: totals.net },
  ]
  // 일별 실거래 데이터가 없어 월 합계를 요일 패턴으로 분산해 "일별 기록"을 합성한다.
  const days = synthesizeDailyRecords(totals)
  const today = days[days.length - 1]
  return { totals, today, days, monthlyTrend }
}

// 요일별 매출 가중치 (0=일 … 6=토) — 파티룸 특성상 목~토가 성수
const WEEKDAY_FACTOR = [1.1, 0.6, 0.5, 0.7, 1.0, 1.5, 1.6]
const DAILY_WINDOW = 35 // 오늘 포함 직전 5주치

function synthesizeDailyRecords(totals: {
  gross: number
  fee: number
  net: number
  bookings: number
}): DailyRecord[] {
  const avgGross = totals.gross / 30
  const feeRate = totals.gross > 0 ? totals.fee / totals.gross : 0
  const avgBookings = totals.bookings / 30
  const out: DailyRecord[] = []
  for (let i = DAILY_WINDOW - 1; i >= 0; i--) {
    const d = addDays(BASE_DATE, -i)
    const wf = WEEKDAY_FACTOR[d.getDay()]
    const jitter = 1 + (((d.getDate() % 5) - 2) * 0.06) // 날짜 기반 결정적 ±12% 편차
    const gross = Math.max(0, Math.round((avgGross * wf * jitter) / 10_000)) * 10_000
    const fee = Math.round(gross * feeRate)
    const net = gross - fee
    const bookings = Math.max(1, Math.round(avgBookings * wf * jitter))
    out.push({ date: ymd(d), gross, fee, net, bookings })
  }
  return out
}

// ── 운영 캘린더 (정산 입금·고정비·세금신고를 날짜별로) ───────────────
const CALENDAR_WEEKS = 6 // 부가세 신고(7/25)까지 포함하도록 6주

function startOfWeek(d: Date) {
  return addDays(d, -d.getDay()) // 일요일 시작
}

export function buildCalendar(store: DemoStore): CalendarEvent[] {
  const weekStart = startOfWeek(BASE_DATE)
  const end = addDays(weekStart, CALENDAR_WEEKS * 7 - 1)
  const events: CalendarEvent[] = []

  // 정산 입금(income) — 플랫폼별 정산 주기
  for (const p of store.platforms) {
    for (const s of settlementEvents(p, end)) {
      events.push({ date: s.date, label: p.name, amount: s.amount, kind: 'income' })
    }
  }

  // 네이버 예약 정산 입금 추가분 (결제 후 2일 주기로 자주 들어오는 소액 정산)
  const naver = store.platforms.find((p) => p.key === 'naver')
  if (naver) {
    const naverSettlements = [
      { date: '2026-06-23', amount: 280_000 },
      { date: '2026-06-28', amount: 420_000 },
      { date: '2026-07-02', amount: 350_000 },
      { date: '2026-07-07', amount: 510_000 },
      { date: '2026-07-14', amount: 390_000 },
    ]
    for (const s of naverSettlements) {
      const d = new Date(s.date)
      if (d >= BASE_DATE && d <= end) {
        events.push({ date: s.date, label: naver.name, amount: s.amount, kind: 'income' })
      }
    }
  }

  // 고정비(expense) — 매월 dayOfMonth 발생분, 오늘 이후만
  const months = [
    new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth(), 1),
    new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() + 1, 1),
  ]
  for (const fc of store.fixedCosts) {
    for (const m of months) {
      const occ = new Date(m.getFullYear(), m.getMonth(), fc.dayOfMonth)
      if (occ >= BASE_DATE && occ <= end) {
        events.push({ date: ymd(occ), label: fc.item, amount: fc.amount, kind: 'expense' })
      }
    }
  }

  // 세금 신고(filing)
  const filing = new Date(store.taxReserve.nextFilingDate)
  if (filing >= BASE_DATE && filing <= end) {
    events.push({ date: ymd(filing), label: store.taxReserve.filingType, amount: 0, kind: 'filing' })
  }

  return events.sort((a, b) => (a.date > b.date ? 1 : -1))
}

export function derivePlatformBreakdown(store: DemoStore): PlatformBreakdown {
  const platforms = derivePlatforms(store)
  return {
    month: store.currentMonthKey,
    breakdown: platforms.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      color: p.color,
      feeRate: p.feeRate,
      settleCycle: p.settleCycle,
      gross: p.gross,
      fee: p.fee,
      net: p.net,
      netRate: p.netRate,
    })),
  }
}

// ── 현금흐름 예측 (backend lib/forecast.ts 포팅) ─────────────────
function latestMonthNet(p: DemoPlatform) {
  const fee = Math.round(p.gross * p.feeRate)
  return p.gross - fee
}

function settlementEvents(p: DemoPlatform, horizonEnd: Date): Settlement[] {
  const net = latestMonthNet(p)
  if (net <= 0) return []

  const monthly = p.settleCycle.match(/익월\s*(\d+)\s*일/)
  if (monthly) {
    const day = Number(monthly[1])
    const [y, m] = BASE_DATE.toISOString().slice(0, 7).split('-').map(Number)
    const settleDate = new Date(y, m, day) // m(1-base 이번달) → 0-base 다음달
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

function detectRisk(days: ForecastDay[], settlements: Settlement[]): RiskAlert | null {
  const riskDays = days.filter((d) => d.risk)
  if (!riskDays.length) return null

  const lowest = riskDays.reduce((a, b) => (b.balance < a.balance ? b : a))
  const start = riskDays[0]
  const end = riskDays[riskDays.length - 1]
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

export function analyzeSeasonal(monthlyGross: { month: string; gross: number }[]): Seasonal {
  if (monthlyGross.length < 2) {
    return { trend: 'flat', growthPct: 0, peakMessage: '', prepMessage: '' }
  }
  const recent = monthlyGross.slice(-3)
  const first = recent[0].gross
  const last = recent[recent.length - 1].gross
  const growthPct = first > 0 ? Math.round(((last - first) / first) * 100) : 0
  const trend = growthPct > 3 ? 'up' : growthPct < -3 ? 'down' : 'flat'

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

const HORIZON_DAYS = 30

export function buildForecast(store: DemoStore): Forecast {
  const horizonEnd = addDays(BASE_DATE, HORIZON_DAYS)

  const settlements = store.platforms.flatMap((p) => settlementEvents(p, horizonEnd))
  const byDate = new Map<string, Settlement[]>()
  for (const e of settlements) {
    const arr = byDate.get(e.date) ?? []
    arr.push(e)
    byDate.set(e.date, arr)
  }

  const days: ForecastDay[] = []
  let balance = STARTING_BALANCE

  for (let i = 0; i <= HORIZON_DAYS; i++) {
    const d = addDays(BASE_DATE, i)
    const iso = ymd(d)
    const events = [...(byDate.get(iso) ?? [])]
    for (const fc of store.fixedCosts) {
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

  const sortedSettlements = settlements.sort((a, b) => (a.date > b.date ? 1 : -1))
  return {
    baseDate: ymd(BASE_DATE),
    horizonDays: HORIZON_DAYS,
    startBalance: STARTING_BALANCE,
    safetyLine: SAFETY_LINE,
    days,
    settlements: sortedSettlements,
    risk: detectRisk(days, sortedSettlements),
    seasonal: analyzeSeasonal(deriveDashboardSummary(store).monthlyTrend),
  }
}

// ── 금융 건강 점수 (backend lib/healthScore.ts 포팅) ─────────────
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

export function computeHealthScore(store: DemoStore): HealthScore {
  const summary = deriveDashboardSummary(store)
  const monthlyGross = summary.monthlyTrend.map((m) => m.gross)
  const currentGross = summary.totals.gross
  const fixedCostsMonthly = store.fixedCosts.reduce((s, fc) => s + fc.amount, 0)
  const forecast = buildForecast(store)
  const minForecastBalance = forecast.days.reduce((min, d) => Math.min(min, d.balance), Infinity)
  const safe = Number.isFinite(minForecastBalance) ? minForecastBalance : 0
  const taxRecommended = Math.round(currentGross * store.taxReserve.rate)
  const taxCurrent = store.taxReserve.currentBalance

  const cashRatio = safe / SAFETY_LINE
  const cashflow = clamp(60 + cashRatio * 20)

  const fixedRatio = currentGross > 0 ? fixedCostsMonthly / currentGross : 1
  const fixedCost = clamp(100 - fixedRatio * 80)

  const mean = monthlyGross.reduce((s, g) => s + g, 0) / Math.max(1, monthlyGross.length)
  const variance = monthlyGross.reduce((s, g) => s + (g - mean) ** 2, 0) / Math.max(1, monthlyGross.length)
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0
  const volatility = clamp(100 - cv * 200)

  const taxCoverage = taxRecommended > 0 ? taxCurrent / taxRecommended : 1
  const arrears = clamp(40 + (safe >= 0 ? 30 : 0) + taxCoverage * 30)

  const factors = [
    {
      label: '현금흐름 안정성',
      score: cashflow,
      note: safe < SAFETY_LINE ? `예측 최저 잔액 ${man(safe)}만원 — 위험 구간 존재` : `예측 최저 잔액 ${man(safe)}만원 — 안전선 이상`,
    },
    { label: '고정비 비율', score: fixedCost, note: `매출 대비 고정비 ${Math.round(fixedRatio * 100)}%` },
    { label: '매출 변동성', score: volatility, note: `성수기·비수기 편차 (변동계수 ${cv.toFixed(2)})` },
    { label: '연체 위험', score: arrears, note: `세금 예비금 확보율 ${Math.round(taxCoverage * 100)}%` },
  ]

  const total = clamp(factors.reduce((s, f) => s + f.score, 0) / factors.length)
  const grade = total >= 80 ? '우수' : total >= 65 ? '양호' : total >= 45 ? '보통' : '주의'
  return { total, grade, factors }
}

// ── 세금 예비금 ──────────────────────────────────────────────────
export function deriveTaxReserve(store: DemoStore): TaxReserve {
  const monthlyRevenue = deriveDashboardSummary(store).totals.gross
  const recommended = Math.round(monthlyRevenue * store.taxReserve.rate)
  return {
    rate: store.taxReserve.rate,
    currentBalance: store.taxReserve.currentBalance,
    nextFilingDate: store.taxReserve.nextFilingDate,
    filingType: store.taxReserve.filingType,
    monthlyRevenue,
    recommended,
    shortfall: Math.max(0, recommended - store.taxReserve.currentBalance),
  }
}

// ── ROI 계산기 (backend routes/roi.ts 포팅) ──────────────────────
export function calculateRoiLocal(investment: number, monthlyFixed: number, avgMonthlyNet: number): RoiResult {
  const monthlyProfit = avgMonthlyNet - monthlyFixed
  const recoverable = monthlyProfit > 0
  const months = recoverable ? Math.round((investment / monthlyProfit) * 10) / 10 : null
  return { monthlyProfit, recoverable, months }
}

// ── 오늘의 브리핑 (backend lib/briefing.ts 포팅) ──────────────────
export function buildBriefing(store: DemoStore): Briefing {
  const forecast = buildForecast(store)
  const today = forecast.days[0]
  const weekEnd = addDays(BASE_DATE, 7)

  const weekSettlement = forecast.settlements
    .filter((s) => new Date(s.date) <= weekEnd)
    .map((s) => ({ platform: s.label.replace(/\s*정산$/, ''), amount: s.amount, date: mmdd(new Date(s.date)) }))

  const upcoming: Briefing['upcoming'] = []
  for (const fc of store.fixedCosts) {
    for (const base of [BASE_DATE, new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() + 1, 1)]) {
      const occ = new Date(base.getFullYear(), base.getMonth(), fc.dayOfMonth)
      if (occ >= BASE_DATE && occ <= weekEnd) {
        upcoming.push({ label: fc.item, amount: fc.amount, date: mmdd(occ), urgent: fc.amount >= 1_000_000 })
        break
      }
    }
  }
  const tax = store.taxReserve
  const filing = new Date(tax.nextFilingDate)
  const daysLeft = Math.round((filing.getTime() - BASE_DATE.getTime()) / 86_400_000)
  const recommended = Math.round(deriveDashboardSummary(store).totals.gross * tax.rate)
  upcoming.push({ label: tax.filingType, amount: recommended, date: mmdd(filing), urgent: daysLeft <= 40 })
  upcoming.sort((a, b) => (a.date > b.date ? 1 : -1))

  const worst = store.platforms.length
    ? store.platforms.reduce((a, b) => (b.vacancy > a.vacancy ? b : a))
    : null
  const vacancy = worst
    ? `${worst.name} 공실률이 ${worst.vacancy}%로 가장 높습니다. 비어있는 시간대에 할인 노출을 권장합니다.`
    : '공실 데이터가 없습니다.'

  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'long' }).format(BASE_DATE)
  const date = `${BASE_DATE.getFullYear()}년 ${BASE_DATE.getMonth() + 1}월 ${BASE_DATE.getDate()}일 ${weekday}`

  const risk = forecast.risk
  return {
    date,
    expectedBalance: today?.balance ?? 0,
    weekSettlement,
    upcoming,
    vacancy,
    calendar: buildCalendar(store),
    cashRisk: risk
      ? {
          period: `${risk.startLabel}~${risk.endLabel}`,
          lowestBalance: risk.lowestBalance,
          reason: risk.reason,
          suggestion: risk.suggestion,
        }
      : undefined,
  }
}

// ── CSV 파싱 (백엔드 없이 브라우저에서 직접 처리) ─────────────────
// 컬럼: platformKey,date,grossAmount,bookings (date는 데모에서는 참고용, 전부 이번 달 집계에 더해짐)
export function parseSalesCsv(text: string): { platformKey: string; grossAmount: number; bookings?: number }[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const header = lines[0].split(',').map((h) => h.trim())
  const idx = {
    platformKey: header.indexOf('platformKey'),
    grossAmount: header.indexOf('grossAmount'),
    bookings: header.indexOf('bookings'),
  }
  if (idx.platformKey < 0 || idx.grossAmount < 0) return []

  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = line.split(',').map((c) => c.trim())
    return {
      platformKey: cols[idx.platformKey],
      grossAmount: Number(cols[idx.grossAmount]) || 0,
      bookings: idx.bookings >= 0 ? Number(cols[idx.bookings]) || 1 : 1,
    }
  })
}

// ── 초기 데모 스토어 (backend prisma/seed.ts 와 동일한 기준 데이터) ──
export function createInitialDemoStore(): DemoStore {
  return {
    platforms: [
      {
        id: 'p1', key: 'spacecloud', name: '스페이스클라우드', color: '#3366ff',
        feeRate: 0.1, settleCycle: '익월 10일', connected: true,
        occupancy: 85, vacancy: 15, gross: 4_200_000, bookings: 56,
      },
      {
        id: 'p2', key: 'naver', name: '네이버 예약', color: '#16a34a',
        feeRate: 0.033, settleCycle: '결제 후 2일', connected: true,
        occupancy: 78, vacancy: 22, gross: 2_500_000, bookings: 32,
      },
      {
        id: 'p3', key: 'ourplace', name: '아워플레이스', color: '#f59e0b',
        feeRate: 0.12, settleCycle: '익월 15일', connected: false,
        occupancy: 68, vacancy: 32, gross: 1_800_000, bookings: 22,
      },
    ],
    pastMonths: [
      { month: '2026-01', gross: 5_200_000, net: 4_760_510 },
      { month: '2026-02', gross: 4_800_000, net: 4_394_070 },
      { month: '2026-03', gross: 6_100_000, net: 5_583_930 },
      { month: '2026-04', gross: 6_900_000, net: 6_316_810 },
      { month: '2026-05', gross: 7_600_000, net: 6_957_210 },
    ],
    currentMonthKey: '2026-06',
    fixedCosts: [
      { id: 'fc1', item: '가게 월세', dayOfMonth: 25, amount: 2_800_000 },
      { id: 'fc2', item: '공과금', dayOfMonth: 26, amount: 120_000 },
      { id: 'fc3', item: '소모품', dayOfMonth: 27, amount: 110_000 },
      { id: 'fc4', item: '알바 급여', dayOfMonth: 30, amount: 450_000 },
    ],
    taxReserve: {
      rate: 0.18,
      currentBalance: 400_000,
      nextFilingDate: '2026-07-25',
      filingType: '부가가치세 1기 확정신고',
    },
  }
}
