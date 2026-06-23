import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { enterDemo } = useAuth()
  const navigate = useNavigate()

  function go() {
    enterDemo()
    navigate('/app/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
      <button onClick={go} className="rounded-xl bg-brand-600 px-8 py-4 text-lg font-bold text-white">
        체험하기
      </button>
    </div>
  )
}
