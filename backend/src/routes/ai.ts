import { Router } from 'express'
import OpenAI from 'openai'
import { buildSystemPrompt } from '../lib/aiContext.js'

const router = Router()

// 모델은 환경변수로 교체 가능 (기본 gpt-4o-mini — 비용 대비 성능 최적)
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

// POST /api/ai/ask — { question } → 재무 데이터를 system 프롬프트로 구성 → GPT 답변
router.post('/ask', async (req, res, next) => {
  try {
    const { question } = req.body as { question?: string }
    if (!question?.trim()) {
      res.status(400).json({ error: 'question is required' })
      return
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      res.json({
        configured: false,
        answer: 'AI 비서를 사용하려면 백엔드 .env 파일에 OPENAI_API_KEY를 설정하세요.',
      })
      return
    }

    const system = await buildSystemPrompt()
    const client = new OpenAI({ apiKey })

    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: question.trim() },
        ],
      })
      const answer = completion.choices[0]?.message?.content?.trim() ?? ''
      res.json({ configured: true, answer })
    } catch (e) {
      const err = e as { status?: number; message?: string }
      res.status(502).json({
        configured: true,
        error: `OpenAI API 호출 실패 (${err.status ?? '?'}): ${err.message ?? '알 수 없는 오류'}`,
      })
    }
  } catch (err) {
    next(err)
  }
})

export default router
