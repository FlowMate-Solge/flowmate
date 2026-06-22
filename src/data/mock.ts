// ─────────────────────────────────────────────────────────────
// FlowMate 데모 데이터
// 페르소나: 파티룸 "무드살롱 홍대점" 김민수 사장 (2년차)
// 기준일: 2026-06-19 / 멀티플랫폼 3개 운영 / 성수기 진입 직전
// 모든 화면이 이 데이터 하나로 같은 스토리를 말합니다.
// ─────────────────────────────────────────────────────────────

export const persona = {
  name: '김민수',
  business: '무드살롱 홍대점',
  type: '파티룸',
  years: 2,
  today: '2026-06-19',
}

// 만원 단위 헬퍼
export const won = (manwon: number) => manwon * 10000
export const fmtMan = (manwon: number) =>
  `${manwon.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만원`

// ── 플랫폼별 이번 달(6월) 실적 ──────────────────────────────
export interface Platform {
  id: string
  name: string
  color: string
  gross: number // 매출(만원)
  feeRate: number // 수수료율
  bookings: number // 예약 건수
  settleCycle: string // 정산 주기
  nextSettleDate: string // 다음 정산일
}

export const platforms: Platform[] = [
  {
    id: 'spacecloud',
    name: '스페이스클라우드',
    color: '#3366ff',
    gross: 420,
    feeRate: 0.1,
    bookings: 56,
    settleCycle: '익월 10일',
    nextSettleDate: '07-10',
  },
  {
    id: 'naver',
    name: '네이버 예약',
    color: '#16a34a',
    gross: 250,
    feeRate: 0.033,
    bookings: 32,
    settleCycle: '결제 후 2일',
    nextSettleDate: '06-21',
  },
  {
    id: 'ourplace',
    name: '아워플레이스',
    color: '#f59e0b',
    gross: 180,
    feeRate: 0.12,
    bookings: 22,
    settleCycle: '익월 15일',
    nextSettleDate: '07-15',
  },
]

export const platformDerived = platforms.map((p) => {
  const fee = Math.round(p.gross * p.feeRate * 10) / 10
  const net = Math.round((p.gross - fee) * 10) / 10
  return {
    ...p,
    fee,
    net,
    netRate: net / p.gross, // 순익률
    perBooking: Math.round((net / p.bookings) * 10) / 10, // 예약당 순익
  }
})

export const totals = {
  gross: platformDerived.reduce((s, p) => s + p.gross, 0),
  fee: Math.round(platformDerived.reduce((s, p) => s + p.fee, 0) * 10) / 10,
  net: Math.round(platformDerived.reduce((s, p) => s + p.net, 0) * 10) / 10,
  bookings: platformDerived.reduce((s, p) => s + p.bookings, 0),
}

// ── 플랫폼별 월별 매출 분해 (만원) ───────────────────────────
// 각 월 합계 = 대시보드 월별 추이, 6월 = platformDerived(420/250/180)
export const platformMonths = ['1월', '2월', '3월', '4월', '5월', '6월']
export const platformMonthlyGross: Record<string, number[]> = {
  spacecloud: [257, 237, 301, 341, 376, 420],
  naver: [153, 141, 179, 203, 223, 250],
  ourplace: [110, 102, 130, 146, 161, 180],
}

// 특정 월(인덱스)의 플랫폼별 매출/수수료/순수익 분해
export function platformBreakdownAt(monthIndex: number) {
  return platforms.map((p) => {
    const gross = platformMonthlyGross[p.id][monthIndex]
    const fee = Math.round(gross * p.feeRate * 10) / 10
    const net = Math.round((gross - fee) * 10) / 10
    return { ...p, gross, fee, net, netRate: net / gross }
  })
}

// 월별 합계 추이 (라인 차트용)
export const platformMonthlyTotals = platformMonths.map((month, i) => {
  const b = platformBreakdownAt(i)
  return {
    month,
    gross: b.reduce((s, p) => s + p.gross, 0),
    net: Math.round(b.reduce((s, p) => s + p.net, 0) * 10) / 10,
  }
})

