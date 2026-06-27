import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  MessageSquare,
  X,
} from 'lucide-react'
import { Card, CardTitle, ErrorBanner, PageHeader, PageSkeleton } from '../components/ui'
import { fmtMan } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import {
  getBriefing,
  getDashboardSummary,
  getPlatforms,
  type Briefing,
  type CalendarEvent,
  type DashboardSummary,
  type PlatformSummary,
} from '../lib/api'

// 백엔드 grossAmount/fee/net은 원 단위, 프론트 mock 표시는 만원 단위라 /10000으로 변환
const toManwon = (won: number) => Math.round(won / 10_000)

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
function startOfWeek(d: Date) {
  return addDays(d, -d.getDay()) // 일요일 시작
}
function fmtDayLabel(iso: string) {
  const d = new Date(iso)
  const wd = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(d)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${wd})`
}

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

const wonComma = (won: number) => won.toLocaleString('ko-KR')
// 그리드 셀은 폭이 좁아 만원 단위로 축약 (예: 2,800,000 → 280만)
const manShort = (won: number) => `${Math.round(won / 10_000).toLocaleString('ko-KR')}만`

// 가중치 비율대로 정수 total을 분배 (최대 잔여법 — 합이 정확히 total)
function distribute(total: number, weights: number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0)
  if (sum <= 0 || total <= 0) return weights.map(() => 0)
  const exact = weights.map((w) => (total * w) / sum)
  const counts = exact.map(Math.floor)
  let rem = total - counts.reduce((s, n) => s + n, 0)
  const order = exact.map((e, i) => ({ i, frac: e - Math.floor(e) })).sort((a, b) => b.frac - a.frac)
  for (let k = 0; rem > 0 && k < order.length; k++, rem--) counts[order[k].i]++
  return counts
}
const CAL_KIND_LABEL: Record<CalendarEvent['kind'], string> = {
  income: '정산 입금',
  expense: '고정비 지출',
  filing: '세금 신고',
}
const CAL_KIND_DOT: Record<CalendarEvent['kind'], string> = {
  income: 'bg-positive',
  expense: 'bg-danger',
  filing: 'bg-warning',
}

function BriefingCalendar({ events, todayIso }: { events: CalendarEvent[]; todayIso: string }) {
  const [selDate, setSelDate] = useState<string | null>(todayIso)

  const byDate = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    const arr = byDate.get(e.date) ?? []
    arr.push(e)
    byDate.set(e.date, arr)
  }

  const gridStart = startOfWeek(new Date(todayIso))
  const WEEKS = 6
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = addDays(gridStart, i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { d, iso, events: byDate.get(iso) ?? [] }
  })
  const weekdayNames = ['일', '월', '화', '수', '목', '금', '토']

  const selEvents = selDate ? byDate.get(selDate) ?? [] : []

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-ink-400">
        {weekdayNames.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map(({ d, iso, events }) => {
          const isToday = iso === todayIso
          const isSel = iso === selDate
          const income = events.filter((e) => e.kind === 'income').reduce((s, e) => s + e.amount, 0)
          const expense = events.filter((e) => e.kind === 'expense').reduce((s, e) => s + e.amount, 0)
          const hasFiling = events.some((e) => e.kind === 'filing')
          const hasAny = events.length > 0
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelDate(iso)}
              className={`flex min-h-[58px] flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 transition hover:bg-slate-50 ${
                isSel ? 'bg-brand-50' : ''
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-sm tabular-nums ${
                  isToday
                    ? 'bg-brand-600 font-bold text-white'
                    : hasAny
                      ? 'text-ink-700'
                      : 'text-ink-300'
                }`}
              >
                {d.getDate()}
              </span>
              {income > 0 && (
                <span className="w-full truncate px-0.5 text-center text-[10px] font-semibold leading-tight tabular-nums text-brand-600">
                  +{manShort(income)}
                </span>
              )}
              {expense > 0 && (
                <span className="w-full truncate px-0.5 text-center text-[10px] font-semibold leading-tight tabular-nums text-danger">
                  -{manShort(expense)}
                </span>
              )}
              {hasFiling && (
                <span className="w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight text-warning">
                  신고
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 선택한 날짜 상세 */}
      {selDate && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="mb-2 text-sm font-bold text-ink-700">{fmtDayLabel(selDate)}</div>
          {selEvents.length ? (
            <ul className="space-y-2">
              {selEvents.map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${CAL_KIND_DOT[e.kind]}`} />
                    <span className="text-ink-400">{CAL_KIND_LABEL[e.kind]}</span>
                    <span className="font-medium text-ink-700">{e.label}</span>
                  </span>
                  {e.amount > 0 && (
                    <span
                      className={`font-semibold tabular-nums ${e.kind === 'income' ? 'text-brand-600' : 'text-danger'}`}
                    >
                      {e.kind === 'income' ? '+' : '-'}
                      {wonComma(e.amount)}원
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-400">예정된 일정이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { mode, demo } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [platforms, setPlatforms] = useState<PlatformSummary[]>([])
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [alertOpen, setAlertOpen] = useState(false)
  const [dayIdx, setDayIdx] = useState<number | null>(null) // null이면 마지막(오늘)

  useEffect(() => {
    if (mode === 'demo') {
      setSummary(demo.dashboardSummary)
      setPlatforms(demo.platforms)
      setBriefing(demo.briefing)
      return
    }
    setSummary(null)
    setError(null)
    Promise.all([getDashboardSummary(), getPlatforms()])
      .then(([s, p]) => {
        setSummary(s)
        setPlatforms(p)
      })
      .catch((e) => setError(e.message))
    getBriefing().then(setBriefing).catch(() => setBriefing(null))
  }, [mode, demo, retryKey])

  if (error) {
    return <ErrorBanner message={error} onRetry={() => setRetryKey((k) => k + 1)} />
  }
  if (!summary) {
    return <PageSkeleton />
  }

  const { days } = summary
  const idx = dayIdx ?? days.length - 1
  const day = days[idx]
  const todayIso = days[days.length - 1].date

  // 가동률 — venue 전체 하나의 값(연결 플랫폼 기준)
  const connected = platforms.filter((p) => p.connected)
  const occupancyRate = connected.length
    ? Math.round(connected.reduce((s, p) => s + p.occupancy, 0) / connected.length)
    : 0
  // 플랫폼별 "예약 비중" — 선택한 날짜의 플랫폼별 예약 건수에 따라 비율(%)이 매일 달라짐.
  // 월 비중을 기준으로 날짜(일)에 따른 결정적 편차를 줘 그날의 예약을 플랫폼에 분배한다.
  const bookingTotal = platforms.reduce((s, p) => s + p.bookings, 0)
  const dom = new Date(day.date).getDate()
  const dayWeights = platforms.map((p, i) => {
    const base = bookingTotal > 0 ? p.bookings / bookingTotal : 1
    const jitter = 0.7 + (((dom * (i + 3)) % 10) / 10) * 0.6 // 0.7~1.3 결정적 편차
    return base * jitter
  })
  const dayCounts = distribute(day.bookings, dayWeights)
  const dayBookingTotal = dayCounts.reduce((s, n) => s + n, 0) || 1
  const platformDay = platforms.map((p, i) => {
    const count = dayCounts[i]
    return { p, count, pct: Math.round((count / dayBookingTotal) * 100), width: (count / dayBookingTotal) * 100 }
  })

  return (
    <div>
      <PageHeader
        title="오늘의 운영 현황"
        subtitle="하루 단위 매출·수수료·정산 현황"
        action={
          <button
            onClick={() => setAlertOpen((v) => !v)}
            aria-label="알림 메시지 열기"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-ink-500 transition hover:bg-slate-50 hover:text-ink-700"
          >
            <MessageSquare size={18} />
            {briefing?.cashRisk && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
            )}
          </button>
        }
      />

      {/* 날짜 이동 */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
        <button
          onClick={() => setDayIdx(Math.max(0, idx - 1))}
          disabled={idx <= 0}
          aria-label="이전 날짜"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-500 transition hover:bg-slate-50 hover:text-ink-700 disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-bold text-ink-700">
          {fmtDayLabel(day.date)}
          {idx === days.length - 1 && (
            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
              오늘
            </span>
          )}
        </div>
        <button
          onClick={() => setDayIdx(Math.min(days.length - 1, idx + 1))}
          disabled={idx >= days.length - 1}
          aria-label="다음 날짜"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-500 transition hover:bg-slate-50 hover:text-ink-700 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 상단 요약 — 선택한 날짜 기준 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="총 매출"
          value={fmtMan(toManwon(day.gross))}
          sub={`예약 ${day.bookings}건`}
          tone="positive"
        />
        <StatCard
          label="플랫폼 수수료"
          value={fmtMan(toManwon(day.fee))}
          sub={`매출의 ${day.gross > 0 ? ((day.fee / day.gross) * 100).toFixed(1) : '0'}%`}
          tone="danger"
        />
        <StatCard label="실제 순수익" value={fmtMan(toManwon(day.net))} sub="수수료 차감 후" />
        <StatCard
          label="가동률"
          value={`${occupancyRate}%`}
          sub={`공실률 ${100 - occupancyRate}%`}
        />
      </div>

      {/* 플랫폼별 예약 비중 — 전체 가동률 중 각 플랫폼이 가져온 예약 비율 */}
      <Card className="mt-4">
        <CardTitle
          right={
            <span className="text-xs text-ink-400">
              {fmtDayLabel(day.date)} · 예약 <b className="text-ink-700">{day.bookings}건</b>
            </span>
          }
        >
          플랫폼별 예약 비중
        </CardTitle>

        {/* 누적 비율 막대 */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
          {platformDay.map(
            ({ p, width, pct }) =>
              width > 0 && (
                <div
                  key={p.key}
                  style={{ width: `${width}%`, backgroundColor: p.color }}
                  title={`${p.name} ${pct}%`}
                />
              ),
          )}
        </div>

        {/* 플랫폼별 비중 */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {platformDay.map(({ p, count, pct }) => (
            <div key={p.key}>
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="truncate">{p.name}</span>
              </div>
              <div className="mt-1 text-2xl font-extrabold" style={{ color: p.color }}>
                {pct}%
              </div>
              <div className="mt-0.5 text-[11px] text-ink-400">예약 {count}건</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 자금 부족 알림 — 메시지 아이콘 클릭 시 열리는 모달 (배경 클릭 시 닫힘) */}
      {briefing?.cashRisk && alertOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20 md:items-center md:pt-4"
          onClick={() => setAlertOpen(false)}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              navigate('/app/forecast')
            }}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/app/forecast')}
            className="relative flex w-full max-w-sm cursor-pointer flex-col gap-3 break-keep rounded-2xl border border-red-100 bg-red-50 p-4 shadow-card transition hover:shadow-lg"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                setAlertOpen(false)
              }}
              aria-label="닫기"
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-ink-400 hover:bg-white/60 hover:text-ink-700"
            >
              <X size={16} />
            </button>

            {/* 경고 */}
            <div className="flex items-start gap-3 pr-6">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-danger text-white">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="font-bold text-danger">{briefing.cashRisk.period} 자금 부족 우려</div>
                <p className="mt-1 text-sm text-ink-700">{briefing.cashRisk.reason}</p>
              </div>
            </div>

            <hr className="border-red-200/70" />

            {/* 대응 — 예측 위험 배너와 동일한 형식(소제목 없이 아이콘+본문) */}
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
                <Lightbulb size={18} />
              </div>
              <p className="pt-1.5 text-sm text-ink-700">{briefing.cashRisk.suggestion}</p>
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold text-brand-600">
              현금흐름 예측에서 자세히 보기 <ChevronRight size={13} />
            </div>
          </div>
        </div>
      )}

      {/* 운영 캘린더 (구 오늘의 브리핑) */}
      {briefing && (
        <Card className="mt-4 border-l-4 border-l-brand-500">
          <CardTitle right={<span className="text-xs text-ink-400">{briefing.date}</span>}>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} className="text-brand-600" /> 운영 캘린더
            </span>
          </CardTitle>
          {briefing.calendar && briefing.calendar.length ? (
            <BriefingCalendar events={briefing.calendar} todayIso={todayIso} />
          ) : (
            <p className="text-sm text-ink-400">예정된 일정이 없습니다.</p>
          )}
        </Card>
      )}
    </div>
  )
}
