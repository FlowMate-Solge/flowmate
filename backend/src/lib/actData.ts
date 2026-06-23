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

export const policyFunds = [
  { name: '소상공인 운전자금', desc: '최대 5천만원 · 연 2.7~3.5%' },
  { name: '시설개선 자금', desc: '최대 1억원 · 연 2.5%' },
  { name: '신용보증재단 특례보증', desc: '신용등급 무관 · 연 3.0%' },
]

export const policyFundNote = '소상공인진흥공단 기준 · 신청 조건은 상담 필요'
