'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { auth } from '@/firebase/config'
import { User } from 'firebase/auth'
import { FileText, Book, Plus, Upload, Calendar } from 'lucide-react'

export function DashboardComponent() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user)
      } else {
        router.push('/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3F5]">
      <header className="bg-[#A0D2DB] p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1A5F7A]">Taskmate</h1>
        <Button variant="ghost" className="rounded-full">
          <span className="sr-only">User menu</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1A5F7A]"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </Button>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="bg-white rounded-full p-1">
            <TabsTrigger value="dashboard" className="rounded-full">Dashboard</TabsTrigger>
            <TabsTrigger value="duedates" className="rounded-full">Due Dates</TabsTrigger>
            <TabsTrigger value="materials" className="rounded-full">Materials</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#1A5F7A]">Upcoming Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-[#1A5F7A]">Math Assignment</span>
                        <span className="text-sm text-[#57A7B3]">Due in 2 days</span>
                      </div>
                      <Progress value={75} className="h-2 bg-[#E6F3F5]" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-[#1A5F7A]">Physics Quiz</span>
                        <span className="text-sm text-[#57A7B3]">Due in 4 days</span>
                      </div>
                      <Progress value={30} className="h-2 bg-[#E6F3F5]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[#1A5F7A]">Recent Materials</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-[#57A7B3]" />
                      <div>
                        <p className="font-medium text-[#1A5F7A]">Chemistry Notes</p>
                        <p className="text-sm text-[#57A7B3]">Updated 2 days ago</p>
                      </div>
                    </li>
                    <li className="flex items-center">
                      <Book className="mr-2 h-4 w-4 text-[#57A7B3]" />
                      <div>
                        <p className="font-medium text-[#1A5F7A]">History Textbook</p>
                        <p className="text-sm text-[#57A7B3]">Shared by John</p>
                      </div>
                    </li>
                    <li className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-[#57A7B3]" />
                      <div>
                        <p className="font-medium text-[#1A5F7A]">English Essay</p>
                        <p className="text-sm text-[#57A7B3]">Draft</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[#1A5F7A]">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <Button className="flex-1 bg-[#57A7B3] hover:bg-[#1A5F7A]">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Material
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Calendar className="mr-2 h-4 w-4" />
                      Add Due Date
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="duedates">
            {/* Add content for Due Dates tab */}
          </TabsContent>
          <TabsContent value="materials">
            {/* Add content for Materials tab */}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
