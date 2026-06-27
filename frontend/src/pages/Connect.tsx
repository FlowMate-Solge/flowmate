import { useEffect, useRef, useState } from 'react'
import {
  Building2,
  CalendarCheck,
  Check,
  CreditCard,
  Image as ImageIcon,
  Landmark,
  Loader2,
  Lock,
  Plus,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'
import { Card, CardTitle, PageHeader, Pill } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { parseSalesCsv } from '../lib/demoEngine'
import {
  addFixedCost,
  addSale,
  connectPlatform,
  getFixedCosts,
  getPlatforms,
  uploadSalesCsv,
  type FixedCost,
  type PlatformSummary,
} from '../lib/api'

interface Source {
  id: string
  name: string
  sub: string
  icon: typeof Building2
  connected: boolean
}

// 계좌·카드는 아직 마이데이터 연동 전이라 화면에서만 보여주는 데모 상태 (백엔드 연동은 v2)
const accountSources: Source[] = [
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
]

function toSource(p: PlatformSummary): Source {
  return {
    id: p.key,
    name: p.name,
    sub: '예약·정산·수수료 자동 동기화',
    icon: CalendarCheck,
    connected: p.connected,
  }
}

function SourceRow({
  s,
  onConnectClick,
}: {
  s: Source
  onConnectClick: (s: Source) => void
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
          onClick={() => onConnectClick(s)}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          연결하기
        </button>
      )}
    </div>
  )
}

type ConnectStep = 'login' | 'consent' | 'syncing'

