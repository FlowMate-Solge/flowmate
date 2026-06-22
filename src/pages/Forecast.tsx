import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, Calculator, PiggyBank } from 'lucide-react'
import { Card, CardTitle, PageHeader, Pill } from '../components/ui'
import {
  dailyForecast,
  fmtMan,
  riskAlert,
  roiDefaults,
  taxReserve,
} from '../data/mock'

function ForecastTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs shadow-card">
      <div className="font-bold">{d.label}</div>
      <div className="mt-0.5">
        예상 잔액 <b>{fmtMan(d.balance)}</b>
      </div>
      {d.event && <div className="mt-0.5 text-ink-400">{d.event}</div>}
    </div>
  )
}

function RoiCalculator() {
  const [investment, setInvestment] = useState(roiDefaults.investment)
  const [fixed, setFixed] = useState(roiDefaults.monthlyFixed)
  const [net, setNet] = useState(roiDefaults.avgMonthlyNet)

  const monthlyProfit = net - fixed
  const months = monthlyProfit > 0 ? investment / monthlyProfit : Infinity
  const valid = monthlyProfit > 0

  const fields = [
    { label: '초기 투자비', value: investment, set: setInvestment },
    { label: '월 고정비', value: fixed, set: setFixed },
    { label: '월 평균 순수익', value: net, set: setNet },
  ]

  return (
    <Card>
      <CardTitle
        right={
          <span className="inline-flex items-center gap-1 text-xs text-ink-400">
            <Calculator size={13} /> 입력값을 바꿔보세요
          </span>
        }
      >
        ROI 회수 기간 계산기
      </CardTitle>

      <div className="space-y-3">
        {fields.map((f) => (
          <label key={f.label} className="block">
            <span className="text-xs text-ink-500">{f.label} (만원)</span>
            <input
              type="number"
              value={f.value}
              onChange={(e) => f.set(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-brand-600 p-4 text-white">
        <div className="text-xs opacity-80">예상 손익분기점</div>
        {valid ? (
          <>
            <div className="mt-1 text-3xl font-extrabold">
              {months.toFixed(1)}개월
            </div>
            <div className="mt-1 text-xs opacity-80">
              월 {fmtMan(monthlyProfit)}씩 회수 · 2027년 상반기 도달 예상
            </div>
          </>
        ) : (
          <div className="mt-1 text-lg font-bold">
            순수익이 고정비보다 낮아 회수 불가
          </div>
        )}
      </div>
    </Card>
  )
}

function TaxReserveCard() {
  return (
    <Card>
      <CardTitle
        right={
          <span className="inline-flex items-center gap-1 text-xs text-ink-400">
            <PiggyBank size={13} /> 매출의 {taxReserve.rate * 100}%
          </span>
        }
      >
        세금 예비금 안내
      </CardTitle>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-center">
          <div className="text-xs text-ink-400">이번 달 매출</div>
          <div className="mt-1.5 text-2xl font-extrabold tracking-tight">
            {fmtMan(taxReserve.monthlyRevenue)}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-center">
          <div className="text-xs text-ink-400">
            필요 예비금({taxReserve.rate * 100}%)
          </div>
          <div className="mt-1.5 text-2xl font-extrabold tracking-tight text-brand-600">
            {fmtMan(taxReserve.recommended)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
        <b>{taxReserve.filingType}</b>가 {taxReserve.nextFiling}에 예정되어 있어요.
        매출의 {taxReserve.rate * 100}%인 {fmtMan(taxReserve.recommended)}을 미리
        분리해 두면 신고 시점에 당황하지 않습니다.
      </div>
    </Card>
  )
}

export default function Forecast() {
  return (
    <div>
      <PageHeader
        title="AI 현금흐름 예측"
        subtitle="매출 패턴·고정비·정산 주기를 결합한 향후 30일 잔액 예측"
        badge="룰 기반 예측 (MVP)"
      />

      {/* 위험 경고 배너 */}
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-danger text-white">
          <AlertTriangle size={18} />
        </div>
        <div>
          <div className="font-bold text-danger">
            {riskAlert.date} 자금 부족 위험
          </div>
          <p className="mt-0.5 text-sm text-ink-700">{riskAlert.reason}</p>
          <p className="mt-1 text-sm text-ink-700">
            💡 <b>대응:</b> {riskAlert.suggestion}
          </p>
        </div>
      </div>

      {/* 일별 잔액 예측 그래프 */}
      <Card>
        <CardTitle
          right={<Pill tone="danger">6/25~27 위험 구간</Pill>}
        >
          일별 예상 잔액 (6/19 ~ 7/19)
        </CardTitle>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyForecast} margin={{ left: -8, right: 8 }}>
            <defs>
              <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3366ff" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3366ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={11} />
            <Tooltip content={<ForecastTooltip />} />
            {/* 안전선 50만 */}
            <ReferenceLine
              y={50}
              stroke="#dc2626"
              strokeDasharray="4 4"
              label={{ value: '안전선 50만', position: 'insideTopRight', fontSize: 10, fill: '#dc2626' }}
            />
            {/* 위험 구간 음영 */}
            <ReferenceArea x1="06-25" x2="06-27" fill="#dc2626" fillOpacity={0.06} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3366ff"
              strokeWidth={2.5}
              fill="url(#bal)"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-400">
          <span>● 6/21 네이버 정산 +35만</span>
          <span>● 6/25 임대료 -280만</span>
          <span>● 7/10 스페이스클라우드 정산 +378만</span>
          <span>● 7/15 아워플레이스 정산 +158만</span>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RoiCalculator />
        <TaxReserveCard />
      </div>
    </div>
  )
}
