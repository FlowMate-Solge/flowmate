import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, X } from 'lucide-react'
import { aiPresets } from '../data/mock'
import { askAi } from '../lib/api'

function ChatContent({ onClose }: { onClose?: () => void }) {
  const [input, setInput] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)

  async function ask(q: string) {
    if (!q.trim()) return
    setQuestion(q)
    setInput('')
    setAnswer(null)
    setTyping(true)
    try {
      const res = await askAi(q)
      setAnswer(res.answer ?? res.error ?? '답변을 가져오지 못했습니다.')
    } catch {
      setAnswer('AI 비서 호출에 실패했습니다.')
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <Sparkles size={15} className="text-brand-600" /> Flozy AI 재무 비서
        </div>
        {onClose && (
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-ink-400 hover:bg-stone-100">
            <X size={16} />
          </button>
        )}
      </div>

      {/* 대화 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {!question && (
          <p className="text-sm text-ink-400">매출·정산·세금 일정을 모두 보고 있어요. 아래 질문을 눌러보세요.</p>
        )}
        {question && (
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl bg-brand-600 px-3.5 py-2 text-sm text-white">
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
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            ) : (
              <div className="max-w-[88%] rounded-2xl bg-slate-50 px-4 py-2.5 text-sm leading-relaxed text-ink-900">
                {answer}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {aiPresets.map((p) => (
            <button key={p.q} onClick={() => ask(p.q)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition">
              {p.q}
            </button>
          ))}
        </div>
      </div>

      {/* 입력창 */}
      <div className="border-t border-stone-100 px-4 py-3">
        <form onSubmit={(e) => { e.preventDefault(); ask(input) }}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-brand-400 transition">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="궁금한 것을 물어보세요"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400" />
          <button type="submit"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition">
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  )
}

// 데스크톱 — 헤더 드롭다운
export default function AiAssistant() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={ref} className="relative hidden w-full max-w-md md:block">
      <button onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink-400 hover:border-brand-300 transition">
        <Sparkles size={15} className="shrink-0 text-brand-600" />
        AI 비서에게 물어보세요
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[min(30rem,80vw)] rounded-2xl border border-slate-100 bg-white shadow-card overflow-hidden"
          style={{ height: 360 }}>
          <ChatContent onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

// 모바일 — 탭바 버튼 + 바텀시트
export function AiAssistantMobile() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium text-ink-400">
        <Sparkles size={22} strokeWidth={1.8} />
        <span>AI</span>
      </button>

      {open && (
        <>
          {/* 딤 */}
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          {/* 시트 */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-white shadow-xl"
            style={{ height: '75vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-stone-200" />
            <div className="min-h-0 flex-1">
              <ChatContent onClose={() => setOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  )
}
