'use client'

import React from 'react'
import Link from 'next/link'
import { Bell, Book, Calendar, FileText, Home, Plus, User, Upload, Clock, LogIn } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from '@/context/AuthContext'

export function DashboardComponent() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3F5]">
      {/* Header */}
      <header className="bg-[#A0D2DB] text-[#1A5F7A] p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">StudySync</h1>
        <div className="flex items-center space-x-4">
          {user ? (
            <Avatar>
              <AvatarImage src={user.photoURL || "/placeholder.svg?height=32&width=32"} alt="User" />
              <AvatarFallback>{user.displayName ? user.displayName[0] : 'U'}</AvatarFallback>
            </Avatar>
          ) : (
            <Link href="/login" passHref>
              <Button variant="ghost" className="text-[#1A5F7A]">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        {user ? (
          // Render dashboard content here (keep existing content)
          <Tabs defaultValue="dashboard" className="space-y-4">
            {/* ... existing tabs content ... */}
          </Tabs>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#1A5F7A] mb-4">Welcome to StudySync</h2>
            <p className="text-[#57A7B3] mb-4">Please log in to access your dashboard.</p>
            <Link href="/login" passHref>
              <Button>Log In</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
