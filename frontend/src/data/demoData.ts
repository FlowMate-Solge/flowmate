// API 응답 형태와 동일한 데모 데이터
// 모든 금액은 원(原) 단위 — 페이지가 toManwon()으로 변환함
import type {
  DashboardSummary,
  Briefing,
  HealthScore,
  Forecast,
  TaxReserve,
  RoiInput,
  PlatformStrategy,
  PriceBenchmark,
  PolicyFunds,
  PlatformSummary,
  PlatformBreakdown,
} from '../lib/api'

const M = (manwon: number) => manwon * 10_000

// ── 대시보드 ─────────────────────────────────────────────────
export const DEMO_DASHBOARD: DashboardSummary = {
  totals: { gross: M(850), fee: M(72), net: M(778), bookings: 110 },
  monthlyTrend: [
    { month: '2026-01', gross: M(520), net: M(470) },
    { month: '2026-02', gross: M(480), net: M(432) },
    { month: '2026-03', gross: M(610), net: M(552) },
    { month: '2026-04', gross: M(690), net: M(626) },
    { month: '2026-05', gross: M(760), net: M(690) },
    { month: '2026-06', gross: M(850), net: M(778) },
  ],
}

export const DEMO_HEALTH: HealthScore = {
  total: 64,
  grade: '보통',
  factors: [
    { label: '현금흐름 안정성', score: 58, note: '6월 말 잔액 위험 구간 존재' },
    { label: '고정비 비율', score: 70, note: '매출 대비 고정비 49%' },
    { label: '매출 변동성', score: 55, note: '성수기·비수기 편차 큼 (2.1배)' },
    { label: '연체 위험', score: 72, note: '임대료 정기 납부 안정적' },
  ],
}

export const DEMO_BRIEFING: Briefing = {
  date: '2026년 6월 19일 금요일',
  expectedBalance: M(312),
  weekSettlement: [{ platform: '네이버 예약', amount: M(35), date: '6/21' }],
  upcoming: [
    { label: '임대료 자동이체', amount: M(280), date: '6/25', urgent: true },
    { label: '부가세 1기 확정신고', amount: M(153), date: '7/25', urgent: false },
  ],
  vacancy: '이번 주 금요일(6/26) 저녁 타임 예약 0건 — 할인 노출 권장',
  cashRisk: {
    period: '6/25~6/27',
    lowestBalance: M(1),
    reason: '임대료(280만)·공과금이 정산 입금보다 먼저 빠져나가 잔액이 1만원까지 떨어집니다.',
    suggestion: '6/21 네이버 정산(35만)을 운영비로 우선 배정하거나, 6/24까지 예약 1~2건 추가 확보가 필요합니다.',
  },
}

// ── 예측 ─────────────────────────────────────────────────────
export const DEMO_FORECAST: Forecast = {
  baseDate: '2026-06-19',
  horizonDays: 30,
  startBalance: M(312),
  safetyLine: M(100),
  days: [
    { date: '2026-06-19', label: '오늘', balance: M(312) },
    { date: '2026-06-20', label: '6/20', balance: M(305) },
    { date: '2026-06-21', label: '6/21', balance: M(339), event: '네이버 정산 +35만' },
    { date: '2026-06-22', label: '6/22', balance: M(331) },
    { date: '2026-06-23', label: '6/23', balance: M(318) },
    { date: '2026-06-24', label: '6/24', balance: M(304) },
    { date: '2026-06-25', label: '6/25', balance: M(24), event: '임대료 -280만', risk: true },
    { date: '2026-06-26', label: '6/26', balance: M(12), event: '공과금 -12만', risk: true },
    { date: '2026-06-27', label: '6/27', balance: M(1), event: '소모품 -11만', risk: true },
    { date: '2026-06-28', label: '6/28', balance: M(33), event: '주말 예약 +32만' },
    { date: '2026-06-29', label: '6/29', balance: M(58) },
    { date: '2026-06-30', label: '6/30', balance: M(41), event: '알바 급여 -45만' },
    { date: '2026-07-01', label: '7/1', balance: M(70) },
    { date: '2026-07-03', label: '7/3', balance: M(96) },
    { date: '2026-07-05', label: '7/5', balance: M(121) },
    { date: '2026-07-08', label: '7/8', balance: M(150) },
    { date: '2026-07-10', label: '7/10', balance: M(528), event: '스페이스클라우드 정산 +378만' },
    { date: '2026-07-13', label: '7/13', balance: M(560) },
    { date: '2026-07-15', label: '7/15', balance: M(718), event: '아워플레이스 정산 +158만' },
    { date: '2026-07-19', label: '7/19', balance: M(690) },
  ],
  settlements: [
    { date: '2026-06-21', amount: M(35), label: '네이버 예약 정산' },
    { date: '2026-07-10', amount: M(378), label: '스페이스클라우드 정산' },
    { date: '2026-07-15', amount: M(158), label: '아워플레이스 정산' },
  ],
  risk: {
    startLabel: '6/25',
    endLabel: '6/27',
    lowestLabel: '6/27',
    lowestBalance: M(1),
    shortfall: M(99),
    reason: '임대료(280만)·공과금이 정산 입금보다 먼저 빠져나가 잔액이 1만원까지 떨어집니다.',
    suggestion: '6/21 네이버 정산(35만)을 운영비로 우선 배정하거나, 6/24까지 예약 1~2건 추가 확보가 필요합니다.',
  },
  seasonal: {
    trend: 'up',
    growthPct: 12,
    peakMessage: '7~8월이 성수기입니다. 작년 동기 대비 15% 이상 예약 증가 예상.',
    prepMessage: '성수기 전 임대료·보증금 납부를 6월 안에 여유 있게 처리하세요.',
  },
}

