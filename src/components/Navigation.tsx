'use client'

import React from 'react'
import { Home, Calendar, Book, User, LogIn } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { auth } from '@/firebase/config'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useAlert } from '@/hooks/useAlert'

export function Navigation() {
  const { user } = useAuth()
  const router = useRouter()
  const { showAlert } = useAlert()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      showAlert('Failed to sign out. Please try again.')
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#A0D2DB] p-3 border-t border-[#57A7B3]">
      <ul className="flex justify-around items-center max-w-screen-xl mx-auto">
        <li>
          <Link href="/dashboard" className="flex flex-col items-center text-[#1A5F7A]">
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
        </li>
        <li>
          <Link href="/planner" className="flex flex-col items-center text-[#1A5F7A]">
            <Calendar className="h-5 w-5" />
            <span className="text-xs mt-1">Planner</span>
          </Link>
        </li>
        <li>
          <Link href="/materials" className="flex flex-col items-center text-[#1A5F7A]">
            <Book className="h-5 w-5" />
            <span className="text-xs mt-1">Materials</span>
          </Link>
        </li>
        {user ? (
          <li>
            <Link href="/profile" className="flex flex-col items-center text-[#1A5F7A]">
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </li>
        ) : (
          <li>
            <button 
              onClick={handleLogout}
              className="flex flex-col items-center text-[#1A5F7A]"
            >
              <LogIn className="h-5 w-5" />
              <span className="text-xs mt-1">Log Out</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}
