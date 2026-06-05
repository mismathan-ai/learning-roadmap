import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Learning Roadmap',
  description: 'Personal learning roadmap tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
