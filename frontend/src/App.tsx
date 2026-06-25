import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LineChart, MessageSquareText, Plug, Sun, Building2 } from 'lucide-react'
import AiAssistant, { AiAssistantMobile } from './components/AiAssistant'
import { useAuth } from './contexts/AuthContext'
import { DEMO_BUSINESS } from './data/demoData'

const nav = [
  { to: '/app/dashboard', label: '운영 브리핑', short: '브리핑', icon: Sun },
  { to: '/app/sales',     label: '매출 통합',   short: '매출',  icon: LayoutDashboard },
  { to: '/app/forecast',  label: '현금흐름 예측', short: '예측', icon: LineChart },
  { to: '/app/actions',   label: '행동 추천',   short: '추천',  icon: MessageSquareText },
  { to: '/app/connect',   label: '데이터 연결', short: '연결',  icon: Plug },
]

const outfit = { fontFamily: "'Outfit', system-ui, sans-serif" } as const

function FlozyLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  if (size === 'sm') {
    return (
      <span style={{ ...outfit, letterSpacing: '-0.05em' }} className="text-[26px] font-bold text-ink-900">
        flozy
      </span>
    )
  }
  return (
    <div>
      <div style={{ ...outfit, letterSpacing: '-0.05em' }} className="text-[26px] font-bold leading-none text-ink-900">
        flozy
      </div>
      <div style={{ letterSpacing: '0.12em' }} className="mt-1.5 text-[10px] font-semibold uppercase text-ink-400">
        자금 흐름, 편안하게
      </div>
    </div>
  )
}

function SidebarProfile() {
  const b = DEMO_BUSINESS
  return (
    <div className="mx-3 mb-3 mt-auto">
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-start gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
            <Building2 size={15} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold text-ink-900">{b.name}</div>
            <div className="text-[11px] text-ink-400">{b.type} · {b.yearsOpen}년차</div>
          </div>
        </div>
        <div className="my-3 border-t border-stone-200" />
        <div className="text-[11px] text-ink-400">6월 19일 데이터 기준</div>
      </div>
    </div>
  )
}

export default function App() {
  const { mode, enterDemo } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!mode) {
      // iframe 미리보기 또는 QR 직접 진입(/app/...) → 자동 demo 시작
      if (window.self !== window.top) { enterDemo(); return }
      enterDemo()
    }
  }, [mode])

  if (!mode) return null

  return (
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-stone-200 bg-white sticky top-0 h-screen overflow-y-auto">
        <div className="px-5 py-6">
          <FlozyLogo size="md" />
        </div>
        <div className="mx-4 mb-2 border-t border-stone-100" />
        <nav className="flex flex-col gap-0.5 px-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? 'bg-brand-50 font-semibold text-brand-700'
                    : 'font-medium text-ink-500 hover:bg-stone-50 hover:text-ink-900'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <SidebarProfile />
      </aside>

      {/* 본문 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="md:hidden">
            <FlozyLogo size="sm" />
          </div>
          <div className="hidden md:block">
            <AiAssistant />
          </div>
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <AiAssistant />
            </div>
            <div className="hidden text-xs text-ink-400 sm:block">
              <span className="font-semibold text-ink-700">{DEMO_BUSINESS.ownerName}</span> 사장님
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {DEMO_BUSINESS.ownerName[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 pb-28 md:p-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* 모바일 하단 탭바 */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-stone-200 bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {nav.map(({ to, short, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-600' : 'text-ink-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{short}</span>
              </>
            )}
          </NavLink>
        ))}
        <AiAssistantMobile />
      </nav>
    </div>
  )
}
