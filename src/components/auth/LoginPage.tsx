'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Eye, EyeOff, Lock, Zap } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    await new Promise(r => setTimeout(r, 400))
    const ok = login(password)
    if (!ok) {
      setError(true)
      setPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg)' }}>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #f97316, transparent)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', filter: 'blur(60px)' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="w-full max-w-sm mx-4 animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea6c10)' }}>
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              RoadMap
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Personal Learning</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          <div className="mb-6 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'var(--accent-dim)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <Lock size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              Welcome back
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enter your password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false) }}
                placeholder="Password"
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--bg-3)',
                  border: `1px solid ${error ? '#f43f5e' : 'var(--border)'}`,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={e => {
                  if (!error) e.target.style.borderColor = 'var(--accent)'
                }}
                onBlur={e => {
                  if (!error) e.target.style.borderColor = 'var(--border)'
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p className="text-xs animate-fade-in" style={{ color: '#f43f5e' }}>
                Incorrect password. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={!password || loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: loading ? 'var(--bg-3)' : 'linear-gradient(135deg, #f97316, #ea6c10)',
                color: loading ? 'var(--text-muted)' : 'white',
                fontFamily: 'var(--font-display)',
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Verifying...
                </span>
              ) : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
