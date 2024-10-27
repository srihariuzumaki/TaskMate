'use client'

import React from 'react'
import { Bell, Book, Calendar, FileText, Home, Plus, User, Upload, Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function DashboardComponent() {
  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3F5]">
      {/* Header */}
      <header className="bg-[#A0D2DB] text-[#1A5F7A] p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">StudySync</h1>
        <Avatar>
          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="duedates">Due Dates</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4">
            {/* Upcoming Tasks */}
            <Card className="bg-white border-[#A0D2DB]">
              <CardHeader>
                <CardTitle className="text-[#1A5F7A]">Upcoming Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#1A5F7A]">Math Assignment</span>
                    <span className="text-sm text-[#57A7B3]">Due in 2 days</span>
                  </div>
                  <Progress value={75} className="h-2 bg-[#E6F3F5]" />
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#1A5F7A]">Physics Quiz</span>
                    <span className="text-sm text-[#57A7B3]">Due in 4 days</span>
                  </div>
                  <Progress value={30} className="h-2 bg-[#E6F3F5]" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Materials */}
            <Card className="bg-white border-[#A0D2DB]">
              <CardHeader>
                <CardTitle className="text-[#1A5F7A]">Recent Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-6 w-6 text-[#57A7B3]" />
                      <div>
                        <p className="font-medium text-[#1A5F7A]">Chemistry Notes</p>
                        <p className="text-sm text-[#57A7B3]">Updated 2 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Book className="h-6 w-6 text-[#57A7B3]" />
                      <div>
                        <p className="font-medium text-[#1A5F7A]">History Textbook</p>
                        <p className="text-sm text-[#57A7B3]">Shared by John</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <FileText className="h-6 w-6 text-[#57A7B3]" />
                      <div>
                        <p className="font-medium text-[#1A5F7A]">English Essay</p>
                        <p className="text-sm text-[#57A7B3]">Draft</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white border-[#A0D2DB]">
              <CardHeader>
                <CardTitle className="text-[#1A5F7A]">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 overflow-x-auto pb-2">
                  <Button className="flex flex-col items-center space-y-1 h-auto py-4 bg-[#57A7B3] text-white hover:bg-[#1A5F7A]">
                    <Plus className="h-5 w-5" />
                    <span>Add Task</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center space-y-1 h-auto py-4 border-[#57A7B3] text-[#1A5F7A] hover:bg-[#E6F3F5]">
                    <Upload className="h-5 w-5" />
                    <span>Upload Material</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center space-y-1 h-auto py-4 border-[#57A7B3] text-[#1A5F7A] hover:bg-[#E6F3F5]">
                    <Calendar className="h-5 w-5" />
                    <span>Add Due Date</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="duedates" className="space-y-4">
            <Card className="bg-white border-[#A0D2DB]">
              <CardHeader>
                <CardTitle className="text-[#1A5F7A]">Upcoming Due Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[#1A5F7A]">Math Assignment</p>
                        <p className="text-sm text-[#57A7B3]">Chapter 5 Problems</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-[#57A7B3]" />
                        <span className="text-sm text-[#57A7B3]">May 15, 2023</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[#1A5F7A]">Physics Quiz</p>
                        <p className="text-sm text-[#57A7B3]">Mechanics</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-[#57A7B3]" />
                        <span className="text-sm text-[#57A7B3]">May 17, 2023</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[#1A5F7A]">English Essay</p>
                        <p className="text-sm text-[#57A7B3]">Shakespeare Analysis</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-[#57A7B3]" />
                        <span className="text-sm text-[#57A7B3]">May 20, 2023</span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <Card className="bg-white border-[#A0D2DB]">
              <CardHeader>
                <CardTitle className="text-[#1A5F7A]">Study Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-6 w-6 text-[#57A7B3]" />
                      <div>
                        <p className="font-medium text-[#1A5F7A]">Chemistry Notes</p>
                        <p className="text-sm text-[#57A7B3]">Organic Chemistry - Chapter 3</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Book className="h-6 w-6 text-[#57A7B3]" />
                      <div>
                        <p className="font-medium text-[#1A5F7A]">History Textbook</p>
                        <p className="text-sm text-[#57A7B3]">World War II</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <FileText className="h-6 w-6 text-[#57A7B3]" />
                      <div>
                        <p className="font-medium text-[#1A5F7A]">Math Formulas</p>
                        <p className="text-sm text-[#57A7B3]">Calculus Cheat Sheet</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <FileText className="h-6 w-6 text-[#57A7B3]" />
                      <div>
                        <p className="font-medium text-[#1A5F7A]">Physics Lab Report</p>
                        <p className="text-sm text-[#57A7B3]">Pendulum Experiment</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <Button className="w-full mt-4 bg-[#57A7B3] text-white hover:bg-[#1A5F7A]">
                  <Upload className="h-5 w-5 mr-2" />
                  <span>Upload New Material</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Remove the Bottom Navigation section */}
    </div>
  )
}
