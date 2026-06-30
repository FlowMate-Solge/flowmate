import { prisma } from './prisma.js'
import { analyzeSeasonal, buildForecast, SAFETY_LINE } from './forecast.js'
import { computeHealthScore } from './healthScore.js'

// ─────────────────────────────────────────────────────────────
// AI 금융비서 system 프롬프트 구성 (Phase 5)
// Phase 2~4 데이터(매출·예측·세금·건강점수·전략)를 모아 Claude에게 컨텍스트로 제공.
// ─────────────────────────────────────────────────────────────

const man = (won: number) => Math.round(won / 10_000)
function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// 사장님의 실제 재무 데이터를 요약한 system 프롬프트 문자열을 만든다.
export async function buildSystemPrompt(): Promise<string> {
  const [platforms, fixedCosts, taxReserve] = await Promise.all([
    prisma.platform.findMany({ include: { sales: true } }),
    prisma.fixedCost.findMany({ orderBy: { dayOfMonth: 'asc' } }),
    prisma.taxReserve.findFirst({ orderBy: { updatedAt: 'desc' } }),
  ])

  // 월별 매출 + 최근 달 합계
  const byMonth = new Map<string, { gross: number; net: number }>()
  const platformLines: string[] = []
  let curGross = 0
  let curFee = 0
  let curNet = 0
  let curBookings = 0

  for (const p of platforms) {
    const latest = p.sales.reduce<string | null>((acc, s) => {
      const mk = monthKey(s.date)
      return !acc || mk > acc ? mk : acc
    }, null)
    for (const s of p.sales) {
      const mk = monthKey(s.date)
      const fee = Math.round(s.grossAmount * p.feeRate)
      const acc = byMonth.get(mk) ?? { gross: 0, net: 0 }
      acc.gross += s.grossAmount
      acc.net += s.grossAmount - fee
      byMonth.set(mk, acc)
    }
    const cur = p.sales.filter((s) => monthKey(s.date) === latest)
    const gross = cur.reduce((sum, s) => sum + s.grossAmount, 0)
    const bookings = cur.reduce((sum, s) => sum + s.bookings, 0)
    const fee = Math.round(gross * p.feeRate)
    const net = gross - fee
    curGross += gross
    curFee += fee
    curNet += net
    curBookings += bookings
    platformLines.push(
      `  - ${p.name}: 매출 ${man(gross)}만원, 수수료율 ${(p.feeRate * 100).toFixed(1)}%, 순익률 ${gross > 0 ? ((net / gross) * 100).toFixed(1) : '0'}%, 예약 ${bookings}건, 공실률 ${p.vacancy}%, 정산 ${p.settleCycle}`,
    )
  }

  const months = Array.from(byMonth.entries()).sort(([a], [b]) => (a > b ? 1 : -1))
  const monthlyGross = months.map(([, v]) => v.gross)
  const trendLine = months.map(([m, v]) => `${m.slice(5)}월 ${man(v.gross)}만`).join(', ')

  // 예측
  const forecast = buildForecast(platforms, fixedCosts)
  const seasonal = analyzeSeasonal(months.map(([month, v]) => ({ month, gross: v.gross })))
  const riskLine = forecast.risk
    ? `위험 있음 — ${forecast.risk.startLabel}~${forecast.risk.endLabel} 사이 잔액이 최저 ${man(forecast.risk.lowestBalance)}만원까지 하락. ${forecast.risk.reason}`
    : '향후 30일 안전선 이상 유지(위험 없음)'
  const settleLine = forecast.settlements
    .map((s) => `${s.date.slice(5)} ${s.label} +${man(s.amount)}만`)
    .join(', ')

  // 세금
  const recommended = taxReserve ? Math.round(curGross * taxReserve.rate) : 0
  const taxLine = taxReserve
    ? `${taxReserve.filingType} ${new Date(taxReserve.nextFilingDate).toLocaleDateString('ko-KR')} 예정. 권장 예비금 ${man(recommended)}만원(매출의 ${(taxReserve.rate * 100).toFixed(0)}%), 현재 보유 ${man(taxReserve.currentBalance)}만원, 부족 ${man(Math.max(0, recommended - taxReserve.currentBalance))}만원`
    : '세금 예비금 정보 없음'

  // 건강 점수
  const fixedCostsMonthly = fixedCosts.reduce((s, fc) => s + fc.amount, 0)
  const minBalance = forecast.days.reduce((min, d) => Math.min(min, d.balance), Infinity)
  const health = computeHealthScore({
    monthlyGross,
    currentGross: curGross,
    fixedCostsMonthly,
    minForecastBalance: Number.isFinite(minBalance) ? minBalance : 0,
    safetyLine: SAFETY_LINE,
    taxRecommended: recommended,
    taxCurrent: taxReserve?.currentBalance ?? 0,
  })

  // 전략(추천)
  const fixedLine = fixedCosts.map((fc) => `${fc.item} ${fc.dayOfMonth}일 ${man(fc.amount)}만`).join(', ')

  return [
    '당신은 소상공인 사장님을 돕는 Flozy의 AI 재무 비서입니다.',
    '아래 "사장님의 실제 재무 데이터"에만 근거해 한국어로 답하세요.',
    '',
    '[답변 형식]',
    '- 친근한 대화체로, 핵심부터 1~2문장으로 먼저 말하세요.',
    '- 한 문단은 1~2문장으로 짧게 끊고, 문단 사이는 빈 줄로 나누세요. (벽돌처럼 길게 쓰지 마세요)',
    '- 전체 3~5문장 이내로 간결하게. 숫자는 만원 단위로.',
    '- 마크다운 없이 자연스러운 문장으로. 데이터로 알 수 없는 건 솔직히 모른다고 하세요.',
    '',
    '[이번 달 합계]',
    `  총매출 ${man(curGross)}만원, 플랫폼 수수료 ${man(curFee)}만원, 순익 ${man(curNet)}만원, 예약 ${curBookings}건`,
    '',
    '[플랫폼별]',
    ...platformLines,
    '',
    `[월별 매출 추이] ${trendLine}`,
    '',
    '[현금흐름 예측(향후 30일)]',
    `  시작 잔액 ${man(forecast.startBalance)}만원, 안전선 ${man(forecast.safetyLine)}만원`,
    `  ${riskLine}`,
    `  정산 일정: ${settleLine}`,
    `  계절성: ${seasonal.peakMessage} ${seasonal.prepMessage}`,
    '',
    `[고정비] ${fixedLine}`,
    '',
    `[세금] ${taxLine}`,
    '',
    `[금융 건강 점수] ${health.total}점(${health.grade}) — ` +
      health.factors.map((f) => `${f.label} ${f.score}`).join(', '),
  ].join('\n')
}
