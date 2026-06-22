import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// GET /api/dashboard/summary — 전체 합계(최근 달) + 월별 매출/순익 추이
router.get('/summary', async (_req, res, next) => {
  try {
    const sales = await prisma.sale.findMany({ include: { platform: true } })

    const byMonth = new Map<string, { gross: number; net: number }>()
    for (const s of sales) {
      const mk = monthKey(s.date)
      const fee = Math.round(s.grossAmount * s.platform.feeRate)
      const net = s.grossAmount - fee
      const acc = byMonth.get(mk) ?? { gross: 0, net: 0 }
      acc.gross += s.grossAmount
      acc.net += net
      byMonth.set(mk, acc)
    }

    const monthlyTrend = Array.from(byMonth.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, v]) => ({ month, gross: v.gross, net: v.net }))

    const latestMonth = monthlyTrend.at(-1)?.month
    const currentSales = sales.filter((s) => monthKey(s.date) === latestMonth)

    const totals = currentSales.reduce(
      (acc, s) => {
        const fee = Math.round(s.grossAmount * s.platform.feeRate)
        acc.gross += s.grossAmount
        acc.fee += fee
        acc.net += s.grossAmount - fee
        acc.bookings += s.bookings
        return acc
      },
      { gross: 0, fee: 0, net: 0, bookings: 0 },
    )

    res.json({ totals, monthlyTrend })
  } catch (err) {
    next(err)
  }
})

export default router
