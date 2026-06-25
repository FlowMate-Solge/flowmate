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

    // 매출은 월별 합계로만 저장돼 일별 실데이터가 없어, 요일 패턴으로 분산해 일별 기록을 합성한다.
    const WEEKDAY_FACTOR = [1.1, 0.6, 0.5, 0.7, 1.0, 1.5, 1.6] // 0=일 … 6=토
    const DAILY_WINDOW = 35
    const feeRate = totals.gross > 0 ? totals.fee / totals.gross : 0
    const avgGross = totals.gross / 30
    const avgBookings = totals.bookings / 30
    const base = new Date()
    const days = [] as { date: string; gross: number; fee: number; net: number; bookings: number }[]
    for (let i = DAILY_WINDOW - 1; i >= 0; i--) {
      const d = new Date(base)
      d.setDate(d.getDate() - i)
      const wf = WEEKDAY_FACTOR[d.getDay()]
      const jitter = 1 + (((d.getDate() % 5) - 2) * 0.06)
      const gross = Math.max(0, Math.round((avgGross * wf * jitter) / 10_000)) * 10_000
      const fee = Math.round(gross * feeRate)
      days.push({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        gross,
        fee,
        net: gross - fee,
        bookings: Math.max(1, Math.round(avgBookings * wf * jitter)),
      })
    }
    const today = days[days.length - 1]

    res.json({ totals, today, days, monthlyTrend })
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
