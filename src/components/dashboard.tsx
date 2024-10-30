'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { auth } from '@/firebase/config'
import { User } from 'firebase/auth'
import { FileText, Book, Plus, Upload, Calendar, Play, Pause, RefreshCw } from 'lucide-react'

type TimerStatus = 'work' | 'break';
type TimerState = 'running' | 'paused';

export function DashboardComponent() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 minutes in seconds
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('work');
  const [timerState, setTimerState] = useState<TimerState>('paused');

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

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState === 'running') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            switchMode();
            return prev - 1;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerState]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setTimerState(prev => prev === 'running' ? 'paused' : 'running');
  };

  const resetTimer = () => {
    setTimerState('paused');
    setTimerStatus('work');
    setTimeLeft(25 * 60);
  };

  const switchMode = () => {
    setTimerState('paused');
    if (timerStatus === 'work') {
      setTimerStatus('break');
      setTimeLeft(5 * 60); // 5 minutes break
    } else {
      setTimerStatus('work');
      setTimeLeft(25 * 60);
    }
  };

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3F5]">
      <header className="bg-[#A0D2DB] p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1A5F7A]">Taskmate</h1>
        <Button variant="ghost" className="rounded-full" onClick={() => router.push('/profile')}>
          <span className="sr-only">User menu</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1A5F7A]"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </Button>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="bg-white rounded-full p-1">
            <TabsTrigger value="dashboard" className="rounded-full">Dashboard</TabsTrigger>
            <TabsTrigger value="techniques" className="rounded-full">Study Techniques</TabsTrigger>
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
          <TabsContent value="techniques">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#1A5F7A]">Pomodoro Timer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-6xl font-bold text-[#1A5F7A]">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="flex space-x-4">
                      <Button className="bg-[#57A7B3] hover:bg-[#1A5F7A]" onClick={toggleTimer}>
                        {timerState === 'paused' ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                      </Button>
                      <Button variant="outline" onClick={resetTimer}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                    <div className="text-sm text-[#57A7B3]">
                      {timerStatus === 'work' ? 'Work for 25 minutes, then take a 5-minute break' : 'Take a 5-minute break, then work for 25 minutes'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[#1A5F7A]">Study Techniques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-[#1A5F7A]">1. Active Recall</h3>
                      <p className="text-[#57A7B3]">Test yourself on what you've learned without referring to your notes. This helps strengthen memory and identifies knowledge gaps.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-[#1A5F7A]">2. Spaced Repetition</h3>
                      <p className="text-[#57A7B3]">Review material at increasing intervals to improve long-term retention. Start with daily reviews, then weekly, then monthly.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-[#1A5F7A]">3. Mind Mapping</h3>
                      <p className="text-[#57A7B3]">Create visual representations of concepts and their relationships. Great for understanding complex topics and their connections.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-[#1A5F7A]">4. Feynman Technique</h3>
                      <p className="text-[#57A7B3]">Explain concepts in simple terms as if teaching someone else. This helps identify areas where your understanding needs improvement.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="materials">
            {/* Add content for Materials tab */}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
