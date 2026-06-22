import type { ReactNode } from 'react'

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
