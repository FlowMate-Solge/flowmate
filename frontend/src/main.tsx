import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import App from './App'
import Dashboard from './pages/Dashboard'
import Sales from './pages/Sales'
import Forecast from './pages/Forecast'
import Actions from './pages/Actions'
import Connect from './pages/Connect'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'sales', element: <Sales /> },
      { path: 'forecast', element: <Forecast /> },
      { path: 'actions', element: <Actions /> },
      { path: 'connect', element: <Connect /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
