'use client'

import React from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { AlertComponent } from '@/components/alert-component'
import { usePathname } from 'next/navigation'
import { Navigation } from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 pb-16">
            {children}
          </main>
          {!isAuthPage && <Navigation />}
        </div>
        <AlertComponent />
      </body>
    </html>
  )
}
