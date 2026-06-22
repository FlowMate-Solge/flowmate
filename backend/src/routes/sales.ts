import { parse } from 'csv-parse/sync'
import { Router } from 'express'
import multer from 'multer'
import { prisma } from '../lib/prisma.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// GET /api/sales — 매출 내역 조회 (선택적으로 ?platform=key)
router.get('/', async (req, res, next) => {
  try {
    const platformKey = req.query.platform as string | undefined
    const sales = await prisma.sale.findMany({
      where: platformKey ? { platform: { key: platformKey } } : undefined,
      include: { platform: true },
      orderBy: { date: 'desc' },
    })
    res.json(sales)
  } catch (err) {
    next(err)
  }
})

// POST /api/sales — 매출 수동 입력 { platformKey, date, grossAmount, bookings }
router.post('/', async (req, res, next) => {
  try {
    const { platformKey, date, grossAmount, bookings } = req.body as {
      platformKey: string
      date: string
      grossAmount: number
      bookings?: number
    }

    const platform = await prisma.platform.findUnique({ where: { key: platformKey } })
    if (!platform) {
      res.status(404).json({ error: `unknown platform: ${platformKey}` })
      return
    }

    const sale = await prisma.sale.create({
      data: {
        platformId: platform.id,
        date: new Date(date),
        grossAmount,
        bookings: bookings ?? 1,
        source: 'manual',
      },
    })
    res.status(201).json(sale)
  } catch (err) {
    next(err)
  }
})

// POST /api/sales/upload — CSV 업로드 (컬럼: platformKey,date,grossAmount,bookings)
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'file is required (multipart field name: file)' })
      return
    }

    const rows: Array<{ platformKey: string; date: string; grossAmount: string; bookings?: string }> =
      parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true })

    const platforms = await prisma.platform.findMany()
    const byKey = new Map(platforms.map((p) => [p.key, p]))

    let created = 0
    const errors: string[] = []

    for (const row of rows) {
      const platform = byKey.get(row.platformKey)
      if (!platform) {
        errors.push(`unknown platform: ${row.platformKey}`)
        continue
      }
      await prisma.sale.create({
        data: {
          platformId: platform.id,
          date: new Date(row.date),
          grossAmount: Number(row.grossAmount),
          bookings: row.bookings ? Number(row.bookings) : 1,
          source: 'csv',
        },
      })
      created++
    }

    res.status(201).json({ created, errors })
  } catch (err) {
    next(err)
  }
})

export default router