export const DEMO_TAX: TaxReserve = {
  rate: 0.18,
  currentBalance: M(40),
  nextFilingDate: '2026-07-25',
  filingType: '부가가치세 1기 확정신고',
  monthlyRevenue: M(850),
  recommended: M(153),
  shortfall: M(113),
}

export const DEMO_ROI_DEFAULTS: RoiInput = {
  investment: M(5000),
  monthlyFixed: M(415),
  avgMonthlyNet: M(695),
}

// ── 행동 추천 ─────────────────────────────────────────────────
export const DEMO_STRATEGY: PlatformStrategy[] = [
  {
    title: '네이버 예약에 광고비 집중',
    body: '순익률 96.7%로 가장 높고 예약당 순익도 우수합니다. 광고 예산을 늘릴 1순위.',
    tone: 'positive',
  },
  {
    title: '아워플레이스 비중 축소 검토',
    body: '수수료 12%로 가장 높은데 예약은 22건뿐입니다. 노출 비용 대비 효율을 점검하세요.',
    tone: 'warning',
  },
  {
    title: '스페이스클라우드는 볼륨 유지',
    body: '예약 56건으로 물량의 절반. 단 정산이 익월 10일이라 현금흐름 시차에 유의.',
    tone: 'neutral',
  },
]

export const DEMO_PRICE: PriceBenchmark = {
  benchmark: {
    low: 15_000,
    golden: 25_000,
    high: 40_000,
    current: 21_000,
    weekendMax: 27_000,
  },
  headroom: 4_000,
  bands: [
    { band: '~1만', share: 8 },
    { band: '1~2만', share: 22 },
    { band: '2~3만', share: 41 },
    { band: '3~4만', share: 21 },
    { band: '4만~', share: 8 },
  ],
  insight: '이 지역 유사 파티룸 예약의 41%가 시간당 2~3만원 구간에서 발생합니다.',
}

export const DEMO_POLICY: PolicyFunds = {
  funds: [
    {
      name: '소상공인 정책자금 (경영안정·성장촉진)',
      org: '소상공인시장진흥공단',
      desc: '운전·시설자금 최대 7천만원 · 연 2.5~3.0% 고정금리 융자',
      target: '사업자등록 후 6개월 이상 소상공인',
      deadline: '연중상시',
      url: 'https://ols.semas.or.kr',
    },
    {
      name: '소상공인 스마트상점 기술보급사업',
      org: '소상공인시장진흥공단',
      desc: '예약시스템·키오스크 등 스마트 기술 도입 비용 최대 200만원 지원',
      target: '소상공인 (업력 무관)',
      deadline: '2026.08.31',
      url: 'https://www.sbiz24.kr',
    },
    {
      name: '보증드림 (비대면 신용보증)',
      org: '지역신용보증재단',
      desc: '영업점 방문 없이 비대면으로 보증 신청 · 신용등급 무관 최대 1억',
      target: '연매출 10억 미만 소상공인',
      deadline: '연중상시',
      url: 'https://www.koreg.or.kr',
    },
    {
      name: '중소벤처기업 혁신바우처',
      org: '중소벤처기업부',
      desc: '마케팅·컨설팅·기술지원 바우처 최대 3,000만원 (자부담 30%)',
      target: '매출 10억 미만 소기업·소상공인',
      deadline: '2026.09.30',
      url: 'https://www.smes.go.kr',
    },
    {
      name: '비즈니스지원단 전문가 무료 상담',
      org: '소상공인시장진흥공단',
      desc: '세무사·변호사·경영지도사 무료 1:1 경영 애로 상담 제공',
      target: '모든 소상공인',
      deadline: '연중상시',
      url: 'https://www.sbiz.or.kr',
    },
  ],
  note: '중소벤처24(smes.go.kr) · 소상공인24(sbiz24.kr) 기준',
  source: 'curated',
}

// ── 매출 통합 ─────────────────────────────────────────────────
export const DEMO_PLATFORMS: PlatformSummary[] = [
  {
    id: 'p1',
    key: 'spacecloud',
    name: '스페이스클라우드',
    color: '#3366ff',
    feeRate: 0.1,
    settleCycle: '익월 10일',
    connected: true,
    occupancy: 85,
    vacancy: 15,
    gross: M(420),
    fee: M(42),
    net: M(378),
    bookings: 56,
    netRate: 0.9,
    perBooking: M(6.75),
  },
  {
    id: 'p2',
    key: 'naver',
    name: '네이버 예약',
    color: '#16a34a',
    feeRate: 0.033,
    settleCycle: '결제 후 2일',
    connected: true,
    occupancy: 78,
    vacancy: 22,
    gross: M(250),
    fee: M(8),
    net: M(242),
    bookings: 32,
    netRate: 0.967,
    perBooking: M(7.56),
  },
  {
    id: 'p3',
    key: 'ourplace',
    name: '아워플레이스',
    color: '#f59e0b',
    feeRate: 0.12,
    settleCycle: '익월 15일',
    connected: false,
    occupancy: 68,
    vacancy: 32,
    gross: M(180),
    fee: M(22),
    net: M(158),
    bookings: 22,
    netRate: 0.878,
    perBooking: M(7.18),
  },
]

export const DEMO_PLATFORM_BREAKDOWN: PlatformBreakdown = {
  month: '2026-06',
  breakdown: DEMO_PLATFORMS.map((p) => ({
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

// ── 사업장 정보 ───────────────────────────────────────────────
export const DEMO_BUSINESS = {
  id: 1,
  name: '무드살롱 전주점',
  type: '파티룸',
  ownerName: '김민수',
  yearsOpen: 2,
  lastDataAt: '2026-06-19T04:02:00.000Z',
}
