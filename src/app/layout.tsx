import React from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { RootLayoutWrapper } from '@/components/RootLayoutWrapper'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootLayoutWrapper>{children}</RootLayoutWrapper>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
