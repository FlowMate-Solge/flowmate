import { useEffect, useState } from 'react'
import { ChevronRight, ExternalLink, TrendingUp, Wallet } from 'lucide-react'
import { Card, ErrorBanner, PageSkeleton } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { DEMO_POLICY, DEMO_STRATEGY } from '../data/demoData'
import { MY_CURRENT_PRICE, NEARBY_VENUES } from '../data/nearbyVenues'
import {
  getPlatformStrategy, getPolicyFunds,
  type PlatformStrategy, type PolicyFunds,
} from '../lib/api'

const dotTone: Record<PlatformStrategy['tone'], string> = {
  positive: 'bg-positive',
  warning: 'bg-warning',
  neutral: 'bg-brand-400',
}

const fmtWonRaw = (won: number) => `₩${won.toLocaleString('ko-KR')}`

export default function Actions() {
  const { mode, demo } = useAuth()
  const [strategies, setStrategies] = useState<PlatformStrategy[] | null>(null)
  const [policy, setPolicy] = useState<PolicyFunds | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [selFund, setSelFund] = useState<number | null>(0)

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
  if (avgVacancy != null) {
    if (avgVacancy >= 25) {
      golden = Math.round((avg * 0.95) / 1000) * 1000
    } else if (avgVacancy <= 15) {
      golden = Math.round((avg * 1.05) / 1000) * 1000
    }
  }
  const b = { low, high, golden, current }
  const pos = (won: number) => ((won - b.low) / (b.high - b.low)) * 100
  const goldenLeft = pos(b.golden - 1000)
  const goldenWidth = pos(b.golden + 1000) - goldenLeft
  const headroom = b.golden - b.current

  // 주변 매장을 5천원 단위 구간으로 세분화 — 최저~최고 사이만 표시
  const BAND_STEP = 5_000
  const wfmt = (n: number) => n.toLocaleString('ko-KR')
  const bandEdges = [low]
  for (let m = Math.ceil((low + 1) / BAND_STEP) * BAND_STEP; m < high; m += BAND_STEP) bandEdges.push(m)
  bandEdges.push(high)
  const priceBands = bandEdges.slice(0, -1).map((start, i) => {
    const end = bandEdges[i + 1]
    const isLast = i === bandEdges.length - 2
    const count = NEARBY_VENUES.filter(
      (v) => v.pricePerHour >= start && (isLast ? v.pricePerHour <= end : v.pricePerHour < end),
    ).length
    return { band: `${wfmt(start)}~${wfmt(end)}`, share: Math.round((count / NEARBY_VENUES.length) * 100), count }
  })
  const maxShare = Math.max(...priceBands.map((x) => x.share))

  const selectedFund = selFund != null ? policy.funds[Math.min(selFund, policy.funds.length - 1)] : null

  const renderFundDetailBody = (f: (typeof policy.funds)[number]) => (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-keep text-base font-extrabold leading-tight sm:text-lg">{f.name}</div>
          <div className="mt-1 text-sm font-medium text-brand-600">{f.org}</div>
        </div>
        <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink-500">
          {f.deadline}
        </span>
      </div>
      <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
        <div className="text-xs text-ink-400">지원 대상</div>
        <div className="mt-0.5 break-keep text-sm font-medium text-ink-700">{f.target}</div>
      </div>
      <p className="mt-3 break-keep text-sm leading-relaxed text-ink-600">{f.desc}</p>
      <a
        href={f.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-slate-50"
      >
        원문 바로가기 <ExternalLink size={14} />
      </a>
    </>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">행동 추천</h1>
        <p className="mt-1 text-sm text-ink-400">가격·플랫폼·정책자금 맞춤 제안</p>
      </div>

      {/* 시세 분석 */}
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">상권 분석 (시간당 대여가)</h2>
          <div className="shrink-0 rounded-xl bg-amber-50 px-3 py-1.5 text-right">
            <div className="text-[11px] font-medium text-amber-600">골든 최적가</div>
            <div className="text-lg font-extrabold text-amber-600">{fmtWonRaw(b.golden)}</div>
          </div>
        </div>

        {/* 시세 슬라이더 */}
        <div>
          <div className="flex justify-between text-[11px] text-ink-400 mb-2">
            <span>{fmtWonRaw(b.low)}</span>
            <span className="font-semibold text-amber-600">{fmtWonRaw(b.golden)} 최적</span>
            <span>{fmtWonRaw(b.high)}</span>
          </div>
          <div className="relative h-3 rounded-full bg-slate-100">
            <div className="absolute inset-y-0 rounded-full bg-amber-400/40"
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

        {/* 주변 매장 가격대 분포 */}
        <div className="mt-4 border-t border-slate-100 pt-3.5">
          <div className="mb-2.5 text-sm font-extrabold text-ink-800">주변 매장 가격대 분포</div>
          <div className="space-y-2">
            {priceBands.map((band) => {
              const top = band.share === maxShare
              return (
                <div key={band.band} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs font-bold text-ink-800">{band.band}원</span>
                  <div className="h-3.5 flex-1 rounded-lg bg-slate-100">
                    <div
                      className={`h-3.5 rounded-lg ${top ? 'bg-positive' : 'bg-brand-500'}`}
                      style={{ width: `${Math.max(band.share, 4)}%` }}
                    />
                  </div>
                  <span
                    className={`w-10 shrink-0 text-right text-sm font-extrabold ${top ? 'text-positive' : 'text-ink-900'}`}
                  >
                    {band.share}%
                  </span>
                  <span className="w-9 shrink-0 text-right text-[11px] text-ink-400">{band.count}곳</span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* 오늘의 행동 추천 */}
      <div className="mt-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
          <TrendingUp size={16} className="text-brand-600" /> 오늘의 제안
        </h2>
        <div className="card divide-y divide-brand-100/70 border-brand-100 bg-brand-50/60">
          {strategies.map((s) => (
            <div key={s.title} className="flex gap-3 p-4">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotTone[s.tone]}`} />
              <div className="min-w-0">
                <div className="break-keep text-sm font-extrabold text-ink-900">{s.title}</div>
                <p className="mt-1 break-keep text-sm leading-relaxed text-ink-600">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 정책자금 */}
      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Wallet size={16} className="text-warning" /> 정책자금
          </h2>
          {policy.source === 'live' && (
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-positive">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" /> 실시간
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
          {/* 좌측 리스트 (모바일에선 선택 항목 아래로 상세가 펼쳐짐) */}
          <div className="space-y-2">
            {policy.funds.map((p, i) => {
              const isSel = i === selFund
              return (
                <div key={p.name}>
                  <button
                    onClick={() => setSelFund((prev) => (prev === i ? null : i))}
                    className={`w-full border px-3 py-2.5 text-left transition ${
                      isSel
                        ? 'rounded-xl border-brand-400 bg-brand-50 lg:rounded-xl'
                        : 'rounded-xl border-slate-200 bg-white hover:bg-slate-50'
                    } ${isSel ? 'max-lg:rounded-b-none' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className={`truncate text-sm font-bold ${isSel ? 'text-brand-700' : 'text-ink-800'}`}>
                          {p.name}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] font-medium text-ink-400">{p.org}</div>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`shrink-0 transition ${isSel ? 'rotate-90 text-brand-500 lg:rotate-0' : 'text-ink-300'}`}
                      />
                    </div>
                  </button>
                  {/* 모바일: 선택 항목 바로 아래에 붙는 상세 (부모-자식 세트) */}
                  {isSel && (
                    <div className="rounded-b-xl border border-t-0 border-brand-400 bg-white p-4 lg:hidden">
                      {renderFundDetailBody(p)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 데스크톱: 우측 상세 */}
          {selectedFund ? (
            <Card className="hidden lg:block">{renderFundDetailBody(selectedFund)}</Card>
          ) : (
            <Card className="hidden place-items-center text-sm text-ink-400 lg:grid">
              왼쪽에서 정책자금을 선택하세요
            </Card>
          )}
        </div>
        <p className="mt-3 text-[11px] text-ink-400">{policy.note}</p>
      </div>
    </div>
  )
}
