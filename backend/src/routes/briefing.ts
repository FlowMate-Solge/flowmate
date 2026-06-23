import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { buildBriefing } from '../lib/briefing.js'

const router = Router()

// GET /api/briefing/today — 오늘 예상 잔액 / 이번 주 정산 / 임박 세금·고정비 / 공실 위험
router.get('/today', async (_req, res, next) => {
  try {
    const [platforms, fixedCosts, taxReserve] = await Promise.all([
      prisma.platform.findMany({ include: { sales: true } }),
      prisma.fixedCost.findMany({ orderBy: { dayOfMonth: 'asc' } }),
      prisma.taxReserve.findFirst({ orderBy: { updatedAt: 'desc' } }),
    ])
    res.json(buildBriefing(platforms, fixedCosts, taxReserve))
  } catch (err) {
    next(err)
  }
})

export default router
