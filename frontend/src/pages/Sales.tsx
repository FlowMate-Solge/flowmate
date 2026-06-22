import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowRight, CircleAlert, MousePointerClick, TrendingUp } from 'lucide-react'
import { Card, CardTitle, Pill } from '../components/ui'
import { fmtMan, fmtWon } from '../data/mock'
import {
  getDashboardSummary,
  getPlatformBreakdown,
  getPlatforms,
  type DashboardSummary,
  type PlatformBreakdown,
  type PlatformSummary,
} from '../lib/api'

function Row({
  label,
  value,
  valueClass = '',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  )
}

const ranges = ['최근 6개월 추이', '연간 추이'] as const

// 백엔드 grossAmount/fee/net은 원 단위, 차트 표시는 만원 단위라 변환
const toManwon = (won: number) => Math.round(won / 10_000)
const monthLabel = (monthKey: string) => `${Number(monthKey.slice(5))}월`

export default function Sales() {
  const [range, setRange] = useState<(typeof ranges)[number]>(ranges[0])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [platforms, setPlatforms] = useState<PlatformSummary[] | null>(null)
  const [selIndex, setSelIndex] = useState<number | null>(null)
  const [breakdown, setBreakdown] = useState<PlatformBreakdown | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getDashboardSummary(), getPlatforms()])
      .then(([s, p]) => {
        setSummary(s)
        setPlatforms(p)
        setSelIndex(s.monthlyTrend.length - 1)
      })
      .catch((e) => setError(e.message))
  }, [])

  const chartData = summary
    ? summary.monthlyTrend.map((m) => ({
        month: m.month,
        label: monthLabel(m.month),
        gross: toManwon(m.gross),
        net: toManwon(m.net),
      }))
    : []

  const selMonthKey = selIndex != null ? chartData[selIndex]?.month : undefined
  const selLabel = selIndex != null ? chartData[selIndex]?.label : ''

  useEffect(() => {
    if (!selMonthKey) return
    getPlatformBreakdown(selMonthKey)
      .then(setBreakdown)
      .catch((e) => setError(e.message))
  }, [selMonthKey])

  if (error) {
    return <p className="text-sm text-danger">매출 데이터를 불러오지 못했습니다: {error}</p>
  }
  if (!summary || !platforms || !breakdown) {
    return <p className="text-sm text-ink-400">불러오는 중...</p>
  }

  const items = breakdown.breakdown
  const shareTotal = items.reduce((s, p) => s + p.gross, 0)
  const avgFeeRate =
    platforms.reduce((s, p) => s + p.fee, 0) / platforms.reduce((s, p) => s + p.gross, 0)
  const totals = summary.totals

  return (
    <div>
      {/* 헤더 + 기간 토글 */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            매출 통합 분석 대시보드 📊
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            여러 채널에 흩어진 매출과 대여 플랫폼 수수료를 한눈에 대조합니다.
          </p>
        </div>
        <div className="flex shrink-0 rounded-xl bg-slate-100 p-1 text-xs font-medium">
          {ranges.map((t) => (
            <button
              key={t}
              onClick={() => setRange(t)}
              className={`rounded-lg px-3 py-1.5 transition ${
                range === t
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-400 hover:text-ink-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 통합 금전 출납 결산 */}
      <Card>
        <CardTitle
          right={<span className="text-xs text-ink-400">Real-time stats</span>}
        >
          통합 금전 출납 결산 ({selLabel} 전체)
        </CardTitle>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <div className="text-sm text-ink-500">통합 총매출액(세전)</div>
            <div className="mt-1 text-3xl font-extrabold tracking-tight">
              {fmtWon(totals.gross)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs font-medium text-positive">
              <TrendingUp size={12} /> 예약 {totals.bookings}건
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-ink-500">
              플랫폼 총 수수료{' '}
              <Pill tone="danger">평균 {(avgFeeRate * 100).toFixed(1)}%</Pill>
            </div>
            <div className="mt-1 text-3xl font-extrabold tracking-tight text-danger">
              {fmtWon(totals.fee)}
            </div>
          </div>

          <div>
            <div className="text-sm text-ink-500">최종 순익 자금유입</div>
            <div className="mt-1 text-3xl font-extrabold tracking-tight text-brand-600">
              {fmtWon(totals.net)}
            </div>
            <div className="mt-1 text-xs text-ink-400">수수료 공제 후 실수입</div>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-ink-700">
          <CircleAlert size={16} className="mt-0.5 shrink-0 text-warning" />
          <span>
            플랫폼 평균 수수료율 {(avgFeeRate * 100).toFixed(1)}%입니다. 수수료가 낮고
            예약 효율이 좋은 플랫폼 비중을 늘리는 것을 검토하세요.
          </span>
        </div>
      </Card>

      {/* 월별 수익 종합 추이(컨트롤러) + 플랫폼별 점유율 */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 월별 수익 종합 추이 */}
        <Card>
          <CardTitle
            right={
              <span className="inline-flex items-center gap-1 text-xs text-brand-600">
                <MousePointerClick size={13} /> 월을 클릭해 기간 선택
              </span>
            }
          >
            월별 수익 종합 추이
          </CardTitle>
          <p className="-mt-2 mb-3 text-xs text-ink-400">
            월을 누르면 아래 <b className="text-ink-700">플랫폼별 수익 비교·점유율</b>이
            해당 월로 바뀝니다. (선택: {selLabel})
          </p>
          <div className="mb-2 flex items-center justify-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-brand-500" /> 정산 순익
            </span>
            <span className="flex items-center gap-1.5 text-ink-400">
              <span className="h-0 w-4 border-t-2 border-dashed border-slate-300" /> 총매출액
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={chartData}
              margin={{ left: -8, right: 8 }}
              onClick={(e: any) => {
                if (e && e.activeTooltipIndex != null) setSelIndex(e.activeTooltipIndex)
              }}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis
                tickFormatter={(v) => `${v}만`}
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <Tooltip
                formatter={(v: number) => fmtMan(v)}
                contentStyle={{ borderRadius: 12, border: '1px solid #eef0f4' }}
              />
              <ReferenceLine
                x={selLabel}
                stroke="#1f47f5"
                strokeDasharray="4 3"
                strokeOpacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="gross"
                name="총매출액"
                stroke="#cbd5e1"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="정산 순익"
                stroke="#3366ff"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* 플랫폼별 점유율 (파이) */}
        <Card>
          <CardTitle
            right={
              <span className="text-xs text-ink-400">{selLabel} · 매출 점유율</span>
            }
          >
            플랫폼별 점유율
          </CardTitle>
          <div className="flex items-center gap-2">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={items}
                  dataKey="gross"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={82}
                  paddingAngle={2}
                  stroke="none"
                >
                  {items.map((p) => (
                    <Cell key={p.id} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => fmtMan(toManwon(v))}
                  contentStyle={{ borderRadius: 12, border: '1px solid #eef0f4' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {items.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: p.color }}
                      />
                      {p.name}
                    </span>
                    <span className="font-bold">
                      {shareTotal > 0 ? ((p.gross / shareTotal) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <div className="ml-4.5 text-[11px] text-ink-400">
                    {fmtMan(toManwon(p.gross))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* 플랫폼별 수익 비교 (선택 월 연동) */}
      <Card className="mt-4">
        <CardTitle
          right={
            <span className="text-xs text-ink-400">순익률 = 순수익 ÷ 매출</span>
          }
        >
          플랫폼별 수익 비교 · {selLabel}
        </CardTitle>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{
                    background: 'linear-gradient(90deg,#3366ff,#16a34a,#f59e0b)',
                  }}
                />{' '}
                순수익 (플랫폼별)
              </span>
              <span className="flex items-center gap-1.5 text-ink-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" /> 플랫폼 수수료 귀속액
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={items.map((p) => ({ ...p, net: toManwon(p.net), fee: toManwon(p.fee) }))}
                layout="vertical"
                margin={{ left: 24, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef0f4" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={96}
                  fontSize={12}
                />
                <Tooltip
                  formatter={(v: number) => fmtMan(v)}
                  contentStyle={{ borderRadius: 12, border: '1px solid #eef0f4' }}
                />
                <Bar
                  dataKey="net"
                  name="순수익"
                  stackId="a"
                  radius={[6, 0, 0, 6]}
                  barSize={18}
                >
                  {items.map((p) => (
                    <Cell key={p.id} fill={p.color} />
                  ))}
                </Bar>
                <Bar
                  dataKey="fee"
                  name="플랫폼 수수료 귀속액"
                  stackId="a"
                  fill="#e2e8f0"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-ink-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">플랫폼</th>
                  <th className="px-3 py-2 text-right font-medium">매출</th>
                  <th className="px-3 py-2 text-right font-medium">수수료</th>
                  <th className="px-3 py-2 text-right font-medium">순익률</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 font-medium">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: p.color }}
                        />
                        {p.name}
                      </div>
                      <div className="ml-4.5 pl-0.5 text-[11px] text-ink-400">
                        정산 {p.settleCycle}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">{fmtMan(toManwon(p.gross))}</td>
                    <td className="px-3 py-2.5 text-right text-danger">
                      -{fmtMan(toManwon(p.fee))}
                      <div className="text-[11px] text-ink-400">
                        {(p.feeRate * 100).toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold">
                      {(p.netRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
            <ArrowRight size={16} className="shrink-0" />
            <span>
              {(() => {
                const best = items.reduce((a, b) => (b.netRate > a.netRate ? b : a))
                const worst = items.reduce((a, b) => (b.feeRate > a.feeRate ? b : a))
                return (
                  <>
                    <b>{best.name}</b>의 순익률이 {(best.netRate * 100).toFixed(1)}%로 가장
                    높습니다. 수수료 {(worst.feeRate * 100).toFixed(0)}%인{' '}
                    <b>{worst.name}</b>은 효율 점검이 필요합니다.
                  </>
                )
              })()}
            </span>
          </div>
        )}
      </Card>

      {/* 수수료 구조 및 정산 정밀 대조 */}
      <div className="mt-6">
        <h2 className="text-lg font-extrabold">수수료 구조 및 정산 정밀 대조</h2>
        <p className="mb-3 mt-1 text-sm text-ink-400">
          각 채널별 운영 사이클 및 조건값 리스트입니다.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {platforms.map((c) => (
            <Card key={c.id}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-bold">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: c.color }}
                  />
                  {c.name}
                </div>
                <Pill tone="neutral">{c.settleCycle}</Pill>
              </div>
              <div className="space-y-2.5 text-sm">
                <Row label="이번 달 매출액" value={fmtWon(c.gross)} />
                <Row
                  label="플랫폼 수수료율"
                  value={`${(c.feeRate * 100).toFixed(0)}%`}
                  valueClass="text-danger"
                />
                <Row label="납부 수수료액" value={fmtWon(c.fee)} />
                <Row
                  label="최종 순차 정산액"
                  value={fmtWon(c.net)}
                  valueClass="font-bold text-brand-600"
                />
                <Row
                  label="현재 채널 점유율(예약률)"
                  value={`${c.occupancy}%`}
                  valueClass="font-semibold text-positive"
                />
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs text-ink-400">
                  <span>가동 상태</span>
                  <span>공실률 {c.vacancy}%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-brand-500"
                    style={{ width: `${c.occupancy}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
