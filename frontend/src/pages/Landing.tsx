import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { useAuth } from '../contexts/AuthContext'

const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin
const outfit = { fontFamily: "'Outfit', system-ui, sans-serif" } as const

const features = [
  { num: '01', title: '멀티플랫폼 매출 통합', desc: '스페이스클라우드·네이버 예약 등 모든 채널을 한 화면에' },
  { num: '02', title: '30일 현금흐름 예측', desc: '정산일·고정비를 분석해 자금 부족 구간을 미리 감지' },
  { num: '03', title: 'AI 맞춤 행동 추천', desc: '플랫폼 전략·최적 가격대·정책자금까지 AI가 제안' },
  { num: '04', title: '세금·ROI 자동 계산', desc: '부가세 예비금과 초기 투자 회수 기간을 실시간으로' },
]

// ── 폰 프레임 ──────────────────────────────────────────────────
// 스크린: 390 × 820px / 뷰포트: 390px (1:1) → 앱이 실제 폰 크기로 렌더
const SCREEN_W = 390
const SCREEN_H = 820
const IFRAME_H = SCREEN_H   // fixed bottom-0 탭바가 잘리지 않으려면 동일하게

function PhoneFrame({ src }: { src: string }) {
  return (
    <div className="relative select-none" style={{ width: SCREEN_W + 24 }}>
      {/* 폰 외곽 — 얇은 베젤 */}
      <div
        className="relative shadow-[0_40px_120px_rgba(0,0,0,0.75)]"
        style={{
          borderRadius: 52,
          background: 'linear-gradient(160deg, #2c2c2c 0%, #0d0d0d 50%, #1a1a1a 100%)',
          padding: '12px 12px 12px',
        }}
      >
        {/* 상단 하이라이트 */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
          style={{
            borderRadius: '52px 52px 0 0',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
          }}
        />

        {/* 화면 */}
        <div
          className="relative overflow-hidden bg-white"
          style={{ width: SCREEN_W, height: SCREEN_H, borderRadius: 44 }}
        >
          {/* Dynamic Island — 상단 오버레이 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-[10px]">
            <div className="h-[28px] w-[100px] rounded-full bg-black shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
          </div>

          <iframe
            src={src}
            title="Flozy 미리보기"
            style={{
              width: SCREEN_W,
              height: IFRAME_H,
              border: 'none',
              display: 'block',
              pointerEvents: 'auto',
            }}
          />

          {/* 홈 인디케이터 — 하단 오버레이 (Dynamic Island과 대칭) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-[8px]">
            <div className="h-[4px] w-[120px] rounded-full bg-black/25" />
          </div>
        </div>
      </div>

      {/* 사이드 버튼 */}
      <div className="absolute top-[80px] -left-[4px] h-[28px] w-[4px] rounded-l-sm bg-[#252525]" />
      <div className="absolute top-[120px] -left-[4px] h-[64px] w-[4px] rounded-l-sm bg-[#252525]" />
      <div className="absolute top-[196px] -left-[4px] h-[64px] w-[4px] rounded-l-sm bg-[#252525]" />
      <div className="absolute top-[138px] -right-[4px] h-[88px] w-[4px] rounded-r-sm bg-[#252525]" />
    </div>
  )
}

export default function Landing() {
  const { mode, enterDemo } = useAuth()
  const navigate = useNavigate()

  function handleDemo() {
    enterDemo()
    navigate('/app/dashboard')
  }

  const previewUrl = `${window.location.origin}/app/dashboard`

  return (
    <div className="flex min-h-screen bg-[#faf9f7]">

      {/* ── 좌측 ───────────────────────────────────────────── */}
      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-[46%] md:px-10 lg:px-16 xl:px-24">

        {/* 로고 */}
        <div>
          <div style={{ ...outfit, letterSpacing: '-0.05em' }} className="text-[28px] font-bold leading-none text-ink-900 md:text-[40px]">
            flozy
          </div>
          <div className="mt-1 text-[11px] font-medium tracking-[0.18em] uppercase text-ink-400 md:mt-1.5 md:text-[12px]">
            자금 흐름, 편안하게
          </div>
        </div>

        {/* 헤드라인 */}
        <h1 style={outfit} className="mt-8 text-[2.2rem] font-bold leading-[1.1] tracking-tight text-ink-900 md:mt-10 md:text-[3.4rem]">
          공간 임대업<br />
          사장님의 자금을<br />
          <span className="text-brand-600">편안하게</span>
        </h1>

        <p className="mt-4 text-[14px] leading-relaxed text-ink-500 md:mt-5 md:text-[16px]">
          파티룸·게스트하우스·펜션 —<br />
          여러 플랫폼에 흩어진 매출을 하나로 모아,<br />
          현금이 언제 부족해질지 미리 알려드립니다.
        </p>

        {/* 기능 목록 — 발표용으로 크게 */}
        <div className="mt-7 space-y-5 md:mt-9 md:space-y-6">
          {features.map((f, i) => (
            <div key={f.num} className={`flex gap-5 ${i >= 2 ? 'hidden md:flex' : ''}`}>
              <span style={{ ...outfit }} className="mt-1 shrink-0 text-[13px] font-bold tracking-widest text-brand-500">
                {f.num}
              </span>
              <div>
                <div className="text-[17px] font-bold text-ink-800 md:text-[20px]">{f.title}</div>
                <div className="mt-1 text-[13px] text-ink-400 md:text-[15px]">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 md:mt-10">
          <button
            onClick={handleDemo}
            className="w-full rounded-2xl bg-brand-600 py-4 text-[16px] font-bold text-white shadow-lg hover:bg-brand-700 active:scale-95 transition-all md:w-auto md:px-8"
          >
            데모 체험하기 →
          </button>
        </div>

        {/* QR — 데스크톱에서만, 발표용으로 크게 */}
        <div className="mt-6 hidden items-center gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-4 md:inline-flex w-fit">
          <QRCode value={`${APP_URL}/app/dashboard`} size={80} fgColor="#0f172a" bgColor="#ffffff" />
          <div>
            <div className="text-[15px] font-bold text-ink-700">모바일에서 직접 체험</div>
            <div className="mt-1 text-[13px] text-ink-400">QR 스캔 → 바로 서비스 진입</div>
          </div>
        </div>
      </div>

      {/* ── 우측 — 폰 프레임 ──────────────────────────────── */}
      <div
        className="hidden md:flex md:w-[54%] overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #0a6e64 0%, #0d8a7e 40%, #064e46 100%)' }}
      >
        <div className="scale-[1.22]">
          <PhoneFrame src={previewUrl} />
        </div>
      </div>

    </div>
  )
}
