import { useEffect, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardTitle, PageHeader, Pill } from '../components/ui'
import { fmtMan } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import {
  getDashboardSummary, getPlatformBreakdown, getPlatforms,
  type DashboardSummary, type PlatformBreakdown, type PlatformSummary,
} from '../lib/api'

const toManwon = (won: number) => Math.round(won / 10_000)
const monthLabel = (monthKey: string) => `${Number(monthKey.slice(5))}월`

export default function Sales() {
  const { mode, demo } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [platforms, setPlatforms] = useState<PlatformSummary[] | null>(null)
  const [selIndex, setSelIndex] = useState<number | null>(null)
  const [breakdown, setBreakdown] = useState<PlatformBreakdown | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'demo') {
      setSummary(demo.dashboardSummary)
      setPlatforms(demo.platforms)
      setSelIndex(demo.dashboardSummary.monthlyTrend.length - 1)
      setBreakdown(demo.platformBreakdown)
      return
    }
    Promise.all([getDashboardSummary(), getPlatforms()])
      .then(([s, p]) => { setSummary(s); setPlatforms(p); setSelIndex(s.monthlyTrend.length - 1) })
      .catch((e) => setError(e.message))
  }, [mode, demo])

  const chartData = summary
    ? summary.monthlyTrend.map((m) => ({ month: m.month, label: monthLabel(m.month), gross: toManwon(m.gross), net: toManwon(m.net) }))
    : []

  const selMonthKey = selIndex != null ? chartData[selIndex]?.month : undefined
  const selLabel = selIndex != null ? chartData[selIndex]?.label : ''

  useEffect(() => {
    if (!selMonthKey || mode === 'demo') return
    getPlatformBreakdown(selMonthKey).then(setBreakdown).catch((e) => setError(e.message))
  }, [selMonthKey])

  if (error) return <p className="text-sm text-danger">불러오지 못했습니다: {error}</p>
  if (!summary || !platforms || !breakdown) return <p className="text-sm text-ink-400">불러오는 중...</p>

  const totals = summary.totals
  const monthCount = summary.monthlyTrend.length
  const idx = selIndex ?? monthCount - 1
  const selMonth = summary.monthlyTrend[idx]
  const selGross = selMonth.gross
  const selNet = selMonth.net
  const selFee = Math.max(0, selGross - selNet)
  // 데모는 현재월 플랫폼 분해만 있어, 선택 월 총매출 비율로 스케일해 과거 달도 표현
  const ratio = mode === 'demo' && totals.gross > 0 ? selGross / totals.gross : 1
  // 이번 달/실서버는 실제 플랫폼 분해를 사용하고, 데모의 과거 달은 월별 결정적 편차로
  // 플랫폼 매출 비중이 달마다 달라지도록 선택 월 총매출을 재분배한다.
  const isCurrentMonth = idx === monthCount - 1
  const items =
    mode === 'demo' && !isCurrentMonth
      ? (() => {
          const seed = Number(selMonth.month.slice(5))
          const weights = breakdown.breakdown.map(
            (p, i) => p.gross * (0.7 + (((seed * (i + 2)) % 10) / 10) * 0.6),
          )
          const wSum = weights.reduce((s, w) => s + w, 0) || 1
          return breakdown.breakdown.map((p, i) => {
            const gross = Math.round((selGross * weights[i]) / wSum)
            const fee = Math.round(gross * p.feeRate)
            const net = gross - fee
            return { ...p, gross, fee, net, netRate: gross > 0 ? net / gross : 0 }
          })
        })()
      : breakdown.breakdown
  const shareTotal = items.reduce((s, p) => s + p.gross, 0)
  const avgFeeRate = selGross > 0 ? selFee / selGross : 0
  const selBookings = Math.round(totals.bookings * ratio)
  const connected = platforms.filter((p) => p.connected)
  const avgOccupancy = connected.length
    ? Math.round(connected.reduce((s, p) => s + p.occupancy, 0) / connected.length)
    : 0
  const avgVacancy = 100 - avgOccupancy
  const goPrevMonth = () => setSelIndex(Math.max(0, idx - 1))
  const goNextMonth = () => setSelIndex(Math.min(monthCount - 1, idx + 1))

  return (
    <div>
      {/* 헤더 */}
      <PageHeader title="매출 분석" subtitle="채널별 매출·수수료·순익 비교" />

      {/* 월 이동 */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
        <button
          onClick={goPrevMonth}
          disabled={idx <= 0}
          aria-label="이전 달"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-500 transition hover:bg-slate-50 hover:text-ink-700 disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-bold text-ink-700">
          {selMonth.month.slice(0, 4)}년 {Number(selMonth.month.slice(5))}월 결산
          {idx === monthCount - 1 && (
            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
              이번 달
            </span>
          )}
        </div>
        <button
          onClick={goNextMonth}
          disabled={idx >= monthCount - 1}
          aria-label="다음 달"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-500 transition hover:bg-slate-50 hover:text-ink-700 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 월별 결산 요약 */}
      <Card>
        <CardTitle>{selLabel} 결산 요약</CardTitle>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-400">총 매출 <span className="text-ink-300">예약 {selBookings}건</span></span>
            <span className="text-xl font-extrabold tracking-tight">{fmtMan(toManwon(selGross))}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-ink-400">
              수수료 <Pill tone="danger">{(avgFeeRate * 100).toFixed(1)}%</Pill>
            </span>
            <span className="text-xl font-extrabold tracking-tight text-danger">-{fmtMan(toManwon(selFee))}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm font-medium text-ink-600">실 수익</span>
            <span className="text-2xl font-extrabold tracking-tight text-brand-600">{fmtMan(toManwon(selNet))}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm text-ink-400">월 평균 가동률</span>
            <span className="text-sm font-bold text-positive">
              {avgOccupancy}% <span className="font-medium text-ink-400">· 공실 {avgVacancy}%</span>
            </span>
          </div>
        </div>
      </Card>

      {/* 차트 2열 */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 월별 추이 */}
        <Card>
          <CardTitle>월별 추이</CardTitle>
          <div className="mb-3 flex items-center gap-4 text-xs font-medium text-ink-400">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> 매출</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-positive" /> 순익</span>
            <span className="ml-auto text-[11px]">월 클릭 → 상세</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={chartData} margin={{ left: -8, right: 8 }}
              onClick={(e: any) => { if (e?.activeTooltipIndex != null) setSelIndex(e.activeTooltipIndex) }}
              className="cursor-pointer">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickFormatter={(v) => `${v}만`} tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip formatter={(v: number) => fmtMan(v)} contentStyle={{ borderRadius: 12, border: '1px solid #eef0f4' }} />
              <Bar dataKey="gross" name="매출" radius={[6, 6, 0, 0]} barSize={18}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.label === selLabel ? '#3366ff' : '#c7d6ff'} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="net" name="순익" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* 플랫폼 점유율 */}
        <Card>
          <CardTitle right={<span className="text-xs text-ink-400">{selLabel}</span>}>플랫폼 점유율</CardTitle>
          <div className="flex items-center gap-2">
            <ResponsiveContainer width="55%" height={180}>
              <PieChart>
                <Pie data={items} dataKey="gross" nameKey="name" innerRadius={44} outerRadius={76} paddingAngle={2} stroke="none">
                  {items.map((p) => <Cell key={p.id} fill={p.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtMan(toManwon(v))} contentStyle={{ borderRadius: 12, border: '1px solid #eef0f4' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {items.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name}
                    </span>
                    <span className="font-bold">{shareTotal > 0 ? ((p.gross / shareTotal) * 100).toFixed(1) : '0.0'}%</span>
                  </div>
                  <div className="ml-3.5 text-[11px] text-ink-400">{fmtMan(toManwon(p.gross))}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* 플랫폼별 비교 */}
      <Card className="mt-4">
        <CardTitle right={<span className="text-xs text-ink-400">{selLabel}</span>}>채널별 수익 비교</CardTitle>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={items.map((p) => ({ ...p, net: toManwon(p.net), fee: toManwon(p.fee) }))}
              layout="vertical" margin={{ left: 24, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef0f4" />
              <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={96} fontSize={12} />
              <Tooltip formatter={(v: number) => fmtMan(v)} contentStyle={{ borderRadius: 12, border: '1px solid #eef0f4' }} />
              <Bar dataKey="net" name="순수익" stackId="a" radius={[6, 0, 0, 6]} barSize={16}>
                {items.map((p) => <Cell key={p.id} fill={p.color} />)}
              </Bar>
              <Bar dataKey="fee" name="수수료" stackId="a" fill="#e2e8f0" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>

          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-ink-500">
                <tr>
                  <th className="px-2.5 py-2 text-left font-medium">채널</th>
                  <th className="px-2.5 py-2 text-right font-medium">매출</th>
                  <th className="px-2.5 py-2 text-right font-medium">수수료</th>
                  <th className="px-2.5 py-2 text-right font-medium">순익률</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-2.5 py-2.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
                        <span className="break-keep">{p.name}</span>
                      </div>
                      <div className="mt-0.5 pl-3.5 text-[11px] text-ink-400">{p.settleCycle}</div>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right">{fmtMan(toManwon(p.gross))}</td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-danger">
                      -{fmtMan(toManwon(p.fee))}
                      <div className="text-[11px] text-ink-400">{(p.feeRate * 100).toFixed(1)}%</div>
                    </td>
                    <td className="px-2.5 py-2.5 text-right font-semibold">{(p.netRate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {items.length > 0 && (() => {
          const best = items.reduce((a, b) => (b.netRate > a.netRate ? b : a))
          const worst = items.reduce((a, b) => (b.feeRate > a.feeRate ? b : a))
          return (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
              <ArrowRight size={15} className="shrink-0" />
              <span><b>{best.name}</b> 순익률 {(best.netRate * 100).toFixed(1)}% 최고 · <b>{worst.name}</b> 수수료 {(worst.feeRate * 100).toFixed(0)}% 효율 점검 필요</span>
            </div>
          )
        })()}
      </Card>
    </div>
  )
}