// 연결하기 클릭 시 실제 플랫폼으로 이동하지 않고, 로그인→권한동의→동기화 절차를
// 앱 안에서 흉내내는 모달. 마지막 단계에서 onDone()이 실제 연결 처리를 한다.
function ConnectFlowModal({
  source,
  onClose,
  onDone,
}: {
  source: Source
  onClose: () => void
  onDone: () => void
}) {
  const [step, setStep] = useState<ConnectStep>('login')

  useEffect(() => {
    if (step !== 'syncing') return
    const t = setTimeout(onDone, 1300)
    return () => clearTimeout(t)
  }, [step, onDone])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <source.icon size={17} />
            </div>
            <div className="text-sm font-bold">{source.name}</div>
          </div>
          {step !== 'syncing' && (
            <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
              <X size={18} />
            </button>
          )}
        </div>

        {step === 'login' && (
          <>
            <h3 className="text-base font-bold">{source.name} 계정으로 로그인</h3>
            <p className="mt-1 text-xs text-ink-400">FlowMate가 사장님 계정에 안전하게 연결합니다.</p>
            <div className="mt-4 space-y-2.5">
              <input
                placeholder="아이디"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400"
              />
              <input
                type="password"
                placeholder="비밀번호"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <button
              onClick={() => setStep('consent')}
              className="mt-4 w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              로그인
            </button>
          </>
        )}

        {step === 'consent' && (
          <>
            <h3 className="text-base font-bold">FlowMate에 다음 권한을 허용할까요?</h3>
            <div className="mt-4 space-y-2.5">
              {['예약·매출 내역 조회', '정산·수수료 내역 조회', '예약률·공실 현황 조회'].map((perm) => (
                <div key={perm} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
                  <ShieldCheck size={15} className="shrink-0 text-brand-600" />
                  {perm}
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep('syncing')}
              className="mt-4 w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              동의하고 연결하기
            </button>
          </>
        )}

        {step === 'syncing' && (
          <div className="flex flex-col items-center py-4 text-center">
            <Loader2 size={28} className="animate-spin text-brand-600" />
            <p className="mt-4 text-sm font-medium text-ink-700">최근 정산·예약 내역을 가져오는 중...</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
              <Lock size={11} /> 안전하게 암호화되어 전송됩니다
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Connect() {
  const { mode, demo } = useAuth()
  const [platformSources, setPlatformSources] = useState<Source[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'demo') {
      setPlatformSources(demo.platforms.map(toSource))
      return
    }
    getPlatforms()
      .then((platforms) => setPlatformSources(platforms.map(toSource)))
      .catch((e) => setLoadError(e.message))
  }, [mode, demo])

  const sources = [...accountSources, ...platformSources]
  const connectedCount = sources.filter((s) => s.connected).length

  // 연결하기 클릭 시 모달로 로그인→권한동의→동기화 절차를 거친 뒤 실제 연결
  const [flowSource, setFlowSource] = useState<Source | null>(null)

  async function toggle(id: string) {
    if (mode === 'demo') {
      demo.connectPlatform(id)
      return
    }
    setPlatformSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, connected: true } : s)),
    )
    try {
      await connectPlatform(id)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '연결 실패')
    }
  }

  // 고정 지출비 입력
  const [costItem, setCostItem] = useState('')
  const [costDay, setCostDay] = useState('15')
  const [costAmount, setCostAmount] = useState('300000')
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([])

  useEffect(() => {
    if (mode === 'demo') {
      setFixedCosts(demo.store.fixedCosts.map((fc) => ({ ...fc, createdAt: '' })))
      return
    }
    getFixedCosts()
      .then(setFixedCosts)
      .catch((e) => setLoadError(e.message))
  }, [mode, demo])

  async function handleAddFixedCost() {
    if (!costItem.trim() || !costAmount) return
    if (mode === 'demo') {
      demo.addFixedCost(costItem.trim(), Number(costDay), Number(costAmount))
      setCostItem('')
      return
    }
    try {
      const created = await addFixedCost({
        item: costItem.trim(),
        dayOfMonth: Number(costDay),
        amount: Number(costAmount),
      })
      setFixedCosts((prev) => [...prev, created])
      setCostItem('')
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '고정비 등록 실패')
    }
  }

  // CSV 업로드
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  async function handleFileSelected(file: File) {
    setUploadStatus('업로드 중...')
    if (mode === 'demo') {
      try {
        const text = await file.text()
        const rows = parseSalesCsv(text)
        const result = demo.addSales(rows)
        setUploadStatus(
          result.errors.length > 0
            ? `${result.created}건 업로드 완료, ${result.errors.length}건 오류 (대시보드·예측에 반영됨)`
            : `${result.created}건 업로드 완료 — 대시보드·예측에 반영됨`,
        )
      } catch {
        setUploadStatus('CSV 형식을 확인해주세요 (플랫폼·날짜·매출액·예약 건수 순서)')
      }
      return
    }
    try {
      const result = await uploadSalesCsv(file)
      setUploadStatus(
        result.errors.length > 0
          ? `${result.created}건 업로드 완료, ${result.errors.length}건 오류`
          : `${result.created}건 업로드 완료`,
      )
    } catch (e) {
      setUploadStatus(e instanceof Error ? e.message : '업로드 실패')
    }
  }

  // 정산 내역 수기 입력 (플랫폼이 연동 안 될 때 직접 한 건씩 입력)
  const [saleAmount, setSaleAmount] = useState('')
  const [saleBookings, setSaleBookings] = useState('1')
  const [saleStatus, setSaleStatus] = useState<string | null>(null)
  const firstPlatformKey = platformSources[0]?.id ?? ''

  async function handleAddSale() {
    if (!firstPlatformKey || !saleAmount) return
    const platformKey = firstPlatformKey
    const grossAmount = Number(saleAmount)
    const bookings = Number(saleBookings) || 1
    if (mode === 'demo') {
      demo.addSales([{ platformKey, grossAmount, bookings }])
      setSaleStatus('등록 완료 — 대시보드·예측에 반영됨')
      setSaleAmount('')
      return
    }
    try {
      await addSale({ platformKey, date: new Date().toISOString().slice(0, 10), grossAmount, bookings })
      setSaleStatus('등록 완료')
      setSaleAmount('')
    } catch (e) {
      setSaleStatus(e instanceof Error ? e.message : '등록 실패')
    }
  }

  // 정산 캡처 이미지 업로드 — 미리보기만 제공 (OCR 자동 인식은 v2 범위)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageStatus, setImageStatus] = useState<string | null>(null)

  function handleImageSelected(file: File) {
    setImagePreview(URL.createObjectURL(file))
    setImageStatus('이미지 업로드됨 — 자동 인식(OCR)은 다음 버전에서 지원 예정입니다. 아래에서 직접 입력해주세요.')
  }

  return (
    <div>
      <PageHeader
        title="데이터 연결"
        subtitle="매출·정산·지출 자동 연동 현황"
      />

      {loadError && (
        <div className="mb-4 rounded-xl bg-danger/10 px-4 py-2 text-sm text-danger">
          데이터를 불러오지 못했습니다: {loadError}
        </div>
      )}

      {/* 마지막 동기화 */}
      <div className="mb-4 flex items-center gap-2 text-xs text-ink-400">
        <RefreshCw size={13} /> 마지막 동기화: 오늘 새벽 4:02 · {connectedCount}개 소스 연결됨
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
            {accountSources.map((s) => (
              <SourceRow key={s.id} s={s} onConnectClick={setFlowSource} />
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
            {platformSources.map((s) => (
              <SourceRow key={s.id} s={s} onConnectClick={setFlowSource} />
            ))}
          </div>
        </Card>
      </div>

      {/* 고정 지출비 입력 */}
      <Card className="mt-4">
        <div className="mb-1 flex items-center gap-2">
          <Plus size={18} className="text-brand-600" />
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
          onClick={handleAddFixedCost}
          className="mt-4 w-full rounded-xl bg-ink-900 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
        >
          매달 자동 나가는 돈에 기입하기
        </button>

        {fixedCosts.length > 0 && (
          <div className="mt-4 space-y-2">
            {fixedCosts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-ink-700 shadow-sm">
                    매월 {c.dayOfMonth}일
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
          연동이 안 되는 플랫폼은 CSV·정산 캡처를 올리거나 직접 한 건씩 입력해도 동일하게 반영됩니다.
        </p>

        {/* CSV 업로드 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelected(file)
            e.target.value = ''
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-7 text-ink-400 transition hover:border-brand-300 hover:bg-brand-50/40"
        >
          <Upload size={20} />
          <span className="text-sm font-medium">클릭해서 CSV 업로드</span>
          <span className="text-[11px]">플랫폼 · 날짜 · 매출액 · 예약 건수 순서로 정리된 파일</span>
        </button>
        {uploadStatus && (
          <p className="mt-2 text-center text-xs text-ink-500">{uploadStatus}</p>
        )}

        {/* 이미지(정산 캡처) 업로드 */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImageSelected(file)
            e.target.value = ''
          }}
        />
        <button
          onClick={() => imageInputRef.current?.click()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-ink-500 transition hover:bg-slate-50"
        >
          <ImageIcon size={16} /> 정산 내역 캡처(이미지) 업로드
        </button>
        {imagePreview && (
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <img src={imagePreview} alt="정산 캡처 미리보기" className="h-12 w-12 rounded-lg object-cover" />
            <p className="text-xs leading-relaxed text-ink-500">{imageStatus}</p>
          </div>
        )}

        {/* 정산 내역 수기 입력 */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-500">
            <ReceiptText size={14} /> 정산 내역 한 건 수기 입력 ({platformSources[0]?.name ?? '플랫폼'})
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="number"
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              placeholder="매출 금액(원)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={saleBookings}
                onChange={(e) => setSaleBookings(e.target.value)}
                placeholder="예약 건수"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 sm:w-24"
              />
              <button
                onClick={handleAddSale}
                className="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                추가
              </button>
            </div>
          </div>
          {saleStatus && <p className="mt-2 text-xs text-ink-500">{saleStatus}</p>}
        </div>
      </Card>

      {flowSource && (
        <ConnectFlowModal
          source={flowSource}
          onClose={() => setFlowSource(null)}
          onDone={() => {
            toggle(flowSource.id)
            setFlowSource(null)
          }}
        />
      )}
    </div>
  )
}
