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
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f0f12',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
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
              theme="dark"
              toastOptions={{
                style: {
                  background: 'oklch(0.13 0.005 270)',
                  border: '1px solid oklch(0.2 0.01 270)',
                  color: 'oklch(0.95 0 0)',
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
