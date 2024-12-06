'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { auth } from '@/firebase/config'
import { User } from 'firebase/auth'
import { FileText, Book, Plus, Upload, Calendar, Play, Pause, RefreshCw, MessageSquare, Loader2, FolderIcon, ChevronRight, ArrowLeft } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { initializeUserData, getUserData, updateUserTasks, updateUserAssignments, updateUserExams, updateUserRecords } from '@/firebase/firestore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useFolderStore } from '@/store/folderStore'
import { Folder } from '@/types/materials'

type TimerStatus = 'work' | 'break';
type TimerState = 'running' | 'paused';

type UploadedResource = {
  id: string;
  name: string;
  summary: string;
  dateUploaded: string;
};

function AddTaskForm({ onAdd, onClose }: { onAdd: (name: string, time: string) => void, onClose: () => void }) {
  const [name, setName] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(name, `${startTime} - ${endTime}`)
    setName('')
    setStartTime('')
    setEndTime('')
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="task-name">Task Name</Label>
        <Input id="task-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="task-start-time">Start Time</Label>
        <Input
          id="task-start-time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="task-end-time">End Time</Label>
        <Input
          id="task-end-time"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>
      <Button type="submit">Add Task</Button>
    </form>
  )
}

function AddDueDateForm({ onAddAssignment, onAddExam, onAddRecord, onClose }: { 
  onAddAssignment: (name: string, date: string) => void, 
  onAddExam: (name: string, date: string) => void,
  onAddRecord: (name: string, date: string) => void,
  onClose: () => void 
}) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('assignment')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (type === 'assignment') {
      onAddAssignment(name, date)
    } else if (type === 'exam') {
      onAddExam(name, date)
    } else if (type === 'record') {
      onAddRecord(name, date)
    }
    setName('')
    setDate('')
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="due-date-name">Name</Label>
        <Input id="due-date-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="due-date">Date</Label>
        <Input id="due-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="due-date-type">Type</Label>
        <select id="due-date-type" value={type} onChange={(e) => setType(e.target.value)} className="w-full border rounded p-2">
          <option value="assignment">Assignment</option>
          <option value="exam">Exam</option>
          <option value="record">Record</option>
        </select>
      </div>
      <Button type="submit">Add Due Date</Button>
    </form>
  )
}

