import { useEffect, useState } from 'react'
import { ExternalLink, MapPin, TrendingUp, Wallet } from 'lucide-react'
import { Card, ErrorBanner, PageSkeleton, Pill } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { DEMO_POLICY, DEMO_STRATEGY } from '../data/demoData'
import { MY_CURRENT_PRICE, NEARBY_VENUES, SURVEYED_AREA, SURVEYED_AT } from '../data/nearbyVenues'
import {
  getPlatformStrategy, getPolicyFunds,
  type PlatformStrategy, type PolicyFunds,
} from '../lib/api'

const toneStyle: Record<PlatformStrategy['tone'], string> = {
  positive: 'border-l-positive',
  warning: 'border-l-warning',
  neutral: 'border-l-brand-400',
}

const fmtWonRaw = (won: number) => `₩${won.toLocaleString('ko-KR')}`

export default function Actions() {
  const { mode, demo } = useAuth()
  const [strategies, setStrategies] = useState<PlatformStrategy[] | null>(null)
  const [policy, setPolicy] = useState<PolicyFunds | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (mode === 'demo') {
      setStrategies(DEMO_STRATEGY); setPolicy(DEMO_POLICY)
      return
    }
    setStrategies(null); setPolicy(null); setError(null)
    Promise.all([getPlatformStrategy(), getPolicyFunds()])
      .then(([s, f]) => { setStrategies(s); setPolicy(f) })
      .catch((e) => setError(e.message))
  }, [mode, retryKey])

  if (error) return <ErrorBanner message={error} onRetry={() => setRetryKey((k) => k + 1)} />
  if (!strategies || !policy) return <PageSkeleton />

  // 시세 계산기: 주변 매장 시세(큐레이션 데이터) 기반 적정가 분석
  const venuePrices = NEARBY_VENUES.map((v) => v.pricePerHour)
  const low = Math.min(...venuePrices)
  const high = Math.max(...venuePrices)
  const avg = Math.round(venuePrices.reduce((s, p) => s + p, 0) / venuePrices.length)
  const current = MY_CURRENT_PRICE

  const avgVacancy =
    mode === 'demo' && demo.platforms.length
      ? Math.round(demo.platforms.reduce((s, p) => s + p.vacancy, 0) / demo.platforms.length)
      : null

  let golden = avg
  let vacancyNote = ''
  if (avgVacancy != null) {
    if (avgVacancy >= 25) {
      golden = Math.round((avg * 0.95) / 1000) * 1000
      vacancyNote = ` 평균 공실률이 ${avgVacancy}%로 높은 편이라 평균보다 살짝 낮게 제안합니다.`
    } else if (avgVacancy <= 15) {
      golden = Math.round((avg * 1.05) / 1000) * 1000
      vacancyNote = ` 평균 공실률이 ${avgVacancy}%로 낮아 평균보다 살짝 높게 제안합니다.`
    } else {
      vacancyNote = ' 공실률이 안정적인 편이라 평균 시세를 그대로 제안합니다.'
    }
  }
  const insight = `${SURVEYED_AREA} 인근 ${NEARBY_VENUES.length}곳 평균은 ${fmtWonRaw(avg)}입니다 (${SURVEYED_AT} 조사 기준).${vacancyNote}`

  const b = { low, high, golden, current }
  const pos = (won: number) => ((won - b.low) / (b.high - b.low)) * 100
  const goldenLeft = pos(b.golden - 1000)
  const goldenWidth = pos(b.golden + 1000) - goldenLeft
  const headroom = b.golden - b.current
  const maxBar = Math.max(high, current)

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
            <span className={`font-medium ${headroom >= 0 ? 'text-brand-600' : 'text-danger'}`}>
              {headroom >= 0 ? `+${fmtWonRaw(headroom)} 인상 여유` : `${fmtWonRaw(headroom)} 인하 검토`}
            </span>
          </div>
        </div>

        {/* 주변 매장 시세 */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="mb-2 text-xs font-medium text-ink-500">주변 매장 시세</div>
          <div className="space-y-1.5">
            {NEARBY_VENUES.map((v) => (
              <div key={v.name} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0 truncate text-ink-400">{v.name}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${v.pricePerHour === high ? 'bg-positive' : 'bg-brand-300'}`}
                    style={{ width: `${(v.pricePerHour / maxBar) * 100}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right font-medium">{fmtWonRaw(v.pricePerHour)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs italic text-ink-400">"{insight}"</p>
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
