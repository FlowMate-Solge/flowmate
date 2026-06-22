// ─────────────────────────────────────────────────────────────
// 금융 건강 점수 (Phase 3 / MVP)
// 현금흐름 안정성·고정비 비율·매출 변동성·연체 위험을 룰 기반으로 0~100점 종합.
// frontend mock.ts 의 healthScore 를 데이터 기반으로 대체한다.
// ─────────────────────────────────────────────────────────────

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
const man = (won: number) => Math.round(won / 10_000)

export interface HealthFactor {
  label: string
  score: number
  note: string
}
export interface HealthScore {
  total: number
  grade: string
  factors: HealthFactor[]
}

export interface HealthInput {
  monthlyGross: number[] // 월별 매출(원)
  currentGross: number // 이번 달 매출(원)
  fixedCostsMonthly: number // 월 고정비 합계(원)
  minForecastBalance: number // 예측 최저 잔액(원)
  safetyLine: number // 안전 잔액선(원)
  taxRecommended: number // 권장 세금 예비금(원)
  taxCurrent: number // 현재 세금통장 잔액(원)
}

function grade(total: number) {
  if (total >= 80) return '우수'
  if (total >= 65) return '양호'
  if (total >= 45) return '보통'
  return '주의'
}

export function computeHealthScore(input: HealthInput): HealthScore {
  // 1) 현금흐름 안정성 — 예측 최저 잔액이 안전선 대비 얼마나 여유 있는가
  const cashRatio = input.minForecastBalance / input.safetyLine
  const cashflow = clamp(60 + cashRatio * 20)

  // 2) 고정비 비율 — 매출 대비 고정비가 낮을수록 좋음
  const fixedRatio = input.currentGross > 0 ? input.fixedCostsMonthly / input.currentGross : 1
  const fixedCost = clamp(100 - fixedRatio * 80)

  // 3) 매출 변동성 — 변동계수(표준편차÷평균)가 낮을수록 좋음
  const mean = input.monthlyGross.reduce((s, g) => s + g, 0) / Math.max(1, input.monthlyGross.length)
  const variance =
    input.monthlyGross.reduce((s, g) => s + (g - mean) ** 2, 0) / Math.max(1, input.monthlyGross.length)
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0
  const volatility = clamp(100 - cv * 200)

  // 4) 연체 위험 — 최저 잔액이 충분하고 세금 예비금이 확보될수록 좋음
  const taxCoverage = input.taxRecommended > 0 ? input.taxCurrent / input.taxRecommended : 1
  const arrears = clamp(40 + (input.minForecastBalance >= 0 ? 30 : 0) + taxCoverage * 30)

  const factors: HealthFactor[] = [
    {
      label: '현금흐름 안정성',
      score: cashflow,
      note:
        input.minForecastBalance < input.safetyLine
          ? `예측 최저 잔액 ${man(input.minForecastBalance)}만원 — 위험 구간 존재`
          : `예측 최저 잔액 ${man(input.minForecastBalance)}만원 — 안전선 이상`,
    },
    {
      label: '고정비 비율',
      score: fixedCost,
      note: `매출 대비 고정비 ${Math.round(fixedRatio * 100)}%`,
    },
    {
      label: '매출 변동성',
      score: volatility,
      note: `성수기·비수기 편차 (변동계수 ${cv.toFixed(2)})`,
    },
    {
      label: '연체 위험',
      score: arrears,
      note: `세금 예비금 확보율 ${Math.round(taxCoverage * 100)}%`,
    },
  ]

  const total = clamp(factors.reduce((s, f) => s + f.score, 0) / factors.length)
  return { total, grade: grade(total), factors }
}
