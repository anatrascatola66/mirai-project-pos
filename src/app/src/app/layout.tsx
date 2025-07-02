import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mirai Project POS - Modern Point of Sale System',
  description: 'Professional POS system with inventory management, PWA support, and modern design. Built for retail businesses by Mirai Project.',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['pos', 'point of sale', 'inventory', 'retail', 'mirai project', 'pwa'],
  authors: [
    { name: 'Mirai Project' },
  ],
  creator: 'Mirai Project',
  publisher: 'Mirai Project',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/icon-192x192.png',
    shortcut: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mirai POS',
  },
  openGraph: {
    type: 'website',
    siteName: 'Mirai Project POS',
    title: 'Mirai Project POS - Modern Point of Sale System',
    description: 'Professional POS system with inventory management and PWA support',
  },
  twitter: {
    card: 'summary',
    title: 'Mirai Project POS - Modern Point of Sale System',
    description: 'Professional POS system with inventory management and PWA support',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />  
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mirai POS" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#8B5CF6" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
