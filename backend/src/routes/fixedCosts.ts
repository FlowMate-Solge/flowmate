import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

// GET /api/fixed-costs — 등록된 고정비 목록
router.get('/', async (_req, res, next) => {
  try {
    const fixedCosts = await prisma.fixedCost.findMany({ orderBy: { dayOfMonth: 'asc' } })
    res.json(fixedCosts)
  } catch (err) {
    next(err)
  }
})

// POST /api/fixed-costs — 고정비 등록 { item, dayOfMonth, amount }
router.post('/', async (req, res, next) => {
  try {
    const { item, dayOfMonth, amount } = req.body as {
      item: string
      dayOfMonth: number
      amount: number
    }

    if (!item?.trim() || !amount || dayOfMonth < 1 || dayOfMonth > 31) {
      res.status(400).json({ error: 'item, dayOfMonth(1-31), amount are required' })
      return
    }

    const fixedCost = await prisma.fixedCost.create({
      data: { item: item.trim(), dayOfMonth, amount },
    })
    res.status(201).json(fixedCost)
  } catch (err) {
    next(err)
  }
})

export default router
