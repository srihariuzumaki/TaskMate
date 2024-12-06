import React from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { RootLayoutWrapper } from '@/components/RootLayoutWrapper'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootLayoutWrapper>{children}</RootLayoutWrapper>
      </body>
    </html>
  )
}
