'use client'

import { useAuth } from '@/lib/auth'
import LoginPage from '@/components/auth/LoginPage'
import DashboardPage from '@/components/roadmap/DashboardPage'

export default function Home() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <DashboardPage /> : <LoginPage />
}
