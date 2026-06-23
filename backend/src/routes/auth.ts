import { Router } from 'express'

const router = Router()

// POST /api/auth/login — 팀 데모용 단순 비밀번호 인증
router.post('/login', (req, res) => {
  const { password } = req.body as { password?: string }
  const expected = process.env.DEMO_PASSWORD ?? 'flozy2026'
  if (password === expected) {
    res.json({ ok: true })
  } else {
    res.status(401).json({ ok: false, error: '비밀번호가 올바르지 않습니다.' })
  }
})

export default router
