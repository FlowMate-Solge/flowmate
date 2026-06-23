import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

// GET /api/roi/defaults — 계산기 기본값(가장 최근 입력 또는 0)
router.get('/defaults', async (_req, res, next) => {
  try {
    const latest = await prisma.roiInput.findFirst({ orderBy: { createdAt: 'desc' } })
    res.json(
      latest ?? { investment: 0, monthlyFixed: 0, avgMonthlyNet: 0 },
    )
  } catch (err) {
    next(err)
  }
})

// POST /api/roi/calculate — 투자금/고정비/순수익 → 회수 기간(개월) 계산
// body: { investment, monthlyFixed, avgMonthlyNet } (원 단위)
router.post('/calculate', async (req, res, next) => {
  try {
    const { investment, monthlyFixed, avgMonthlyNet } = req.body as {
      investment: number
      monthlyFixed: number
      avgMonthlyNet: number
    }

    if ([investment, monthlyFixed, avgMonthlyNet].some((v) => typeof v !== 'number' || v < 0)) {
      res.status(400).json({ error: 'investment, monthlyFixed, avgMonthlyNet must be non-negative numbers' })
      return
    }

    const monthlyProfit = avgMonthlyNet - monthlyFixed
    const recoverable = monthlyProfit > 0
    const months = recoverable ? Math.round((investment / monthlyProfit) * 10) / 10 : null

    res.json({ monthlyProfit, recoverable, months })
  } catch (err) {
    next(err)
  }
})

export default router
