import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { aiPresets } from '../data/mock'
import { askAi } from '../lib/api'

export default function AiAssistant() {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  async function ask(q: string) {
    if (!q.trim()) return
    setQuestion(q)
    setInput('')
    setOpen(true)
    setAnswer(null)
    setTyping(true)
    try {
      const res = await askAi(q)
      setAnswer(res.answer ?? res.error ?? '답변을 가져오지 못했습니다.')
    } catch {
      setAnswer('AI 비서 호출에 실패했습니다. 백엔드 서버가 실행 중인지 확인하세요.')
    } finally {
      setTyping(false)
    }
  }

  return (
    <div ref={ref} className="relative hidden w-full max-w-md md:block">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 transition focus-within:border-brand-400"
      >
        <Sparkles size={16} className="shrink-0 text-brand-600" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="AI 비서에게 물어보세요 — 예: 이번 달 자금 괜찮아?"
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
        />
        <button
          type="submit"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700"
        >
          <Send size={14} />
        </button>
      </form>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[min(30rem,80vw)] rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink-400">
            <Sparkles size={13} className="text-brand-600" /> FlowMate AI 금융 비서
          </div>

          {question && (
            <div className="mb-2 ml-auto w-fit max-w-[85%] rounded-2xl bg-brand-600 px-3.5 py-2 text-sm text-white">
              {question}
            </div>
          )}

          {(typing || answer) && (
            <div className="flex gap-2.5">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                <Sparkles size={14} />
              </div>
              {typing ? (
                <div className="flex items-center gap-1 rounded-2xl bg-slate-50 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="max-w-[88%] rounded-2xl bg-slate-50 px-4 py-2.5 text-sm leading-relaxed text-ink-900">
                  {answer}
                </div>
              )}
            </div>
          )}

          {!question && (
            <p className="mb-1 text-sm text-ink-500">
              매출·정산·세금 일정을 모두 보고 있어요. 아래 질문을 눌러보세요.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {aiPresets.map((p) => (
              <button
                key={p.q}
                onClick={() => ask(p.q)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {p.q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
