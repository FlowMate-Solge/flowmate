import { useState } from 'react'
import {
  Building2,
  CalendarCheck,
  Check,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  RefreshCw,
  Upload,
  Zap,
} from 'lucide-react'
import { Card, CardTitle, PageHeader, Pill } from '../components/ui'

interface Source {
  id: string
  name: string
  sub: string
  icon: typeof Building2
  connected: boolean
}

function SourceRow({
  s,
  onToggle,
}: {
  s: Source
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            s.connected ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-ink-400'
          }`}
        >
          <s.icon size={18} />
        </div>
        <div>
          <div className="text-sm font-bold">{s.name}</div>
          <div className="text-[11px] text-ink-400">{s.sub}</div>
        </div>
      </div>
      {s.connected ? (
        <Pill tone="positive">
          <Check size={12} /> 연결됨
        </Pill>
      ) : (
        <button
          onClick={() => onToggle(s.id)}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          연결하기
        </button>
      )}
    </div>
  )
}

export default function Connect() {
  const [sources, setSources] = useState<Source[]>([
    {
      id: 'bank',
      name: '국민은행 사업자 계좌',
      sub: '오픈뱅킹 · 입출금 자동 수집',
      icon: Landmark,
      connected: true,
    },
    {
      id: 'card',
      name: '신한카드 사업자',
      sub: '마이데이터 · 매입·고정비 자동 분류',
      icon: CreditCard,
      connected: true,
    },
    {
      id: 'spacecloud',
      name: '스페이스클라우드',
      sub: '예약·정산·수수료 자동 동기화',
      icon: CalendarCheck,
      connected: true,
    },
    {
      id: 'naver',
      name: '네이버 예약',
      sub: '예약·정산·수수료 자동 동기화',
      icon: CalendarCheck,
      connected: true,
    },
    {
      id: 'ourplace',
      name: '아워플레이스',
      sub: '예약·정산·수수료 자동 동기화',
      icon: CalendarCheck,
      connected: false,
    },
  ])

  const connectedCount = sources.filter((s) => s.connected).length

  function toggle(id: string) {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, connected: true } : s)),
    )
  }

  // 고정 지출비 입력
  const [costItem, setCostItem] = useState('')
  const [costDay, setCostDay] = useState('15')
  const [costAmount, setCostAmount] = useState('300000')
  const [fixedCosts, setFixedCosts] = useState<
    { item: string; day: string; amount: number }[]
  >([])

  function addFixedCost() {
    if (!costItem.trim() || !costAmount) return
    setFixedCosts((prev) => [
      ...prev,
      { item: costItem.trim(), day: costDay, amount: Number(costAmount) },
    ])
    setCostItem('')
  }

  return (
    <div>
      <PageHeader
        title="데이터 연결"
        subtitle="한 번 연결하면 매출·정산·지출이 매일 자동으로 들어옵니다. 직접 입력할 필요 없어요."
        badge="자동 동기화"
      />

      {/* 핵심 메시지 배너 — '누가 입력하냐' 반박 */}
      <div className="mb-4 flex items-start gap-3 rounded-2xl bg-brand-600 p-5 text-white">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
          <Zap size={20} />
        </div>
        <div>
          <div className="font-bold">손으로 입력하는 가계부가 아닙니다</div>
          <p className="mt-1 text-sm leading-relaxed text-white/85">
            계좌·카드·예약 플랫폼을 한 번만 연결하면 거래가 자동으로 모입니다.
            매일 새벽 동기화 후 오늘의 브리핑까지 자동 생성돼요.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
            <RefreshCw size={13} /> 마지막 동기화: 오늘 새벽 4:02 · {connectedCount}개
            소스 연결됨
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 계좌·카드 */}
        <Card>
          <CardTitle right={<Pill tone="brand">마이데이터</Pill>}>
            계좌 · 카드
          </CardTitle>
          <p className="mb-3 text-xs text-ink-400">
            입출금과 카드 매입을 자동으로 수집해 고정비·매입을 분류합니다.
          </p>
          <div className="space-y-2">
            {sources
              .filter((s) => s.id === 'bank' || s.id === 'card')
              .map((s) => (
                <SourceRow key={s.id} s={s} onToggle={toggle} />
              ))}
          </div>
        </Card>

        {/* 예약 플랫폼 */}
        <Card>
          <CardTitle right={<Pill tone="brand">예약 연동</Pill>}>
            예약 플랫폼
          </CardTitle>
          <p className="mb-3 text-xs text-ink-400">
            플랫폼별 매출·수수료·정산 주기를 자동으로 반영합니다.
          </p>
          <div className="space-y-2">
            {sources
              .filter((s) => s.icon === CalendarCheck)
              .map((s) => (
                <SourceRow key={s.id} s={s} onToggle={toggle} />
              ))}
          </div>
        </Card>
      </div>

      {/* 고정 지출비 입력 */}
      <Card className="mt-4">
        <div className="mb-1 flex items-center gap-2">
          <Plus size={18} className="text-pink-500" />
          <Pencil size={15} className="text-ink-700" />
          <h2 className="text-base font-bold">
            매달 나가는 월세/공과금 등 고정비 등록
          </h2>
        </div>
        <p className="mb-4 text-xs text-ink-400">
          매달 고정적으로 빠져나가는 돈을 등록하면 현금흐름 예측에 자동 반영됩니다.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-ink-500">
              고정적으로 나가는 비목
            </span>
            <input
              value={costItem}
              onChange={(e) => setCostItem(e.target.value)}
              placeholder="예: 가게 월세, 전기요금 등"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-500">
              매달 돈이 빠져나가는 날짜
            </span>
            <input
              type="number"
              min={1}
              max={31}
              value={costDay}
              onChange={(e) => setCostDay(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-400"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-ink-500">
            매월 일정하게 지급하는 금액 (원)
          </span>
          <input
            type="number"
            value={costAmount}
            onChange={(e) => setCostAmount(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-400"
          />
        </label>

        <button
          onClick={addFixedCost}
          className="mt-4 w-full rounded-xl bg-ink-900 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
        >
          매달 자동 나가는 돈에 기입하기
        </button>

        {fixedCosts.length > 0 && (
          <div className="mt-4 space-y-2">
            {fixedCosts.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-ink-700 shadow-sm">
                    매월 {c.day}일
                  </span>
                  <span className="font-medium">{c.item}</span>
                </div>
                <span className="font-bold text-danger">
                  -₩{c.amount.toLocaleString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 직접 업로드 (보조 수단) */}
      <Card className="mt-4">
        <CardTitle right={<span className="text-xs text-ink-400">보조 수단</span>}>
          직접 업로드
        </CardTitle>
        <p className="mb-3 text-xs text-ink-400">
          연동이 안 되는 플랫폼은 정산 내역서(CSV·엑셀)나 화면 캡처를 올리면
          자동으로 인식합니다.
        </p>
        <button className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-8 text-ink-400 transition hover:border-brand-300 hover:bg-brand-50/40">
          <Upload size={22} />
          <span className="text-sm font-medium">
            CSV·엑셀·이미지를 끌어다 놓거나 클릭해서 업로드
          </span>
          <span className="text-[11px]">스페이스클라우드·야놀자·여기어때 정산서 지원</span>
        </button>
      </Card>

      {/* 추가 연결 안내 */}
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-ink-500 transition hover:bg-slate-50">
        <Plus size={16} /> 다른 은행·플랫폼 연결하기
      </button>
    </div>
  )
}
