import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { buildForecast, SAFETY_LINE } from '../lib/forecast.js'
import { computeHealthScore } from '../lib/healthScore.js'

const router = Router()

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// GET /api/health-score — 현금흐름·고정비·변동성·연체위험 종합 0~100점
router.get('/', async (_req, res, next) => {
  try {
    const [platforms, fixedCosts, taxReserve] = await Promise.all([
      prisma.platform.findMany({ include: { sales: true } }),
      prisma.fixedCost.findMany(),
      prisma.taxReserve.findFirst({ orderBy: { updatedAt: 'desc' } }),
    ])

    const byMonth = new Map<string, number>()
    for (const p of platforms) {
      for (const s of p.sales) {
        const mk = monthKey(s.date)
        byMonth.set(mk, (byMonth.get(mk) ?? 0) + s.grossAmount)
      }
    }
    const sortedMonths = Array.from(byMonth.entries()).sort(([a], [b]) => (a > b ? 1 : -1))
    const monthlyGross = sortedMonths.map(([, gross]) => gross)
    const currentGross = monthlyGross.at(-1) ?? 0

    const fixedCostsMonthly = fixedCosts.reduce((s, fc) => s + fc.amount, 0)
    const minForecastBalance = buildForecast(platforms, fixedCosts).days.reduce(
      (min, d) => Math.min(min, d.balance),
      Infinity,
    )

    const rate = taxReserve?.rate ?? 0.18
    const result = computeHealthScore({
      monthlyGross,
      currentGross,
      fixedCostsMonthly,
      minForecastBalance: Number.isFinite(minForecastBalance) ? minForecastBalance : 0,
      safetyLine: SAFETY_LINE,
      taxRecommended: Math.round(currentGross * rate),
      taxCurrent: taxReserve?.currentBalance ?? 0,
    })

    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
