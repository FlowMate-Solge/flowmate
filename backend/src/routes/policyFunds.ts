import { Router } from 'express'
import { policyFundNote, policyFunds } from '../lib/actData.js'

const router = Router()

// GET /api/policy-funds — 정책자금 안내 (정적, MVP)
router.get('/', (_req, res) => {
  res.json({ funds: policyFunds, note: policyFundNote })
})

export default router
