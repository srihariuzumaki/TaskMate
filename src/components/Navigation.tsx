import React from 'react'
import { Home, Calendar, Book, User, LogIn } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export function Navigation() {
  const { user } = useAuth()

  return (
    <nav className="bg-[#A0D2DB] p-4">
      <ul className="flex justify-around">
        <li>
          <Link href="/dashboard" className="flex flex-col items-center text-[#1A5F7A]">
            <Home className="h-6 w-6" />
            <span>Home</span>
          </Link>
        </li>
        <li>
          <Link href="/planner" className="flex flex-col items-center text-[#1A5F7A]">
            <Calendar className="h-6 w-6" />
            <span>Planner</span>
          </Link>
        </li>
        <li>
          <Link href="/materials" className="flex flex-col items-center text-[#1A5F7A]">
            <Book className="h-6 w-6" />
            <span>Materials</span>
          </Link>
        </li>
        {user ? (
          <li>
            <Link href="/profile" className="flex flex-col items-center text-[#1A5F7A]">
              <User className="h-6 w-6" />
              <span>Profile</span>
            </Link>
          </li>
        ) : (
          <li>
            <Link href="/login" className="flex flex-col items-center text-[#1A5F7A]">
              <LogIn className="h-6 w-6" />
              <span>Login</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
