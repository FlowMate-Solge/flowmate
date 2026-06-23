import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

// GET /api/business — 사업장 정보 + 마지막 데이터 입력일
router.get('/', async (_req, res, next) => {
  try {
    const business = await prisma.business.findFirst()
    if (!business) {
      res.status(404).json({ error: '사업장 정보가 없습니다.' })
      return
    }
    const lastSale = await prisma.sale.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    res.json({ ...business, lastDataAt: lastSale?.createdAt ?? null })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/business — 사업장 정보 수정
router.patch('/', async (req, res, next) => {
  try {
    const { name, type, ownerName, yearsOpen } = req.body as {
      name?: string
      type?: string
      ownerName?: string
      yearsOpen?: number
    }
    const business = await prisma.business.findFirst()
    if (!business) {
      res.status(404).json({ error: '사업장 정보가 없습니다.' })
      return
    }
    const updated = await prisma.business.update({
      where: { id: business.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(ownerName !== undefined && { ownerName }),
        ...(yearsOpen !== undefined && { yearsOpen }),
      },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

export default router
