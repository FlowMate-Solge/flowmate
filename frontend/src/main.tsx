import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sales from './pages/Sales'
import Forecast from './pages/Forecast'
import Actions from './pages/Actions'
import PriceCalculator from './pages/PriceCalculator'
import Connect from './pages/Connect'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  {
    path: '/app',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'sales', element: <Sales /> },
      { path: 'forecast', element: <Forecast /> },
      { path: 'actions', element: <Actions /> },
      { path: 'price', element: <PriceCalculator /> },
      { path: 'connect', element: <Connect /> },
    ],
  },
  // 기존 /dashboard 링크 호환
  { path: '/dashboard', element: <Navigate to="/app/dashboard" replace /> },
  { path: '/sales', element: <Navigate to="/app/sales" replace /> },
  { path: '/forecast', element: <Navigate to="/app/forecast" replace /> },
  { path: '/actions', element: <Navigate to="/app/actions" replace /> },
  { path: '/connect', element: <Navigate to="/app/connect" replace /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
