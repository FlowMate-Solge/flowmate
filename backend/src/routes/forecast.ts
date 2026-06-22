import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { analyzeSeasonal, buildForecast } from '../lib/forecast.js'

const router = Router()

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// GET /api/forecast/daily-balance — 향후 30일 일별 예상 잔액 + 위험 알림 + 성수기/비수기 신호
router.get('/daily-balance', async (_req, res, next) => {
  try {
    const [platforms, fixedCosts] = await Promise.all([
      prisma.platform.findMany({ include: { sales: true } }),
      prisma.fixedCost.findMany({ orderBy: { dayOfMonth: 'asc' } }),
    ])

    const forecast = buildForecast(platforms, fixedCosts)

    // 월별 매출 추이 → 성수기/비수기 신호
    const byMonth = new Map<string, number>()
    for (const p of platforms) {
      for (const s of p.sales) {
        const mk = monthKey(s.date)
        byMonth.set(mk, (byMonth.get(mk) ?? 0) + s.grossAmount)
      }
    }
    const monthlyGross = Array.from(byMonth.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, gross]) => ({ month, gross }))

    res.json({ ...forecast, seasonal: analyzeSeasonal(monthlyGross) })
  } catch (err) {
    next(err)
  }
})

export default router
