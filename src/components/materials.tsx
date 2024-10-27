'use client'

import React from 'react'
import { Folder, Plus, Search, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export function MaterialsComponent() {
  const subjects = [
    { name: 'Mathematics', files: 12 },
    { name: 'Physics', files: 8 },
    { name: 'Chemistry', files: 10 },
    { name: 'Biology', files: 6 },
    { name: 'Computer Science', files: 15 },
    { name: 'Literature', files: 7 },
    { name: 'History', files: 9 },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3F5]">
      <header className="bg-[#A0D2DB] text-[#1A5F7A] p-4">
        <h1 className="text-xl font-bold">Study Materials</h1>
      </header>

      <main className="flex-1 p-4">
        <div className="mb-4 flex items-center space-x-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#57A7B3]" />
            <Input
              type="text"
              placeholder="Search materials..."
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Card className="bg-white border-[#A0D2DB]">
          <CardHeader>
            <CardTitle className="text-[#1A5F7A]">Subject Folders</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full pr-4">
              {subjects.map((subject, index) => (
                <div key={index} className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Folder className="h-5 w-5 text-[#57A7B3]" />
                    <div>
                      <p className="text-sm font-medium text-[#1A5F7A]">{subject.name}</p>
                      <p className="text-xs text-[#57A7B3]">{subject.files} files</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4 text-[#57A7B3]" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}