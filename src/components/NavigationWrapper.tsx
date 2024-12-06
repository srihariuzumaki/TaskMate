'use client'

import { usePathname } from 'next/navigation'
import { Navigation } from './Navigation'

export function NavigationWrapper() {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  
  if (isAuthPage) {
    return null
  }
  
  return <Navigation />
} 