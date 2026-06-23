import type { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export function PageHeader({
  title,
  subtitle,
  badge,
}: {
  title: string
  subtitle?: string
  badge?: string
}) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {badge && (
        <span className="pill bg-brand-50 text-brand-700">{badge}</span>
      )}
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`card p-5 ${className}`}>{children}</div>
}

export function CardTitle({
  children,
  right,
}: {
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-bold">{children}</h2>
      {right}
    </div>
  )
}

const toneMap = {
  positive: 'bg-green-50 text-positive',
  warning: 'bg-amber-50 text-warning',
  danger: 'bg-red-50 text-danger',
  neutral: 'bg-slate-100 text-ink-500',
  brand: 'bg-brand-50 text-brand-700',
}

export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: keyof typeof toneMap
}) {
  return <span className={`pill ${toneMap[tone]}`}>{children}</span>
}

// ── 로딩/에러 공통 컴포넌트 ────────────────────────────────

function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />
}

export function CardSkeleton() {
  return (
    <Card>
      <Sk className="h-3 w-24 mb-3" />
      <Sk className="h-7 w-36 mb-2" />
      <Sk className="h-3 w-20" />
    </Card>
  )
}

export function PageSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <Sk className="h-8 w-48 mb-2" />
        <Sk className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Sk className="h-4 w-40 mb-4" />
          <Sk className="h-64 w-full rounded-xl" />
        </Card>
        <Card>
          <Sk className="h-4 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Sk key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-danger">
        <AlertCircle size={28} />
      </div>
      <p className="mt-4 text-base font-bold text-ink-900">데이터를 불러오지 못했습니다</p>
      <p className="mt-1 max-w-xs text-sm text-ink-400">{message}</p>
      <p className="mt-1 text-xs text-ink-400">백엔드 서버가 실행 중인지 확인하세요 (포트 4000)</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <RefreshCw size={15} /> 다시 시도
        </button>
      )}
    </div>
  )
}
