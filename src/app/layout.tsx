import React from 'react'
import { Inter } from 'next/font/google'
import { Bell, Book, Calendar, Home, User } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          {children}
          <nav className="bg-[#A0D2DB] border-t border-[#57A7B3] mt-auto">
            <div className="flex justify-around items-center py-2 max-w-md mx-auto">
              <Link href="/">
                <Button variant="ghost" className="flex flex-col items-center text-[#1A5F7A] hover:text-white hover:bg-[#57A7B3]">
                  <Home className="h-5 w-5" />
                  <span className="text-xs mt-1">Home</span>
                </Button>
              </Link>
              <Link href="/planner">
                <Button variant="ghost" className="flex flex-col items-center text-[#1A5F7A] hover:text-white hover:bg-[#57A7B3]">
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs mt-1">Planner</span>
                </Button>
              </Link>
              <Link href="/materials">
                <Button variant="ghost" className="flex flex-col items-center text-[#1A5F7A] hover:text-white hover:bg-[#57A7B3]">
                  <Book className="h-5 w-5" />
                  <span className="text-xs mt-1">Materials</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" className="flex flex-col items-center text-[#1A5F7A] hover:text-white hover:bg-[#57A7B3]">
                  <User className="h-5 w-5" />
                  <span className="text-xs mt-1">Profile</span>
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </body>
    </html>
  )
}
