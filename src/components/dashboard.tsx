'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { auth } from '@/firebase/config'
import { User } from 'firebase/auth'
import { FileText, Book, Plus, Upload, Calendar, Play, Pause, RefreshCw, MessageSquare, Loader2, FolderIcon, ChevronRight, ArrowLeft, MessageCircle } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { initializeUserData, getUserData, updateUserTasks, updateUserAssignments, updateUserExams, updateUserRecords, getUserFolders, updateUserFolders } from '@/firebase/firestore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useFolderStore } from '@/store/folderStore'
import { Folder, MaterialFile } from '@/types/materials'
import { uploadFile } from '@/firebase/storage'
import { toast } from 'sonner'
import { findFolder } from '@/utils/folderUtils'
import { NotificationCenter } from '@/components/NotificationCenter'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from 'next/image'

type TimerStatus = 'work' | 'break';
type TimerState = 'running' | 'paused';

type UploadedResource = {
  id: string;
  name: string;
  summary: string;
  dateUploaded: string;
};

interface UploadDialogProps {
  onClose: () => void;
}

function UploadDialog({ onClose }: UploadDialogProps) {
  const { folders, setFolders } = useFolderStore();
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedFolderId) {
      toast.error('Please select both a folder and a file');
      return;
    }

    // Check for duplicate files
    const targetFolder = findFolder(folders, selectedFolderId);
    if (targetFolder && targetFolder.files.some((f: { name: string }) => f.name === selectedFile.name)) {
      toast.error('A file with this name already exists in the selected folder');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading file...');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.dismiss(toastId);
        throw new Error('No user logged in');
      }

      const url = await uploadFile(selectedFile, selectedFolderId);
      
      const newFile: MaterialFile = {
        id: Date.now().toString(),
        name: selectedFile.name,
        url,
        type: selectedFile.type,
        createdAt: new Date().toISOString(),
        uploadedBy: {
          uid: currentUser.uid,
          email: currentUser.email || 'Unknown'
        }
      };

      const findAndUpdateFolder = (folders: Folder[]): Folder[] => {
        return folders.map(folder => {
          if (folder.id === selectedFolderId) {
            return {
              ...folder,
              files: [...folder.files, newFile]
            };
          }
          if (folder.subFolders?.length) {
            return {
              ...folder,
              subFolders: findAndUpdateFolder(folder.subFolders)
            };
          }
          return folder;
        });
      };

      const updatedFolders = findAndUpdateFolder([...folders]);
      await updateUserFolders(currentUser.uid, updatedFolders);
      setFolders(updatedFolders);
      toast.success('File uploaded successfully');
      onClose();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      toast.dismiss(toastId);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFolderOption = (folder: Folder, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasSubfolders = folder.subFolders && folder.subFolders.length > 0;
    const isSelected = folder.id === selectedFolderId;

    return (
      <div key={folder.id} className="w-full">
        <div
          className={`flex items-center p-2 hover:bg-[#E6F3F5] rounded cursor-pointer ${
            isSelected ? 'bg-[#E6F3F5]' : ''
          }`}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          onClick={() => {
            setSelectedFolderId(folder.id);
            if (hasSubfolders) {
              toggleFolder(folder.id);
            }
          }}
        >
          {hasSubfolders && (
            <ChevronRight
              className={`h-4 w-4 mr-2 transition-transform ${
                isExpanded ? 'transform rotate-90' : ''
              }`}
            />
          )}
          <FolderIcon className="h-4 w-4 mr-2 text-[#57A7B3]" />
          <span className="text-sm text-[#1A5F7A]">{folder.name}</span>
        </div>
        {isExpanded && hasSubfolders && (
          <div className="ml-4">
            {folder.subFolders.map(subfolder => renderFolderOption(subfolder, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Upload Material</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="folder">Select Folder</Label>
          <div className="border rounded-md max-h-[200px] overflow-y-auto">
            {folders.map(folder => renderFolderOption(folder))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="file">Select File</Label>
          <Input
            id="file"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <p className="text-sm text-[#57A7B3]">
            Supported formats: PDF, DOC, DOCX, TXT (max. 10MB)
          </p>
        </div>

        <Button 
          className="w-full bg-[#57A7B3] hover:bg-[#1A5F7A]"
          onClick={handleUpload}
          disabled={isUploading || !selectedFile || !selectedFolderId}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </>
          )}
        </Button>
      </div>
    </DialogContent>
  );
}

const calculateTotalFiles = (folder: Folder): number => {
  let total = folder.files?.length || 0;
  if (folder.subFolders) {
    folder.subFolders.forEach(subfolder => {
      total += calculateTotalFiles(subfolder);
    });
  }
  return total;
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
        await initializeUserData(currentUser.uid, currentUser.email || '');
        const userData = await getUserData(currentUser.uid);
        if (userData) {
          setTasks(userData.tasks || []);
          setAssignments(userData.assignments || []);
          setExams(userData.exams || []);
          setRecords(userData.records || []);
        }

        // Load folders separately using getUserFolders
        const fetchedFolders = await getUserFolders();
        if (fetchedFolders) {
          setFolders(fetchedFolders);
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
    const toastId = toast.loading('Uploading file...');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Generate a unique ID for the file
      const fileId = Date.now().toString();
      
      // Upload file to storage
      const fileUrl = await uploadFile(file, `ai-analysis/${currentUser.uid}/${fileId}`);
      
      // TODO: Store file metadata in Firestore if needed
      
      // Use router.push for navigation
      router.push(`/analysis?fileId=${fileId}`);
      
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setIsLoading(false);
      toast.dismiss(toastId);
    }
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

  const renderFolderPreview = (folder: Folder) => {
    const totalFiles = calculateTotalFiles(folder);
    const recentFiles = folder.files
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);

    return (
      <li 
        key={folder.id} 
        className="flex flex-col p-2 hover:bg-[#E6F3F5] rounded cursor-pointer space-y-2"
        onClick={() => {
          localStorage.setItem('selectedFolderId', folder.id);
          router.push('/materials');
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FolderIcon className="mr-2 h-4 w-4 text-[#57A7B3]" />
            <div>
              <p className="font-medium text-[#1A5F7A]">{folder.name}</p>
              <p className="text-sm text-[#57A7B3]">
                {totalFiles} files • {folder.subFolders?.length || 0} subfolders
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#57A7B3]" />
        </div>
        
        {recentFiles.length > 0 && (
          <div className="ml-6 space-y-1">
            {recentFiles.map(file => (
              <div key={file.id} className="flex items-center text-sm">
                <FileText className="mr-2 h-3 w-3 text-[#57A7B3]" />
                <a 
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#57A7B3] hover:text-[#1A5F7A] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {file.name}
                </a>
              </div>
            ))}
          </div>
        )}
      </li>
    );
  };

  const renderRecentMaterials = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#1A5F7A]">Recent Materials</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {folders && folders.length === 0 ? (
            <p className="text-center text-[#57A7B3] py-4">No folders created yet</p>
          ) : (
            folders
              .sort((a, b) => {
                const aLatest = a.files.reduce((latest, file) => {
                  const fileDate = new Date(file.createdAt).getTime();
                  return fileDate > latest ? fileDate : latest;
                }, 0);
                const bLatest = b.files.reduce((latest, file) => {
                  const fileDate = new Date(file.createdAt).getTime();
                  return fileDate > latest ? fileDate : latest;
                }, 0);
                return bLatest - aLatest;
              })
              .slice(0, 3)
              .map((folder) => renderFolderPreview(folder))
          )}
        </ul>
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
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-[#E6F3F5]">
        <header className="bg-[#A0D2DB] h-16 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-[32px] h-[32px] flex-shrink-0 relative">
              <Image 
                src="/logo.png"
                alt="Taskmate Logo"
                width={150}
                height={150}
                className="object-contain absolute -top-[1.25rem]  -left-[1.25rem] max-w-[220%]"
              />
            </div>
            <h1 className="text-2xl font-bold text-[#1A5F7A]">Taskmate</h1>
          </div>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <NotificationCenter />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/contact')}
                  className="relative"
                >
                  <MessageCircle className="h-5 w-5 text-[#1A5F7A]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Contact Admin</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="rounded-full" onClick={() => router.push('/profile')}>
                  <span className="sr-only">User menu</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1A5F7A]">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Profile Settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList className="bg-white rounded-full p-1">
              <TabsTrigger value="dashboard" className="rounded-full">Dashboard</TabsTrigger>
              <TabsTrigger value="techniques" className="rounded-full">Study Techniques</TabsTrigger>
              <TabsTrigger value="ai-summary" className="rounded-full">AI Summary</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <div className="space-y-4">
                {renderUpcomingTasks()}
                {renderRecentMaterials()}

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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Material
                          </Button>
                        </DialogTrigger>
                        <UploadDialog onClose={() => {
                          const dialogTrigger = document.querySelector('[role="dialog"]');
                          if (dialogTrigger) {
                            (dialogTrigger as HTMLElement).click();
                          }
                        }} />
                      </Dialog>
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
            <TabsContent value="ai-summary">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[#1A5F7A]">AI Document Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-[#57A7B3] rounded-lg p-12 text-center bg-white">
                        <Input
                          type="file"
                          className="hidden"
                          id="file-upload"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <div className="mb-6">
                            <Upload className="h-16 w-16 text-[#57A7B3]" />
                          </div>
                          <span className="text-xl font-medium text-[#1A5F7A] mb-2">
                            Select files
                          </span>
                          <p className="text-[#57A7B3] mb-4">
                            Add PDF, image, Word, Excel, and PowerPoint files
                          </p>
                          <div className="flex gap-2 flex-wrap justify-center">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded">PDF</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">DOC</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">XLS</span>
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">PPT</span>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">PNG</span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">JPG</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  )
}