// ── 월별 매출 추이 (성수기/비수기 편차) ──────────────────────
export interface MonthPoint {
  month: string
  gross: number
  net: number
  forecast?: boolean
}

export const monthlyTrend: MonthPoint[] = [
  { month: '1월', gross: 520, net: 470 },
  { month: '2월', gross: 480, net: 432 },
  { month: '3월', gross: 610, net: 552 },
  { month: '4월', gross: 690, net: 626 },
  { month: '5월', gross: 760, net: 690 },
  { month: '6월', gross: 850, net: 778 },
  { month: '7월', gross: 950, net: 860, forecast: true },
  { month: '8월', gross: 1020, net: 924, forecast: true },
]

// ── 금융 건강 점수 ───────────────────────────────────────────
export const healthScore = {
  total: 64,
  grade: '보통',
  factors: [
    { label: '현금흐름 안정성', score: 58, note: '6월 말 잔액 위험 구간 존재' },
    { label: '고정비 비율', score: 70, note: '매출 대비 고정비 49%' },
    { label: '매출 변동성', score: 55, note: '성수기·비수기 편차 큼 (2.1배)' },
    { label: '연체 위험', score: 72, note: '임대료 정기 납부 안정적' },
  ],
}

// ── 일별 잔액 예측 (6/19 ~ 7/19, 룰 기반) ────────────────────
export interface DayBalance {
  date: string // MM-DD
  label: string
  balance: number // 예상 잔액(만원)
  event?: string // 당일 주요 입출금
  risk?: boolean
}

// 시작 잔액 312만, 임대료 6/25 -280, 정산 입금들, 7/25 부가세는 horizon 밖
export const dailyForecast: DayBalance[] = [
  { date: '06-19', label: '오늘', balance: 312 },
  { date: '06-20', label: '6/20', balance: 305 },
  { date: '06-21', label: '6/21', balance: 339, event: '네이버 정산 +35' },
  { date: '06-22', label: '6/22', balance: 331 },
  { date: '06-23', label: '6/23', balance: 318 },
  { date: '06-24', label: '6/24', balance: 304 },
  { date: '06-25', label: '6/25', balance: 24, event: '임대료 -280', risk: true },
  { date: '06-26', label: '6/26', balance: 12, event: '공과금 -12', risk: true },
  { date: '06-27', label: '6/27', balance: 1, event: '소모품 -11', risk: true },
  { date: '06-28', label: '6/28', balance: 33, event: '주말 예약 +32' },
  { date: '06-29', label: '6/29', balance: 58 },
  { date: '06-30', label: '6/30', balance: 41, event: '알바 급여 -45' },
  { date: '07-01', label: '7/1', balance: 70 },
  { date: '07-03', label: '7/3', balance: 96 },
  { date: '07-05', label: '7/5', balance: 121 },
  { date: '07-08', label: '7/8', balance: 150 },
  { date: '07-10', label: '7/10', balance: 528, event: '스페이스클라우드 정산 +378' },
  { date: '07-13', label: '7/13', balance: 560 },
  { date: '07-15', label: '7/15', balance: 718, event: '아워플레이스 정산 +158' },
  { date: '07-19', label: '7/19', balance: 690 },
]

export const riskAlert = {
  date: '6월 25일~27일',
  reason: '임대료(280만)·공과금이 정산 입금보다 먼저 빠져나가 잔액이 1만원까지 떨어집니다.',
  shortfall: 280,
  suggestion: '네이버 정산(6/21, 35만)을 세금통장 대신 운영비로 우선 배정하거나, 6/24까지 예약 1~2건 추가 확보가 필요합니다.',
}

