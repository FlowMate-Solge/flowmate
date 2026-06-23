import { createContext, useContext, useState, type ReactNode } from 'react'

type Mode = 'demo' | null

interface AuthState {
  mode: Mode
  enterDemo: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // localStorage 미사용 — 새로고침하면 항상 랜딩부터 시작
  const [mode, setMode] = useState<Mode>(null)

  function enterDemo() {
    setMode('demo')
  }

  return (
    <AuthContext.Provider value={{ mode, enterDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
