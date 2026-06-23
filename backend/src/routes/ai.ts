import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from '../lib/aiContext.js'

const router = Router()

// 키는 백엔드에서만 사용한다. 모델은 환경변수로 교체 가능(기본 claude-opus-4-8).
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-8'

// POST /api/ai/ask — { question } → 재무 데이터를 system 프롬프트로 구성 → Claude 답변
router.post('/ask', async (req, res, next) => {
  try {
    const { question } = req.body as { question?: string }
    if (!question?.trim()) {
      res.status(400).json({ error: 'question is required' })
      return
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // 키 미설정 — 키 없이도 동작이 멈추지 않도록 안내만 반환
      res.json({
        configured: false,
        answer:
          'AI 비서를 사용하려면 백엔드 .env 파일에 ANTHROPIC_API_KEY를 설정하세요. (https://console.anthropic.com 에서 발급, 백엔드에서만 사용)',
      })
      return
    }

    const system = await buildSystemPrompt()
    const client = new Anthropic({ apiKey })

    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: question.trim() }],
      })
      const answer = message.content
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('\n')
        .trim()
      res.json({ configured: true, answer })
    } catch (e) {
      const err = e as { status?: number; message?: string }
      res.status(502).json({
        configured: true,
        error: `Claude API 호출 실패 (${err.status ?? '?'}): ${err.message ?? '알 수 없는 오류'}`,
      })
    }
  } catch (err) {
    next(err)
  }
})

export default router
