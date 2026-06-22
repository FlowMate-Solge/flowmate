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

// GET /api/dashboard/platform-breakdown?month=YYYY-MM — 특정 월의 플랫폼별 매출/수수료/순익 분해
// month를 안 주면 가장 최근 달을 사용
router.get('/platform-breakdown', async (req, res, next) => {
  try {
    const platforms = await prisma.platform.findMany({ include: { sales: true } })

    const requestedMonth = req.query.month as string | undefined
    const allMonths = new Set(platforms.flatMap((p) => p.sales.map((s) => monthKey(s.date))))
    const targetMonth = requestedMonth ?? Array.from(allMonths).sort().at(-1)

    const breakdown = platforms.map((p) => {
      const monthSales = p.sales.filter((s) => monthKey(s.date) === targetMonth)
      const gross = monthSales.reduce((sum, s) => sum + s.grossAmount, 0)
      const fee = Math.round(gross * p.feeRate)
      const net = gross - fee
      return {
        id: p.id,
        key: p.key,
        name: p.name,
        color: p.color,
        feeRate: p.feeRate,
        settleCycle: p.settleCycle,
        gross,
        fee,
        net,
        netRate: gross > 0 ? net / gross : 0,
      }
    })

    res.json({ month: targetMonth ?? null, breakdown })
  } catch (err) {
    next(err)
  }
})

export default router
