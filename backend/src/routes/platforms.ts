import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// GET /api/platforms — 가장 최근 달 기준 플랫폼별 매출/수수료/순익/예약당 순익
router.get('/', async (_req, res, next) => {
  try {
    const platforms = await prisma.platform.findMany({ include: { sales: true } })

    const result = platforms.map((p) => {
      const latestMonth = p.sales.reduce<string | null>((latest, s) => {
        const mk = monthKey(s.date)
        return !latest || mk > latest ? mk : latest
      }, null)
      const currentSales = p.sales.filter((s) => monthKey(s.date) === latestMonth)

      const gross = currentSales.reduce((sum, s) => sum + s.grossAmount, 0)
      const bookings = currentSales.reduce((sum, s) => sum + s.bookings, 0)
      const fee = Math.round(gross * p.feeRate)
      const net = gross - fee

      return {
        id: p.id,
        key: p.key,
        name: p.name,
        color: p.color,
        feeRate: p.feeRate,
        settleCycle: p.settleCycle,
        connected: p.connected,
        occupancy: p.occupancy,
        vacancy: p.vacancy,
        gross,
        fee,
        net,
        bookings,
        netRate: gross > 0 ? net / gross : 0,
        perBooking: bookings > 0 ? Math.round(net / bookings) : 0,
      }
    })

    res.json(result)
  } catch (err) {
    next(err)
  }
})

// POST /api/platforms/:key/connect — 데이터 소스 연결 토글
router.post('/:key/connect', async (req, res, next) => {
  try {
    const platform = await prisma.platform.update({
      where: { key: req.params.key },
      data: { connected: true },
    })
    res.json(platform)
  } catch (err) {
    next(err)
  }
})

export default router
