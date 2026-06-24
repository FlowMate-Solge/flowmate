import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Calculator, MapPin, Sparkles, Star } from 'lucide-react'
import { Card, CardTitle, PageHeader, PageSkeleton, Pill } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { NEARBY_VENUES, SURVEYED_AREA, SURVEYED_AT } from '../data/nearbyVenues'
import { DEMO_PRICE } from '../data/demoData'
import { getPriceBenchmark, type PriceBenchmark } from '../lib/api'

const fmtWon = (won: number) => `₩${won.toLocaleString('ko-KR')}`

export default function PriceCalculator() {
  const { mode, demo } = useAuth()
  const [price, setPrice] = useState<PriceBenchmark | null>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  useEffect(() => {
    if (mode === 'demo') {
      setPrice(DEMO_PRICE)
      return
    }
    getPriceBenchmark().then(setPrice).catch(() => setPrice(null))
  }, [mode])

  if (!price) return <PageSkeleton />

  const myPrice = price.benchmark.current
  const venues = NEARBY_VENUES
  const avgPrice = Math.round(venues.reduce((s, v) => s + v.pricePerHour, 0) / venues.length)
  const cheaperCount = venues.filter((v) => v.pricePerHour < myPrice).length
  const percentile = Math.round((cheaperCount / venues.length) * 100)

  // 평균 공실률(실제 연결된 플랫폼 데이터 기반 — 데모 모드면 demo.platforms, 실제 모드면 price.benchmark만 있고
  // platforms는 이 페이지에서 따로 안 불러오므로 데모일 때만 반영하고, 실제 모드는 시세 평균만으로 제안)
  const avgVacancy =
    mode === 'demo'
      ? Math.round(demo.platforms.reduce((s, p) => s + p.vacancy, 0) / demo.platforms.length)
      : null

  // 적정가 제안: 주변 평균 ± 공실률 신호로 조정
  let suggested = avgPrice
  let suggestReason = `주변 ${venues.length}곳 평균(${fmtWon(avgPrice)})을 기준으로 했습니다.`
  if (avgVacancy != null) {
    if (avgVacancy >= 25) {
      suggested = Math.round((avgPrice * 0.95) / 1000) * 1000
      suggestReason = `주변 평균(${fmtWon(avgPrice)})보다 살짝 낮게 — 평균 공실률이 ${avgVacancy}%로 높은 편이라 예약률을 먼저 끌어올리는 걸 권장합니다.`
    } else if (avgVacancy <= 15) {
      suggested = Math.round((avgPrice * 1.05) / 1000) * 1000
      suggestReason = `주변 평균(${fmtWon(avgPrice)})보다 살짝 높게 — 평균 공실률이 ${avgVacancy}%로 낮아 인상 여력이 있습니다.`
    }
  }

  const chartData = [
    ...venues.map((v) => ({ name: v.name, price: v.pricePerHour, mine: false })),
    { name: '내 매장', price: myPrice, mine: true },
  ].sort((a, b) => a.price - b.price)

  return (
    <div>
      <PageHeader
        title="시세 계산기"
        subtitle={`${SURVEYED_AREA} 비슷한 파티룸 ${venues.length}곳과 내 가격을 비교합니다`}
        badge={`${SURVEYED_AT} 조사 기준`}
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        <MapPin size={14} className="mt-0.5 shrink-0" />
        주변 매장 시세는 실시간 크롤링이 아니라 {SURVEYED_AT}에 직접 조사한 스냅샷입니다. 시간이 지나면 실제 가격과
        다를 수 있어요.
      </div>

      {/* 상단 요약 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <div className="stat-label">주변 평균 시세</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight">{fmtWon(avgPrice)}</div>
          <div className="mt-1 text-xs text-ink-400">시간당</div>
        </Card>
        <Card>
          <div className="stat-label">내 현재 가격</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-brand-600">{fmtWon(myPrice)}</div>
          <div className="mt-1 text-xs text-ink-400">시간당</div>
        </Card>
        <Card>
          <div className="stat-label">내 가격 위치</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight">
            {myPrice > avgPrice ? '상위' : '하위'} {myPrice > avgPrice ? 100 - percentile : percentile}%
          </div>
          <div className="mt-1 text-xs text-ink-400">주변 {venues.length}곳 중</div>
        </Card>
        <Card>
          <div className="stat-label">제안 가격</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-positive">{fmtWon(suggested)}</div>
          <div className="mt-1 text-xs text-ink-400">시간당</div>
        </Card>
      </div>

      {/* 비교 차트 */}
      <Card className="mt-4">
        <CardTitle right={<Pill tone="brand">시간당 가격(원)</Pill>}>주변 매장 시세 비교</CardTitle>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ left: -8, right: 8, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `${v / 1000}천`} />
            <Tooltip
              cursor={false}
              formatter={(v: number) => fmtWon(v)}
              contentStyle={{ borderRadius: 12, border: '1px solid #eef0f4' }}
            />
            <Bar
              dataKey="price"
              radius={[6, 6, 0, 0]}
              barSize={28}
              onMouseEnter={(_, idx) => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {chartData.map((d, i) => {
                const active = hoverIdx === i
                return (
                  <Cell
                    key={i}
                    fill={d.mine ? '#3366ff' : active ? '#1f47f5' : '#cbd5e1'}
                    opacity={hoverIdx === null || active ? 1 : 0.45}
                    style={{
                      transition: 'fill 0.25s ease, opacity 0.25s ease, transform 0.25s ease',
                      transformOrigin: 'bottom',
                      transform: active ? 'scaleY(1.04)' : 'scaleY(1)',
                    }}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 제안 */}
      <Card className="mt-4 border-l-4 border-l-positive">
        <div className="flex items-center gap-2 text-sm font-bold text-positive">
          <Sparkles size={15} /> 적정가 제안
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">{suggestReason}</p>
      </Card>

      {/* 매장 목록 */}
      <div className="mt-5">
        <h2 className="mb-3 text-base font-extrabold">주변 매장 목록</h2>
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-ink-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">매장</th>
                <th className="px-3 py-2 text-left font-medium">지역</th>
                <th className="px-3 py-2 text-right font-medium">거리</th>
                <th className="px-3 py-2 text-right font-medium">가격</th>
                <th className="px-3 py-2 text-right font-medium">평점</th>
              </tr>
            </thead>
            <tbody>
              {[...venues]
                .sort((a, b) => a.pricePerHour - b.pricePerHour)
                .map((v) => (
                  <tr key={v.name} className="border-t border-slate-100">
                    <td className="px-3 py-2.5 font-medium">{v.name}</td>
                    <td className="px-3 py-2.5 text-ink-500">{v.area}</td>
                    <td className="px-3 py-2.5 text-right text-ink-500">{v.distanceKm}km</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{fmtWon(v.pricePerHour)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="inline-flex items-center gap-0.5 text-amber-500">
                        <Star size={12} fill="currentColor" /> {v.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              <tr className="border-t border-slate-100 bg-brand-50/60">
                <td className="px-3 py-2.5 font-bold text-brand-700">내 매장</td>
                <td className="px-3 py-2.5 text-ink-500">-</td>
                <td className="px-3 py-2.5 text-right text-ink-500">-</td>
                <td className="px-3 py-2.5 text-right font-bold text-brand-700">{fmtWon(myPrice)}</td>
                <td className="px-3 py-2.5 text-right text-ink-400">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-ink-400">
        <Calculator size={13} /> 적정가는 주변 시세 평균에 내 공실률을 반영해 계산됩니다.
      </div>
    </div>
  )
}
