import { useEffect, useState } from 'react'
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
import { AlertTriangle, ArrowRight, Calculator, Lightbulb, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardSkeleton, CardTitle, ErrorBanner, PageHeader, PageSkeleton, Pill } from '../components/ui'
import { fmtMan } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { calculateRoiLocal } from '../lib/demoEngine'
import {
  calculateRoi,
  getForecast,
  getRoiDefaults,
  getTaxReserve,
  updateTaxReserve,
  type Forecast,
  type RoiInput,
  type RoiResult,
  type TaxReserve,
} from '../lib/api'

// 백엔드는 원 단위, 화면은 만원 단위
const toManwon = (won: number) => Math.round(won / 10_000)

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
  const { mode } = useAuth()
  const [input, setInput] = useState<RoiInput | null>(null)
  const [result, setResult] = useState<RoiResult | null>(null)

  useEffect(() => {
    if (mode === 'demo') {
      setInput({ investment: 5000, monthlyFixed: 415, avgMonthlyNet: 695 })
      return
    }
    getRoiDefaults()
      .then((d) => setInput({
        investment: toManwon(d.investment),
        monthlyFixed: toManwon(d.monthlyFixed),
        avgMonthlyNet: toManwon(d.avgMonthlyNet),
      }))
      .catch(() => setInput({ investment: 0, monthlyFixed: 0, avgMonthlyNet: 0 }))
  }, [mode])

  // 입력(만원) → 원으로 환산해 계산 (데모: 클라이언트 계산 / 실제: 백엔드 호출)
  useEffect(() => {
    if (!input) return
    const investment = input.investment * 10_000
    const monthlyFixed = input.monthlyFixed * 10_000
    const avgMonthlyNet = input.avgMonthlyNet * 10_000
    if (mode === 'demo') {
      setResult(calculateRoiLocal(investment, monthlyFixed, avgMonthlyNet))
      return
    }
    calculateRoi({ investment, monthlyFixed, avgMonthlyNet })
      .then(setResult)
      .catch(() => setResult(null))
  }, [input, mode])

  if (!input) return <CardSkeleton />

  const fields = [
    { key: 'investment' as const, label: '초기 투자비' },
    { key: 'monthlyFixed' as const, label: '월 고정비' },
    { key: 'avgMonthlyNet' as const, label: '월 평균 순수익' },
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
          <label key={f.key} className="block">
            <span className="text-xs text-ink-500">{f.label} (만원)</span>
            <input
              type="number"
              value={input[f.key]}
              onChange={(e) => setInput({ ...input, [f.key]: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-brand-600 p-4 text-white">
        <div className="text-xs opacity-80">예상 손익분기점</div>
        {result?.recoverable && result.months != null ? (
          <>
            <div className="mt-1 text-3xl font-extrabold">
              {result.months.toFixed(1)}개월
            </div>
            <div className="mt-1 text-xs opacity-80">
              월 {fmtMan(toManwon(result.monthlyProfit))}씩 회수
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
  const { mode, demo } = useAuth()
  const [tax, setTax] = useState<TaxReserve | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode === 'demo') { setTax(demo.taxReserve); return }
    getTaxReserve().then(setTax).catch(() => setTax(null))
  }, [mode, demo])

  if (!tax) return <CardSkeleton />

  const ratePct = Math.round(tax.rate * 100)
  const filingDate = new Date(tax.nextFilingDate).toLocaleDateString('ko-KR')

  async function save() {
    if (editing == null) return
    setSaving(true)
    try {
      if (mode === 'demo') {
        demo.updateTaxBalance(editing * 10_000)
        setEditing(null)
        return
      }
      const updated = await updateTaxReserve({ currentBalance: editing * 10_000 })
      setTax(updated)
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardTitle
        right={
          <span className="inline-flex items-center gap-1 text-xs text-ink-400">
            <PiggyBank size={13} /> 매출의 {ratePct}%
          </span>
        }
      >
        세금 예비금 안내
      </CardTitle>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-center">
          <div className="text-xs text-ink-400">이번 달 매출</div>
          <div className="mt-1.5 text-2xl font-extrabold tracking-tight">
            {fmtMan(toManwon(tax.monthlyRevenue))}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-center">
          <div className="text-xs text-ink-400">필요 예비금({ratePct}%)</div>
          <div className="mt-1.5 text-2xl font-extrabold tracking-tight text-brand-600">
            {fmtMan(toManwon(tax.recommended))}
          </div>
        </div>
      </div>

      {/* 현재 보유액 + 수정 */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-sm">
        <span className="text-ink-500">현재 세금통장</span>
        {editing == null ? (
          <span className="flex items-center gap-2">
            <b>{fmtMan(toManwon(tax.currentBalance))}</b>
            <button
              onClick={() => setEditing(toManwon(tax.currentBalance))}
              className="text-xs text-brand-600 hover:underline"
            >
              수정
            </button>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <input
              type="number"
              value={editing}
              onChange={(e) => setEditing(Number(e.target.value))}
              className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-brand-400"
            />
            <span className="text-xs text-ink-400">만원</span>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-brand-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              저장
            </button>
          </span>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
        <b>{tax.filingType}</b>가 {filingDate}에 예정되어 있어요.{' '}
        {tax.shortfall > 0 ? (
          <>
            권장 예비금까지 <b>{fmtMan(toManwon(tax.shortfall))}</b>이 부족합니다. 신고
            시점 전에 미리 분리해 두세요.
          </>
        ) : (
          <>권장 예비금을 이미 확보했습니다. 안정적입니다.</>
        )}
      </div>
    </Card>
  )
}

export default function ForecastPage() {
  const { mode, demo } = useAuth()
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (mode === 'demo') { setForecast(demo.forecast); return }
    setForecast(null)
    setError(null)
    getForecast().then(setForecast).catch((e) => setError(e.message))
  }, [mode, demo, retryKey])

  if (error) {
    return <ErrorBanner message={error} onRetry={() => setRetryKey((k) => k + 1)} />
  }
  if (!forecast) {
    return <PageSkeleton />
  }

  const { risk, seasonal } = forecast
  const chartData = forecast.days.map((d) => ({
    label: d.label,
    balance: toManwon(d.balance),
    event: d.event,
  }))
  const safetyMan = toManwon(forecast.safetyLine)

  return (
    <div>
      <PageHeader
        title="자금 흐름 미리보기"
        subtitle={`${forecast.horizonDays}일 예상 잔액·자금 부족 시점 예측`}
      />

      {/* 위험 경고 배너 — 브리핑 모달과 동일한 형식 */}
      {risk && (
        <div className="mb-4 break-keep rounded-2xl border border-red-100 bg-red-50 p-3.5">
          {/* 경고 */}
          <div className="flex items-start gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-danger text-white">
              <AlertTriangle size={16} />
            </div>
            <div>
              <div className="font-bold text-danger">
                {risk.startLabel}~{risk.endLabel} 자금 부족 위험
              </div>
              <p className="mt-0.5 text-sm text-ink-700">{risk.reason}</p>
            </div>
          </div>
          <hr className="my-2.5 border-red-200/70" />
          {/* 대응 */}
          <div className="flex items-start gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
              <Lightbulb size={16} />
            </div>
            <p className="pt-1 text-sm text-ink-700">{risk.suggestion}</p>
          </div>
        </div>
      )}

      {/* 일별 잔액 예측 그래프 */}
      <Card>
        <CardTitle
          right={
            risk ? (
              <Pill tone="danger">
                {risk.startLabel}~{risk.endLabel} 위험 구간
              </Pill>
            ) : (
              <Pill tone="brand">안전</Pill>
            )
          }
        >
          일별 예상 잔액 ({forecast.days[0]?.label} ~{' '}
          {forecast.days[forecast.days.length - 1]?.label})
        </CardTitle>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 8 }}>
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
              padding={{ left: 4, right: 4 }}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} />
            <Tooltip content={<ForecastTooltip />} />
            <ReferenceLine
              y={safetyMan}
              stroke="#dc2626"
              strokeDasharray="4 4"
              label={{
                value: `안전선 ${safetyMan}만`,
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#dc2626',
              }}
            />
            {risk && (
              <ReferenceArea
                x1={risk.startLabel}
                x2={risk.endLabel}
                fill="#dc2626"
                fillOpacity={0.06}
              />
            )}
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
          {forecast.settlements.map((s) => (
            <span key={s.date}>
              ● {s.date.slice(5).replace('-', '/').replace(/^0/, '')} {s.label} +
              {toManwon(s.amount)}만
            </span>
          ))}
        </div>
      </Card>

      {/* 성수기/비수기 신호 — 브리핑 모달과 동일한 형식 */}
      {seasonal.peakMessage && (() => {
        const cfg =
          seasonal.trend === 'up'
            ? { Icon: TrendingUp, title: '성수기 진입 신호', wrap: 'border-brand-100 bg-brand-50', icon: 'bg-brand-600', titleColor: 'text-brand-700', divider: 'border-brand-200/70' }
            : seasonal.trend === 'down'
              ? { Icon: TrendingDown, title: '비수기 진입 주의', wrap: 'border-amber-100 bg-amber-50', icon: 'bg-amber-500', titleColor: 'text-amber-700', divider: 'border-amber-200/70' }
              : { Icon: ArrowRight, title: '매출 안정세', wrap: 'border-slate-200 bg-slate-50', icon: 'bg-slate-400', titleColor: 'text-ink-700', divider: 'border-slate-200' }
        const { Icon } = cfg
        return (
          <div className={`mt-4 break-keep rounded-2xl border p-3.5 ${cfg.wrap}`}>
            {/* 신호 */}
            <div className="flex items-start gap-2.5">
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white ${cfg.icon}`}>
                <Icon size={16} />
              </div>
              <div>
                <div className={`font-bold ${cfg.titleColor}`}>{cfg.title}</div>
                <p className="mt-0.5 text-sm text-ink-700">{seasonal.peakMessage}</p>
              </div>
            </div>
            <hr className={`my-2.5 ${cfg.divider}`} />
            {/* 대비 */}
            <div className="flex items-start gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
                <Lightbulb size={16} />
              </div>
              <p className="pt-1 text-sm text-ink-700">{seasonal.prepMessage}</p>
            </div>
          </div>
        )
      })()}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RoiCalculator />
        <TaxReserveCard />
      </div>
    </div>
  )
}
