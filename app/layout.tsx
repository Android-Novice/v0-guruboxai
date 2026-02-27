import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/auth/auth-provider'
import { I18nProvider } from '@/components/i18n/i18n-provider'
import { GradientBackground } from '@/components/layout/gradient-background'
import { Navbar } from '@/components/layout/navbar'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'GuruBox.ai - AI Product Insight',
  description: 'Expert-level AI opportunity discovery. Enter your product direction and receive 300 evaluated opportunities.',
  generator: 'GuruBox.ai',
}

export const viewport: Viewport = {
  themeColor: '#f7f8fc',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen">
        <AuthProvider>
          <I18nProvider>
            <GradientBackground />
            <Navbar />
            <main className="pt-14">
              {children}
            </main>
            <Toaster
              position="top-right"
              theme="light"
              toastOptions={{
                style: {
                  background: 'oklch(0.995 0.002 250)',
                  border: '1px solid oklch(0.91 0.006 250)',
                  color: 'oklch(0.16 0.02 250)',
                },
              }}
            />
          </I18nProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
