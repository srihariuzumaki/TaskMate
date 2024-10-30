'use client'

import React from 'react'
import { BarChart, Book, Clock, Edit, LogOut, Settings } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { auth } from '@/firebase/config'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { useAlert } from '@/hooks/useAlert'

export function ProfileComponent() {
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
    <div className="flex flex-col min-h-screen bg-[#E6F3F5]">
      <header className="bg-[#A0D2DB] text-[#1A5F7A] p-4">
        <h1 className="text-xl font-bold">Profile</h1>
      </header>

      <main className="flex-1 p-4 space-y-4">
        <Card className="bg-white border-[#A0D2DB]">
          <CardContent className="flex flex-col items-center pt-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src="/placeholder.svg?height=96&width=96" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-bold text-[#1A5F7A]">John Doe</h2>
            <p className="text-[#57A7B3]">Computer Science Student</p>
            <Button variant="outline" className="mt-4">
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#A0D2DB]">
          <CardHeader>
            <CardTitle className="text-[#1A5F7A]">Study Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#1A5F7A]">Total Study Time</span>
                <span className="font-bold text-[#1A5F7A]">120h 45m</span>
              </div>
              <Progress value={75} className="h-2 bg-[#E6F3F5]" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#1A5F7A]">Completed Tasks</span>
                <span className="font-bold text-[#1A5F7A]">85/100</span>
              </div>
              <Progress value={85} className="h-2 bg-[#E6F3F5]"  />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#1A5F7A]">Current Streak</span>
                <span className="font-bold text-[#1A5F7A]">7 days</span>
              </div>
              <Progress value={70} className="h-2 bg-[#E6F3F5]"  />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="w-full py-6 flex flex-col items-center">
            <Settings className="mb-2 h-6 w-6 text-[#57A7B3]" />
            <span>Settings</span>
          </Button>
          <Button variant="outline" className="w-full py-6 flex flex-col items-center">
            <BarChart className="mb-2 h-6 w-6 text-[#57A7B3]" />
            <span>Detailed Stats</span>
          </Button>
          <Button variant="outline" className="w-full py-6 flex flex-col items-center">
            <Book className="mb-2 h-6 w-6 text-[#57A7B3]" />
            <span>Study History</span>
          </Button>
          <Button variant="outline" className="w-full py-6 flex flex-col items-center">
            <Clock className="mb-2 h-6 w-6 text-[#57A7B3]" />
            <span>Time Tracking</span>
          </Button>
        </div>

        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Log Out
        </Button>
      </main>
    </div>
  )
}