'use client'

import React from 'react'
import { NavigationWrapper } from './NavigationWrapper'
import { AlertComponent } from './alert-component'
import { Providers } from './Providers'

export function RootLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 pb-16">
          {children}
        </main>
        <NavigationWrapper />
        <AlertComponent />
      </div>
    </Providers>
  )
} 