// ── 세금 예비금 ──────────────────────────────────────────────
export const taxReserve = {
  rate: 0.18, // 매출의 18% 권장
  monthlyRevenue: 640, // 이번 달 매출(만원) — 예비금 산정 기준
  recommended: 0, // 아래에서 계산
  current: 40, // 현재 세금통장
  nextFiling: '2026-07-25',
  filingType: '부가가치세 1기 확정신고',
}
taxReserve.recommended = Math.round(taxReserve.monthlyRevenue * taxReserve.rate) // 115만

// ── ROI 계산기 기본값 ────────────────────────────────────────
export const roiDefaults = {
  investment: 5000, // 초기 투자(만원)
  monthlyFixed: 415, // 월 고정비
  avgMonthlyNet: 695, // 월 평균 순수익(수수료 차감 후)
}

// ── 플랫폼 전략 추천 ─────────────────────────────────────────
export const platformStrategy = [
  {
    title: '네이버 예약에 광고비 집중',
    body: '순익률 96.7%로 가장 높고 예약당 순익도 우수합니다. 광고 예산을 늘릴 1순위.',
    tone: 'positive' as const,
  },
  {
    title: '아워플레이스 비중 축소 검토',
    body: '수수료 12%로 가장 높은데 예약은 22건으로 가장 적습니다. 노출 비용 대비 효율을 점검하세요.',
    tone: 'warning' as const,
  },
  {
    title: '스페이스클라우드는 볼륨 유지',
    body: '예약 56건으로 물량의 절반. 단 정산이 익월 10일이라 현금흐름 시차에 유의.',
    tone: 'neutral' as const,
  },
]

// ── 상권 기반 시세 분석 (시간당 대여가) ──────────────────────
export const priceBenchmark = {
  low: 15000, // 저가 구간
  golden: 25000, // 이 지역 골든 최적가 (한계 수익점)
  high: 40000, // 고가 구간
  current: 21000, // 현재 책정가
  weekendMax: 27000, // 주말 인상 여력 상한
}
// 골든 최적가 대비 인상 여유 (원)
export const priceHeadroom = priceBenchmark.golden - priceBenchmark.current // 4,000

// ── 정책자금 안내 ────────────────────────────────────────────
export const policyFunds = [
  { name: '소상공인 운전자금', desc: '최대 5천만원 · 연 2.7~3.5%' },
  { name: '시설개선 자금', desc: '최대 1억원 · 연 2.5%' },
  { name: '신용보증재단 특례보증', desc: '신용등급 무관 · 연 3.0%' },
]
export const policyFundNote = '소상공인진흥공단 기준 · 신청 조건은 상담 필요'

// ── 소비자 선호 가격대 (Act) ─────────────────────────────────
export const priceBands = [
  { band: '~1만', share: 8 },
  { band: '1~2만', share: 22 },
  { band: '2~3만', share: 41 },
  { band: '3~4만', share: 21 },
  { band: '4만~', share: 8 },
]
export const priceInsight = '이 지역 유사 파티룸 예약의 41%가 시간당 2~3만원 구간에서 발생합니다.'

// ── 오늘의 운영 브리핑 (6/19) ────────────────────────────────
export const briefing = {
  date: '2026년 6월 19일 금요일',
  expectedBalance: 312,
  weekSettlement: [{ platform: '네이버 예약', amount: 35, date: '6/21' }],
  upcoming: [
    { label: '임대료 자동이체', amount: 280, date: '6/25', urgent: true },
    { label: '부가세 1기 확정신고', amount: 153, date: '7/25', urgent: false },
  ],
  vacancy: '이번 주 금요일(6/26) 저녁 타임 예약 0건 — 할인 노출 권장',
}

// ── 매출 통합 분석 (대여 채널) ───────────────────────────────
// 원 단위 포맷터 (₩38,400,000 형태)
export const fmtWon = (won: number) => `₩${won.toLocaleString('ko-KR')}`

export interface RentalChannel {
  id: string
  name: string
  color: string
  gross: number // 누적 매출액(원)
  feeRate: number // 플랫폼 수수료율
  occupancy: number // 예약률(%)
  vacancy: number // 공실률(%)
  settleCycle: string // 정산 주기
}

