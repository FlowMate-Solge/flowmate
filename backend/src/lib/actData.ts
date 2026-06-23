// ─────────────────────────────────────────────────────────────
// Phase 4 (Act) 정적 데이터
// 시세 벤치마크 / 소비자 선호 가격대 / 정책자금 — MVP는 정적, v2에서 크롤링.
// frontend/src/data/mock.ts 의 priceBenchmark·priceBands·policyFunds 를 대체한다.
// ─────────────────────────────────────────────────────────────

export const priceBenchmark = {
  low: 15_000, // 저가 구간(원/시)
  golden: 25_000, // 골든 최적가(한계 수익점)
  high: 40_000, // 고가 구간
  current: 21_000, // 현재 책정가
  weekendMax: 27_000, // 주말 인상 여력 상한
}

// 소비자 선호 가격대 분포(%)
export const priceBands = [
  { band: '~1만', share: 8 },
  { band: '1~2만', share: 22 },
  { band: '2~3만', share: 41 },
  { band: '3~4만', share: 21 },
  { band: '4만~', share: 8 },
]

export const priceInsight =
  '이 지역 유사 파티룸 예약의 41%가 시간당 2~3만원 구간에서 발생합니다.'

// 기업마당 API 키 없을 때 사용하는 실제 정책자금 데이터
export const policyFunds = [
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
]

export const policyFundNote = '중소벤처24(smes.go.kr) · 소상공인24(sbiz24.kr) 기준'
