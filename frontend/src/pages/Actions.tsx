import { useEffect, useState } from 'react'
import { ExternalLink, MapPin, TrendingUp, Wallet } from 'lucide-react'
import { Card, ErrorBanner, PageSkeleton, Pill } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { DEMO_POLICY, DEMO_PRICE, DEMO_STRATEGY } from '../data/demoData'
import {
  getPlatformStrategy, getPolicyFunds, getPriceBenchmark,
  type PlatformStrategy, type PolicyFunds, type PriceBenchmark,
} from '../lib/api'

const toneStyle: Record<PlatformStrategy['tone'], string> = {
  positive: 'border-l-positive',
  warning: 'border-l-warning',
  neutral: 'border-l-brand-400',
}

const fmtWonRaw = (won: number) => `₩${won.toLocaleString('ko-KR')}`

export default function Actions() {
  const { mode } = useAuth()
  const [price, setPrice] = useState<PriceBenchmark | null>(null)
  const [strategies, setStrategies] = useState<PlatformStrategy[] | null>(null)
  const [policy, setPolicy] = useState<PolicyFunds | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (mode === 'demo') {
      setPrice(DEMO_PRICE); setStrategies(DEMO_STRATEGY); setPolicy(DEMO_POLICY)
      return
    }
    setPrice(null); setStrategies(null); setPolicy(null); setError(null)
    Promise.all([getPriceBenchmark(), getPlatformStrategy(), getPolicyFunds()])
      .then(([p, s, f]) => { setPrice(p); setStrategies(s); setPolicy(f) })
      .catch((e) => setError(e.message))
  }, [mode, retryKey])

  if (error) return <ErrorBanner message={error} onRetry={() => setRetryKey((k) => k + 1)} />
  if (!price || !strategies || !policy) return <PageSkeleton />

  const b = price.benchmark
  const pos = (won: number) => ((won - b.low) / (b.high - b.low)) * 100
  const goldenLeft = pos(b.golden - 5000)
  const goldenWidth = pos(b.golden + 5000) - goldenLeft
  const maxShare = Math.max(...price.bands.map((x) => x.share))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">행동 추천</h1>
        <p className="mt-1 text-sm text-ink-400">가격·플랫폼·정책자금 맞춤 제안</p>
      </div>

      {/* 시세 분석 */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-50 text-positive">
            <MapPin size={16} />
          </div>
          <div>
            <Pill tone="positive">상권 시세</Pill>
            <h2 className="mt-0.5 text-base font-extrabold">시간당 대여가 분석</h2>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-ink-400">골든 최적가</div>
            <div className="text-lg font-extrabold text-positive">{fmtWonRaw(b.golden)}</div>
          </div>
        </div>

        {/* 시세 슬라이더 */}
        <div>
          <div className="flex justify-between text-[11px] text-ink-400 mb-2">
            <span>{fmtWonRaw(b.low)}</span>
            <span className="font-semibold text-positive">{fmtWonRaw(b.golden)} 최적</span>
            <span>{fmtWonRaw(b.high)}</span>
          </div>
          <div className="relative h-3 rounded-full bg-slate-100">
            <div className="absolute inset-y-0 rounded-full bg-positive/25"
              style={{ left: `${goldenLeft}%`, width: `${goldenWidth}%` }} />
            <div className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-brand-600 shadow-card"
              style={{ left: `${pos(b.current)}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-ink-500">현재 <b className="text-ink-900">{fmtWonRaw(b.current)}/시</b></span>
            <span className="text-brand-600 font-medium">+{fmtWonRaw(price.headroom)} 인상 여유</span>
          </div>
        </div>

        {/* 가격대 분포 */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="mb-2 text-xs font-medium text-ink-500">소비자 선호 가격대</div>
          <div className="space-y-1.5">
            {price.bands.map((band) => (
              <div key={band.band} className="flex items-center gap-2 text-xs">
                <span className="w-12 shrink-0 text-ink-400">{band.band}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${band.share === maxShare ? 'bg-positive' : 'bg-brand-300'}`}
                    style={{ width: `${band.share}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right font-medium">{band.share}%</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs italic text-ink-400">"{price.insight}"</p>
        </div>
      </Card>

      {/* 오늘의 행동 추천 */}
      <div className="mt-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold">
          <TrendingUp size={16} className="text-brand-600" /> 오늘의 행동 추천
        </h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {strategies.map((s) => (
            <Card key={s.title} className={`border-l-4 ${toneStyle[s.tone]}`}>
              <div className="font-bold text-sm">{s.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{s.body}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* 정책자금 */}
      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-extrabold">
            <Wallet size={16} className="text-warning" /> 정책자금
          </h2>
          {policy.source === 'live' && (
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-positive">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" /> 실시간
            </span>
          )}
        </div>
        <div className="space-y-3">
          {policy.funds.map((p) => (
            <Card key={p.name} className="p-0 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold leading-tight">{p.name}</div>
                    <div className="mt-0.5 text-xs text-brand-600 font-medium">{p.org}</div>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-ink-500">
                    {p.deadline}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-500">{p.desc}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-ink-400">대상: {p.target}</span>
                  <a href={p.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline">
                    신청 <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-400">{policy.note}</p>
      </div>
    </div>
  )
}
