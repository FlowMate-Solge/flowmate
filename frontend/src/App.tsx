import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  LineChart,
  MessageSquareText,
  Sun,
  Sparkles,
  Plug,
} from 'lucide-react'
import { persona } from './data/mock'
import AiAssistant from './components/AiAssistant'

const nav = [
  { to: '/dashboard', label: '운영 브리핑', short: '브리핑', icon: Sun },
  { to: '/sales', label: '매출 통합', short: '매출', icon: LayoutDashboard },
  { to: '/forecast', label: '현금흐름 예측', short: '예측', icon: LineChart },
  { to: '/actions', label: '행동 추천', short: '추천', icon: MessageSquareText },
  { to: '/connect', label: '데이터 연결', short: '연결', icon: Plug },
]

export default function App() {
  return (
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight">FlowMate</div>
            <div className="-mt-0.5 text-[11px] font-medium text-ink-400">
              플로우메이트
            </div>
          </div>
        </div>

        <nav className="mt-2 flex flex-col gap-1 px-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-500 hover:bg-slate-50 hover:text-ink-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto m-3 rounded-xl bg-slate-50 p-4">
          <div className="text-xs font-semibold text-ink-700">
            {persona.business}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-400">
            {persona.type} · {persona.years}년차 · {persona.name} 사장
          </div>
        </div>
      </aside>

      {/* 본문 */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-6 py-3.5 backdrop-blur">
          <div className="md:hidden flex items-center gap-2 font-extrabold">
            <Sparkles size={18} className="text-brand-600" /> FlowMate
          </div>
          <AiAssistant />
          <div className="flex items-center gap-3 text-sm text-ink-400">
            <span>2026. 06. 19 (금)</span>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {persona.name[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 pb-24 md:p-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* 모바일 하단 탭바 */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        {nav.map(({ to, short, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition ${
                isActive ? 'text-brand-600' : 'text-ink-400'
              }`
            }
          >
            <Icon size={20} />
            {short}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
