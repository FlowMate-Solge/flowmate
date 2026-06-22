import { ChevronRight, MapPin, TrendingUp, Wallet } from 'lucide-react'
import { Card, PageHeader, Pill } from '../components/ui'
import {
  platformStrategy,
  policyFundNote,
  policyFunds,
  priceBenchmark,
  priceHeadroom,
} from '../data/mock'

const toneStyle = {
  positive: 'border-l-positive',
  warning: 'border-l-warning',
  neutral: 'border-l-brand-400',
}

const fmtWonRaw = (won: number) => `₩${won.toLocaleString('ko-KR')}`

// 저가~고가 구간 내 상대 위치(%)
const pos = (won: number) =>
  ((won - priceBenchmark.low) / (priceBenchmark.high - priceBenchmark.low)) * 100

// 골든 최적가 주변 권장 구간 (±5천원)
const goldenLeft = pos(priceBenchmark.golden - 5000)
const goldenWidth = pos(priceBenchmark.golden + 5000) - goldenLeft

export default function Actions() {
  return (
    <div>
      <PageHeader
        title="행동 추천"
        subtitle="상권 시세·운영 전략·정책자금을 한 번에 점검하세요"
        badge="실행 가이드"
      />

      {/* ① 상권 기반 시세 분석 */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-50 text-positive">
            <MapPin size={18} />
          </div>
          <div>
            <Pill tone="positive">동네 상권 대조</Pill>
            <h2 className="mt-1.5 text-lg font-extrabold">
              ① 상권 기반 시세 분석 (시간당 대여가 제안)
            </h2>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          사장님의 스튜디오가 속한 지산/파티룸 지역 상권의 표준 시간당 요금 대조선입니다.
          <br />
          현재 사장님 대비 매출 극대화 한계 수익점은 시간당{' '}
          <b className="text-ink-900">2만 5천 원</b>선입니다.
        </p>

        {/* 시세 슬라이더 */}
        <div className="mt-6">
          <div className="flex justify-between text-xs">
            <span className="text-ink-400">
              저가 구간 ({fmtWonRaw(priceBenchmark.low)})
            </span>
            <span className="font-semibold text-positive">
              이 지역 골든 최적가 ({fmtWonRaw(priceBenchmark.golden)})
            </span>
            <span className="text-ink-400">
              고가 구간 ({fmtWonRaw(priceBenchmark.high)})
            </span>
          </div>

          <div className="relative mt-2.5 h-3 rounded-full bg-slate-100">
            {/* 권장(골든) 구간 음영 */}
            <div
              className="absolute inset-y-0 rounded-full bg-positive/25"
              style={{ left: `${goldenLeft}%`, width: `${goldenWidth}%` }}
            />
            {/* 현재 책정가 핸들 */}
            <div
              className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-brand-600 shadow-card"
              style={{ left: `${pos(priceBenchmark.current)}%` }}
            />
          </div>

          <div className="mt-3 flex justify-between text-xs">
            <span className="text-ink-500">
              현재 책정가:{' '}
              <b className="text-ink-900">{fmtWonRaw(priceBenchmark.current)}/시</b>
            </span>
            <span className="font-medium text-brand-600">
              골든 최적가 대비 {fmtWonRaw(priceHeadroom)} 저렴 (인상 여유 있음)
            </span>
          </div>
        </div>

        <p className="mt-5 border-t border-slate-100 pt-4 text-sm italic text-ink-400">
          &quot;주말에는 최대 {fmtWonRaw(priceBenchmark.weekendMax)}까지 인상하셔도 전환 하락이 없습니다&quot;
        </p>
      </Card>

      {/* ② 오늘의 행동 추천 */}
      <div className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
          <TrendingUp size={18} className="text-brand-600" />
          오늘의 행동 추천
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {platformStrategy.map((s) => (
            <Card key={s.title} className={`border-l-4 ${toneStyle[s.tone]}`}>
              <div className="font-bold">{s.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{s.body}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* ③ 정책자금 안내 */}
      <div className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
          <Wallet size={18} className="text-warning" />
          정책자금 안내
        </h2>
        <Card>
          <div className="space-y-3">
            {policyFunds.map((p) => (
              <button
                key={p.name}
                className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-left transition hover:border-brand-200 hover:bg-brand-50"
              >
                <div>
                  <div className="font-bold">{p.name}</div>
                  <div className="mt-0.5 text-xs text-ink-400">{p.desc}</div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-ink-400" />
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-400">{policyFundNote}</p>
        </Card>
      </div>
    </div>
  )
}
