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
import { TrendingUp } from 'lucide-react'
import { Card, CardTitle, PageHeader, Pill } from '../components/ui'
import { fmtMan, healthScore, monthlyTrend, totals } from '../data/mock'

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
      <div className="mt-1 text-2xl font-extrabold tracking-tight">{value}</div>
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
  return (
    <div>
      <PageHeader
        title="통합 대시보드"
        subtitle="흩어진 3개 플랫폼의 매출·수수료·순수익을 한 화면에서"
        badge="2026년 6월 기준"
      />

      {/* 상단 요약 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="이번 달 총매출"
          value={fmtMan(totals.gross)}
          sub="전월 대비 +12%"
          tone="positive"
        />
        <StatCard
          label="플랫폼 수수료"
          value={fmtMan(totals.fee)}
          sub={`매출의 ${((totals.fee / totals.gross) * 100).toFixed(1)}%`}
          tone="danger"
        />
        <StatCard
          label="실제 순수익"
          value={fmtMan(totals.net)}
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
            <ComposedChart data={monthlyTrend} margin={{ left: -16, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip
                formatter={(v: number) => fmtMan(v)}
                contentStyle={{ borderRadius: 12, border: '1px solid #eef0f4' }}
              />
              <Bar dataKey="gross" name="매출" radius={[6, 6, 0, 0]} barSize={22}>
                {monthlyTrend.map((m, i) => (
                  <Cell key={i} fill={m.forecast ? '#bcd3ff' : '#3366ff'} />
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