export const rentalChannels: RentalChannel[] = [
  {
    id: 'airbnb',
    name: '에어비앤비',
    color: '#ff5a5f',
    gross: 18_200_000,
    feeRate: 0.15,
    occupancy: 85,
    vacancy: 15,
    settleCycle: '체크아웃 + 3일',
  },
  {
    id: 'yanolja',
    name: '야놀자',
    color: '#3366ff',
    gross: 12_400_000,
    feeRate: 0.1,
    occupancy: 78,
    vacancy: 22,
    settleCycle: '매주 수요일 정산',
  },
  {
    id: 'goodchoice',
    name: '여기어때',
    color: '#f43f5e',
    gross: 7_800_000,
    feeRate: 0.12,
    occupancy: 68,
    vacancy: 32,
    settleCycle: '매월 15일 정산',
  },
]

export const rentalDerived = rentalChannels.map((c) => {
  const fee = Math.round(c.gross * c.feeRate)
  return { ...c, fee, net: c.gross - fee }
})

export const rentalTotals = {
  gross: rentalDerived.reduce((s, c) => s + c.gross, 0), // 38,400,000
  fee: rentalDerived.reduce((s, c) => s + c.fee, 0), // 4,906,000
  net: rentalDerived.reduce((s, c) => s + c.net, 0), // 33,494,000
}

export const rentalAvgFeeRate = rentalTotals.fee / rentalTotals.gross // ≈ 0.128

export const rentalInsight =
  '플랫폼 평균 수수료율 12.8%는 업종 표준(11.2%) 대비 다소 높습니다. 예약률이 다소 저하되나 수수료가 연간 고정 4~10% 수준인 직접 연계 예약 솔루션(예: 카카오톡 예약) 비중을 15% 이상 확장하는 것을 추천합니다.'

// 월별 수익 종합 추이 (원)
export const rentalMonthly = [
  { month: '1월', gross: 25_600_000, net: 22_300_000 },
  { month: '2월', gross: 27_900_000, net: 24_500_000 },
  { month: '3월', gross: 30_200_000, net: 26_800_000 },
  { month: '4월', gross: 33_800_000, net: 30_400_000 },
  { month: '5월', gross: 37_600_000, net: 33_300_000 },
  { month: '6월', gross: 38_400_000, net: 33_494_000 },
]

// ── AI 금융 비서 시나리오 응답 ───────────────────────────────
export interface QA {
  q: string
  a: string
}

export const aiPresets: QA[] = [
  {
    q: '이번 달 괜찮아?',
    a: '6월 매출은 850만원으로 5월 대비 +12% 성장 중입니다. 다만 6월 25일 임대료(280만)가 빠지면 잔액이 1만원까지 떨어지는 위험 구간이 있어요. 6월 21일 네이버 정산 35만원이 들어오니, 이 돈은 세금통장 대신 운영비로 잡아두는 걸 권합니다.',
  },
  {
    q: '세금 얼마나 떼놔야 해?',
    a: '이번 달 매출 850만원 기준, 부가세·종합소득세 대비 18%인 153만원을 세금통장에 분리해 두세요. 현재 40만원만 있어서 113만원이 부족합니다. 7월 25일 부가세 신고 전까지 확보가 필요해요.',
  },
  {
    q: '어느 플랫폼에 집중해야 해?',
    a: '네이버 예약이 순익률 96.7%로 가장 높습니다(수수료 3.3%). 반면 아워플레이스는 수수료 12%인데 예약은 22건뿐이라 효율이 낮아요. 광고비를 아워플레이스에서 네이버로 옮기는 걸 추천합니다.',
  },
  {
    q: '투자금은 언제 회수돼?',
    a: '초기 투자 5,000만원, 월 평균 순수익에서 고정비를 뺀 280만원 기준으로 약 17.9개월 후인 2027년 상반기에 손익분기점에 도달합니다. 여름 성수기 매출이 계획대로면 1~2개월 앞당길 수 있어요.',
  },
]
