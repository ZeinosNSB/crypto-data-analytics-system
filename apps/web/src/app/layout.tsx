import './global.css'
import AppProvider from '@workspace/web/components/app-provider'
import { envConfig } from '@workspace/web/config/env'
import { cn } from '@workspace/web/lib/utils'
import { baseOpenGraph } from '@workspace/web/shared-metadata'
import { Geist, JetBrains_Mono } from 'next/font/google'
import type { Metadata } from 'next'

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans'
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['vietnamese', 'latin']
})

export const metadata: Metadata = {
  metadataBase: new URL(envConfig.NEXT_PUBLIC_URL),
  title: 'Crypto Data Analytics Platform',
  description:
    'A high-performance platform for ingesting, processing, and analyzing real-time cryptocurrency data from Binance. Built for scalable data pipelines, market insights, and advanced analytics.',
  openGraph: {
    ...baseOpenGraph
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={cn('antialiased', fontSans.variable, 'font-mono', jetbrainsMono.variable)}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