export function DashboardComponent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Array<{ name: string; time: string }>>([])
  const [assignments, setAssignments] = useState<Array<{ name: string; date: string }>>([])
  const [exams, setExams] = useState<Array<{ name: string; date: string }>>([])
  const [records, setRecords] = useState<Array<{ name: string; date: string }>>([])
  const router = useRouter()

  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 minutes in seconds
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('work');
  const [timerState, setTimerState] = useState<TimerState>('paused');

  const [uploadedResources, setUploadedResources] = useState<UploadedResource[]>([]);
  const [selectedResource, setSelectedResource] = useState<UploadedResource | null>(null);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const dialogCloseRef = useRef<HTMLButtonElement>(null)

  const { folders, setFolders } = useFolderStore()

  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);

  const addTask = async (name: string, time: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const newTask = { name, time };
    const newTasks = [...tasks, newTask];
    
    try {
      await updateUserTasks(currentUser.uid, newTasks);
      setTasks(newTasks);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const addAssignment = async (name: string, date: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const newAssignments = [...assignments, { name, date }];
    try {
      await updateUserAssignments(currentUser.uid, newAssignments);
      setAssignments(newAssignments);
    } catch (error) {
      console.error('Error adding assignment:', error);
    }
  };

  const addExam = async (name: string, date: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const newExams = [...exams, { name, date }];
    try {
      await updateUserExams(currentUser.uid, newExams);
      setExams(newExams);
    } catch (error) {
      console.error('Error adding exam:', error);
    }
  };

  const addRecord = async (name: string, date: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const newRecords = [...records, { name, date }];
    try {
      await updateUserRecords(currentUser.uid, newRecords);
      setRecords(newRecords);
    } catch (error) {
      console.error('Error adding record:', error);
    }
  };

  const closeDialog = () => {
    dialogCloseRef.current?.click()
  }

  const switchMode = useCallback(() => {
    setTimerState('paused');
    if (timerStatus === 'work') {
      setTimerStatus('break');
      setTimeLeft(5 * 60); // 5 minutes break
    } else {
      setTimerStatus('work');
      setTimeLeft(25 * 60);
    }
  }, [timerStatus]);

  useEffect(() => {
    const loadUserData = async (currentUser: User) => {
      try {
        await initializeUserData(currentUser.uid);
        const userData = await getUserData(currentUser.uid);
        if (userData) {
          setTasks(userData.tasks || []);
          setAssignments(userData.assignments || []);
          setExams(userData.exams || []);
          setRecords(userData.records || []);
          if (userData.folders) {
            setFolders(userData.folders as unknown as Folder[]);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        loadUserData(user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, setFolders]);

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
  }, [timerState, switchMode]);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    // TODO: Implement file upload to your backend/storage
    // TODO: Implement AI summarization
    // For now, we'll mock the response
    const mockResource: UploadedResource = {
      id: Date.now().toString(),
      name: file.name,
      summary: "AI-generated summary will appear here...",
      dateUploaded: new Date().toLocaleDateString()
    };

    setUploadedResources(prev => [...prev, mockResource]);
    setIsLoading(false);
  };

  const handleAskQuestion = async () => {
    if (!selectedResource || !question) return;
    
    setIsLoading(true);
    // TODO: Implement AI Q&A functionality
    // For now, we'll mock the response
    setAiResponse("This is a mock AI response. Implement actual AI integration here.");
    setIsLoading(false);
  };

  // Replace the hardcoded card content with dynamic content
  const renderUpcomingTasks = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#1A5F7A]">Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div key={`task-${index}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-[#1A5F7A]">{task.name}</span>
                <span className="text-sm text-[#57A7B3]">Time: {task.time}</span>
              </div>
              <Progress value={75} className="h-2 bg-[#E6F3F5]" />
            </div>
          ))}
          {assignments.map((assignment, index) => (
            <div key={`assignment-${index}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-[#1A5F7A]">{assignment.name}</span>
                <span className="text-sm text-[#57A7B3]">Due: {assignment.date}</span>
              </div>
              <Progress value={75} className="h-2 bg-[#E6F3F5]" />
            </div>
          ))}
          {exams.map((exam, index) => (
            <div key={`exam-${index}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-[#1A5F7A]">{exam.name}</span>
                <span className="text-sm text-[#57A7B3]">Due: {exam.date}</span>
              </div>
              <Progress value={75} className="h-2 bg-[#E6F3F5]" />
            </div>
          ))}
          {records.map((record, index) => (
            <div key={`record-${index}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-[#1A5F7A]">{record.name}</span>
                <span className="text-sm text-[#57A7B3]">Due: {record.date}</span>
              </div>
              <Progress value={75} className="h-2 bg-[#E6F3F5]" />
            </div>
          ))}
          {tasks.length === 0 && assignments.length === 0 && exams.length === 0 && records.length === 0 && (
            <p className="text-[#57A7B3] text-center py-4">No upcoming tasks or assignments</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E6F3F5]">
        <div className="text-[#1A5F7A] text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
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
              {renderUpcomingTasks()}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#1A5F7A]">
                    {currentFolder ? currentFolder.name : "Recent Materials"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentFolder ? (
                    <div>
                      <Button 
                        variant="ghost" 
                        className="mb-4"
                        onClick={() => setCurrentFolder(null)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Folders
                      </Button>
                      <ul className="space-y-2">
                        {currentFolder.files.length === 0 ? (
                          <p className="text-center text-[#57A7B3] py-4">No files in this folder</p>
                        ) : (
                          currentFolder.files.map((file) => (
                            <li key={file.id} className="flex items-center justify-between p-2 hover:bg-[#E6F3F5] rounded">
                              <div className="flex items-center">
                                <FileText className="mr-2 h-4 w-4 text-[#57A7B3]" />
                                <div>
                                  <p className="font-medium text-[#1A5F7A]">{file.name}</p>
                                  <p className="text-sm text-[#57A7B3]">
                                    Added {new Date(file.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {folders && folders.length === 0 ? (
                        <p className="text-center text-[#57A7B3] py-4">No folders created yet</p>
                      ) : (
                        folders.slice(0, 3).map((folder) => (
                          <li 
                            key={folder.id} 
                            className="flex items-center justify-between p-2 hover:bg-[#E6F3F5] rounded cursor-pointer"
                            onClick={() => {
                              setFolders(folders); // Ensure folders are in store
                              router.push('/materials');
                              // Store the selected folder ID in localStorage to retrieve it in materials page
                              localStorage.setItem('selectedFolderId', folder.id);
                            }}
                          >
                            <div className="flex items-center">
                              <FolderIcon className="mr-2 h-4 w-4 text-[#57A7B3]" />
                              <div>
                                <p className="font-medium text-[#1A5F7A]">{folder.name}</p>
                                <p className="text-sm text-[#57A7B3]">{folder.files.length} files</p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#57A7B3]" />
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[#1A5F7A]">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex-1 bg-[#57A7B3] hover:bg-[#1A5F7A]">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Task</DialogTitle>
                        </DialogHeader>
                        <AddTaskForm onAdd={addTask} onClose={closeDialog} />
                        <DialogTrigger asChild>
                          <button ref={dialogCloseRef} className="hidden">Close</button>
                        </DialogTrigger>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <Calendar className="mr-2 h-4 w-4" />
                          Add Due Date
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Due Date</DialogTitle>
                        </DialogHeader>
                        <AddDueDateForm 
                          onAddAssignment={addAssignment}
                          onAddExam={addExam}
                          onAddRecord={addRecord}
                          onClose={closeDialog}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="flex-1">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Material
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
                      <p className="text-[#57A7B3]">Test yourself on what you&apos;ve learned without referring to your notes. This helps strengthen memory and identifies knowledge gaps.</p>
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
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#1A5F7A]">Upload Learning Materials</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-[#57A7B3] rounded-lg p-8 text-center">
                      <Input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="h-12 w-12 text-[#57A7B3] mb-4" />
                        <span className="text-[#1A5F7A] font-medium">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-sm text-[#57A7B3]">
                          PDF, DOC, DOCX, TXT (max. 10MB)
                        </span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-[#1A5F7A]">Uploaded Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {uploadedResources.map(resource => (
                        <div
                          key={resource.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedResource?.id === resource.id
                              ? 'bg-[#A0D2DB] border-[#57A7B3]'
                              : 'bg-white hover:bg-[#E6F3F5]'
                          }`}
                          onClick={() => setSelectedResource(resource)}
                        >
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-[#57A7B3]" />
                            <div>
                              <p className="font-medium text-[#1A5F7A]">{resource.name}</p>
                              <p className="text-xs text-[#57A7B3]">
                                Uploaded on {resource.dateUploaded}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {uploadedResources.length === 0 && (
                        <p className="text-[#57A7B3] text-center py-4">
                          No resources uploaded yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-[#1A5F7A]">
                      {selectedResource ? 'AI Summary & Q&A' : 'Select a Resource'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedResource ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-[#E6F3F5] rounded-lg">
                          <h3 className="font-medium text-[#1A5F7A] mb-2">Summary</h3>
                          <p className="text-[#57A7B3]">{selectedResource.summary}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="font-medium text-[#1A5F7A]">Ask a Question</h3>
                          <div className="flex space-x-2">
                            <Textarea
                              placeholder="Ask anything about this resource..."
                              value={question}
                              onChange={(e) => setQuestion(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              className="bg-[#57A7B3] hover:bg-[#1A5F7A]"
                              onClick={handleAskQuestion}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MessageSquare className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {aiResponse && (
                          <div className="p-4 bg-white border rounded-lg">
                            <h3 className="font-medium text-[#1A5F7A] mb-2">AI Response</h3>
                            <p className="text-[#57A7B3]">{aiResponse}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#57A7B3]">
                        Select a resource from the left to view its summary and ask questions
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
