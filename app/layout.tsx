import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AdIntel — Plataforma de análisis publicitario',
  description:
    'Analiza y optimiza tus campañas de Meta Ads, Google Ads y HubSpot con inteligencia artificial.',
  keywords: ['marketing', 'ads', 'analytics', 'meta', 'google ads', 'hubspot'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${plusJakartaSans.variable} ${dmSans.variable}`}>
      <body className="antialiased bg-[#0A0F1E] text-white font-sans">
        {children}
      </body>
    </html>
  )
}
