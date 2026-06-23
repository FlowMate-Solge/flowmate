import { Router } from 'express'
import { priceBands, priceBenchmark, priceInsight } from '../lib/actData.js'

const router = Router()

// GET /api/price-benchmark — 상권 시세 구간 + 소비자 선호 가격대 분포 (정적, MVP)
router.get('/', (_req, res) => {
  res.json({
    benchmark: priceBenchmark,
    headroom: priceBenchmark.golden - priceBenchmark.current, // 골든 최적가 대비 인상 여유(원)
    bands: priceBands,
    insight: priceInsight,
  })
})

export default router
