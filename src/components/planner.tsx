'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar, Clock, Plus, Book, FileText, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth } from '@/firebase/config'
import { initializeUserData, getUserData, updateUserTasks, updateUserAssignments, updateUserExams, updateUserRecords } from '@/firebase/firestore'
import { useAlert } from '@/hooks/useAlert'


interface Record {
  name: string;
  date: string;
}

interface Task {
  name: string;
  time: string;
}

interface Assignment {
  name: string;
  date: string;
}

interface Exam {
  name: string;
  date: string;
}

export function PlannerComponent() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [exams, setExams] = useState<Exam[]>([])
    
  const [records, setRecords] = useState<Record[]>([])

  const dialogCloseRef = useRef<HTMLButtonElement>(null)

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
      showAlert('Failed to add task. Please try again.');
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
      showAlert('Failed to add assignment. Please try again.');
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
      showAlert('Failed to add exam. Please try again.');
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
      showAlert('Failed to add record. Please try again.');
    }
  };

  const deleteTask = async (index: number) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const newTasks = tasks.filter((_, i) => i !== index);
    
    try {
      await updateUserTasks(currentUser.uid, newTasks);
      setTasks(newTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
      showAlert('Failed to delete task. Please try again.');
    }
  };

  const deleteAssignment = async (index: number) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const newAssignments = assignments.filter((_, i) => i !== index);
    try {
      await updateUserAssignments(currentUser.uid, newAssignments);
      setAssignments(newAssignments);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      showAlert('Failed to delete assignment. Please try again.');
    }
  };

  const deleteExam = async (index: number) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const newExams = exams.filter((_, i) => i !== index);
    try {
      await updateUserExams(currentUser.uid, newExams);
      setExams(newExams);
    } catch (error) {
      console.error('Error deleting exam:', error);
      showAlert('Failed to delete exam. Please try again.');
    }
  };

  const deleteRecord = async (index: number) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const newRecords = records.filter((_, i) => i !== index);
    try {
      await updateUserRecords(currentUser.uid, newRecords);
      setRecords(newRecords);
    } catch (error) {
      console.error('Error deleting record:', error);
      showAlert('Failed to delete record. Please try again.');
    }
  };

  const closeDialog = () => {
    dialogCloseRef.current?.click()
  }

  const { showAlert } = useAlert()

  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        await initializeUserData(currentUser.uid);
        const userData = await getUserData(currentUser.uid);
        if (userData) {
          setTasks(userData.tasks || []);
          setAssignments(userData.assignments || []);
          setExams(userData.exams || []);
          setRecords(userData.records || []);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        showAlert('Failed to load your data. Please try again.');
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadUserData();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3F5]">
      <header className="bg-[#A0D2DB] text-[#1A5F7A] p-4">
        <h1 className="text-xl font-bold">Planner</h1>
      </header>

      <main className="flex-1 p-4 space-y-4">
        <Card className="bg-white border-[#A0D2DB]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[#1A5F7A] text-md font-medium">Today's Schedule</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
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
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full pr-4">
              {tasks.map((task, index) => (
                <div key={index} className="mb-4 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-[#57A7B3]" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-[#1A5F7A]">{task.name}</p>
                    <p className="text-xs text-[#57A7B3]">{task.time}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#A0D2DB]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[#1A5F7A] text-md font-medium">Upcoming Due Dates</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Due Date</DialogTitle>
                </DialogHeader>
                <AddDueDateForm 
                  onAddAssignment={addAssignment} 
                  onAddExam={addExam} 
                  onAddRecord={addRecord}
                  onClose={closeDialog} 
                />
                <DialogTrigger asChild>
                  <button ref={dialogCloseRef} className="hidden">Close</button>
                </DialogTrigger>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full pr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-[#1A5F7A] mb-2">Assignments</h3>
                  {assignments.map((assignment, index) => (
                    <div key={index} className="mb-2 flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-[#57A7B3]" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-[#1A5F7A]">{assignment.name}</p>
                        <p className="text-xs text-[#57A7B3]">Due: {assignment.date}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAssignment(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div>
                  <h3 className="font-semibold text-[#1A5F7A] mb-2">Exams</h3>
                  {exams.map((exam, index) => (
                    <div key={index} className="mb-2 flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Book className="h-5 w-5 text-[#57A7B3]" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-[#1A5F7A]">{exam.name}</p>
                        <p className="text-xs text-[#57A7B3]">Date: {exam.date}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExam(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div>
                  <h3 className="font-semibold text-[#1A5F7A] mb-2">Records</h3>
                  {records.map((record, index) => (
                    <div key={index} className="mb-2 flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-[#57A7B3]" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-[#1A5F7A]">{record.name}</p>
                        <p className="text-xs text-[#57A7B3]">Date: {record.date}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRecord(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#A0D2DB]">
          <CardHeader>
            <CardTitle className="text-[#1A5F7A]">Calendar Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Calendar className="h-64 w-64 text-[#57A7B3]" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

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
