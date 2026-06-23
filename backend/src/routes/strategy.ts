import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// GET /api/platform-strategy — 수수료율·순익률·예약수를 비교해 룰 기반 추천 문구 생성
router.get('/', async (_req, res, next) => {
  try {
    const platforms = await prisma.platform.findMany({ include: { sales: true } })

    const metrics = platforms
      .map((p) => {
        const latestMonth = p.sales.reduce<string | null>((acc, s) => {
          const mk = monthKey(s.date)
          return !acc || mk > acc ? mk : acc
        }, null)
        const current = p.sales.filter((s) => monthKey(s.date) === latestMonth)
        const gross = current.reduce((sum, s) => sum + s.grossAmount, 0)
        const bookings = current.reduce((sum, s) => sum + s.bookings, 0)
        const fee = Math.round(gross * p.feeRate)
        const net = gross - fee
        return {
          name: p.name,
          feeRate: p.feeRate,
          settleCycle: p.settleCycle,
          gross,
          bookings,
          netRate: gross > 0 ? net / gross : 0,
        }
      })
      .filter((m) => m.gross > 0)

    if (!metrics.length) {
      res.json([])
      return
    }

    const best = metrics.reduce((a, b) => (b.netRate > a.netRate ? b : a))
    const worst = metrics.reduce((a, b) => (b.feeRate > a.feeRate ? b : a))
    const volume = metrics.reduce((a, b) => (b.bookings > a.bookings ? b : a))

    const strategies = [
      {
        title: `${best.name}에 광고비 집중`,
        body: `순익률 ${(best.netRate * 100).toFixed(1)}%로 가장 높습니다. 광고 예산을 늘릴 1순위 채널입니다.`,
        tone: 'positive' as const,
      },
      {
        title: `${worst.name} 비중 축소 검토`,
        body: `수수료 ${(worst.feeRate * 100).toFixed(0)}%로 가장 높은데 예약은 ${worst.bookings}건입니다. 노출 비용 대비 효율을 점검하세요.`,
        tone: 'warning' as const,
      },
      {
        title: `${volume.name}는 볼륨 유지`,
        body: `예약 ${volume.bookings}건으로 물량이 가장 많습니다. 단 정산이 ${volume.settleCycle}이라 현금흐름 시차에 유의하세요.`,
        tone: 'neutral' as const,
      },
    ]

    res.json(strategies)
  } catch (err) {
    next(err)
  }
})

export default router
