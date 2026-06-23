import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// 가장 최근 달의 총매출(원)
async function currentMonthlyRevenue() {
  const sales = await prisma.sale.findMany()
  const byMonth = new Map<string, number>()
  for (const s of sales) {
    const mk = monthKey(s.date)
    byMonth.set(mk, (byMonth.get(mk) ?? 0) + s.grossAmount)
  }
  const latest = Array.from(byMonth.keys()).sort().at(-1)
  return latest ? byMonth.get(latest)! : 0
}

function withDerived(reserve: { rate: number; currentBalance: number } & Record<string, unknown>, monthlyRevenue: number) {
  const recommended = Math.round(monthlyRevenue * reserve.rate)
  return {
    ...reserve,
    monthlyRevenue,
    recommended,
    shortfall: Math.max(0, recommended - reserve.currentBalance),
  }
}

// GET /api/tax-reserve — 권장 예비금 vs 현재 보유액
router.get('/', async (_req, res, next) => {
  try {
    const [reserve, monthlyRevenue] = await Promise.all([
      prisma.taxReserve.findFirst({ orderBy: { updatedAt: 'desc' } }),
      currentMonthlyRevenue(),
    ])
    if (!reserve) {
      res.status(404).json({ error: 'no tax reserve configured' })
      return
    }
    res.json(withDerived(reserve, monthlyRevenue))
  } catch (err) {
    next(err)
  }
})

// POST /api/tax-reserve — 보유액/비율 갱신 { currentBalance, rate? }
router.post('/', async (req, res, next) => {
  try {
    const { currentBalance, rate } = req.body as { currentBalance?: number; rate?: number }
    if (typeof currentBalance !== 'number' || currentBalance < 0) {
      res.status(400).json({ error: 'currentBalance must be a non-negative number' })
      return
    }

    const existing = await prisma.taxReserve.findFirst({ orderBy: { updatedAt: 'desc' } })
    if (!existing) {
      res.status(404).json({ error: 'no tax reserve configured' })
      return
    }

    const updated = await prisma.taxReserve.update({
      where: { id: existing.id },
      data: { currentBalance, ...(typeof rate === 'number' ? { rate } : {}) },
    })

    res.json(withDerived(updated, await currentMonthlyRevenue()))
  } catch (err) {
    next(err)
  }
})

export default router
