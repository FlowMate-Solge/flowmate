import { useEffect, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, CalendarClock, Sparkles, TrendingUp, Wallet } from 'lucide-react'
import { Card, CardTitle, ErrorBanner, PageHeader, PageSkeleton, Pill } from '../components/ui'
import { fmtMan } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import {
  getBriefing,
  getDashboardSummary,
  getHealthScore,
  type Briefing,
  type DashboardSummary,
  type HealthScore,
} from '../lib/api'

// 백엔드 grossAmount/fee/net은 원 단위, 프론트 mock 표시는 만원 단위라 /10000으로 변환
const toManwon = (won: number) => Math.round(won / 10_000)

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'positive' | 'danger'
}) {
  return (
    <Card>
      <div className="stat-label">{label}</div>
      <div className="num mt-1 text-2xl font-extrabold">{value}</div>
      {sub && (
        <div
          className={`mt-1 text-xs font-medium ${
            tone === 'positive'
              ? 'text-positive'
              : tone === 'danger'
                ? 'text-danger'
                : 'text-ink-400'
          }`}
        >
          {sub}
        </div>
      )}
    </Card>
  )
}

export default function Dashboard() {
  const { mode, demo } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (mode === 'demo') {
      setSummary(demo.dashboardSummary)
      setHealthScore(demo.healthScore)
      setBriefing(demo.briefing)
      return
    }
    setSummary(null)
    setError(null)
    Promise.all([getDashboardSummary(), getHealthScore()])
      .then(([s, h]) => {
        setSummary(s)
        setHealthScore(h)
      })
      .catch((e) => setError(e.message))
    getBriefing().then(setBriefing).catch(() => setBriefing(null))
  }, [mode, demo, retryKey])

  if (error) {
    return <ErrorBanner message={error} onRetry={() => setRetryKey((k) => k + 1)} />
  }
  if (!summary || !healthScore) {
    return <PageSkeleton />
  }

  const { totals, monthlyTrend } = summary
  const chartData = monthlyTrend.map((m) => ({
    month: m.month.slice(5) + '월',
    gross: toManwon(m.gross),
    net: toManwon(m.net),
  }))

  return (
    <div>
      <PageHeader
        title="오늘의 운영 현황"
        subtitle="플랫폼별 매출을 한 눈에 모아 편안하게 확인하세요"
        badge="2026년 6월"
      />

      {/* 자금 부족 알림 */}
      {briefing?.cashRisk && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-danger text-white">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="font-bold text-danger">
              {briefing.cashRisk.period} 자금 부족 구간 — 최저 {fmtMan(toManwon(briefing.cashRisk.lowestBalance))}
            </div>
            <p className="mt-0.5 text-sm text-ink-700">{briefing.cashRisk.reason}</p>
            <p className="mt-1 text-sm text-ink-700">
              💡 <b>대응:</b> {briefing.cashRisk.suggestion}
            </p>
          </div>
        </div>
      )}

      {/* 오늘의 브리핑 */}
      {briefing && (
        <Card className="mb-4 border-l-4 border-l-brand-500">
          <CardTitle right={<span className="text-xs text-ink-400">{briefing.date}</span>}>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={15} className="text-brand-600" /> 오늘의 브리핑
            </span>
          </CardTitle>
          <div className="space-y-4">
            {/* 예상 잔액 */}
            <div className="rounded-xl bg-brand-50 px-4 py-3">
              <div className="text-xs text-ink-500">오늘 예상 잔액</div>
              <div className="mt-1 text-2xl font-extrabold text-brand-700">
                {fmtMan(toManwon(briefing.expectedBalance))}
              </div>
            </div>
            {/* 이번 주 정산 */}
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-ink-500 mb-1.5">
                <CalendarClock size={13} /> 이번 주 정산
              </div>
              <ul className="space-y-1 text-sm">
                {briefing.weekSettlement.length ? (
                  briefing.weekSettlement.map((s, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="text-ink-600">{s.date} {s.platform}</span>
                      <span className="font-semibold text-positive">+{fmtMan(toManwon(s.amount))}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-ink-400">이번 주 정산 없음</li>
                )}
              </ul>
            </div>
            {/* 임박 지출 */}
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-ink-500 mb-1.5">
                <Wallet size={13} /> 임박 지출
              </div>
              <ul className="space-y-1 text-sm">
                {briefing.upcoming.map((u, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span className={u.urgent ? 'font-medium text-danger' : 'text-ink-600'}>
                      {u.date} {u.label}
                    </span>
                    <span className="font-semibold text-ink-700">-{fmtMan(toManwon(u.amount))}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* 상단 요약 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="이번 달 총매출"
          value={fmtMan(toManwon(totals.gross))}
          sub="전월 대비 +12%"
          tone="positive"
        />
        <StatCard
          label="플랫폼 수수료"
          value={fmtMan(toManwon(totals.fee))}
          sub={`매출의 ${((totals.fee / totals.gross) * 100).toFixed(1)}%`}
          tone="danger"
        />
        <StatCard
          label="실제 순수익"
          value={fmtMan(toManwon(totals.net))}
          sub={`예약 ${totals.bookings}건`}
        />
        <StatCard
          label="금융 건강 점수"
          value={`${healthScore.total}점`}
          sub={healthScore.grade}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 월별 추이 */}
        <Card className="lg:col-span-2">
          <CardTitle
            right={
              <Pill tone="brand">
                <TrendingUp size={12} /> 7~8월 성수기 예측
              </Pill>
            }
          >
            월별 매출·순수익 추이
          </CardTitle>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ left: -16, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip
                formatter={(v: number) => fmtMan(v)}
                contentStyle={{ borderRadius: 12, border: '1px solid #eef0f4' }}
              />
              <Bar dataKey="gross" name="매출" radius={[6, 6, 0, 0]} barSize={22}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="#3366ff" />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="net"
                name="순수익"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* 금융 건강 점수 분해 */}
        <Card>
          <CardTitle>금융 건강 점수</CardTitle>
          <div className="mb-4 flex items-end gap-2">
            <span className="text-4xl font-extrabold text-brand-600">
              {healthScore.total}
            </span>
            <span className="mb-1 text-sm text-ink-400">/ 100 · {healthScore.grade}</span>
          </div>
          <div className="space-y-3">
            {healthScore.factors.map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-700">{f.label}</span>
                  <span className="text-ink-400">{f.score}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-brand-500"
                    style={{ width: `${f.score}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-ink-400">{f.note}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
