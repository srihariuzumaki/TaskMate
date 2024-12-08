'use client'

import React, { useEffect, useState } from 'react';
import { BarChart, Book, Clock, Edit, LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { auth, db } from '@/firebase/config';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export function ProfileComponent() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [branch, setBranch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          const data = docSnap.data() || {};
          setUserData(data);
          setName(data.username || '');
          setUsn(data.usn || '');
          setYear(data.year || '');
          setSemester(data.semester || '');
          setBranch(data.branch || '');

          // If it's a new user, automatically open the edit dialog
          if (data.isNewUser) {
            setEditDialogOpen(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEditProfile = async () => {
    if (!name || !usn || !year || !semester || !branch) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const updatedData = {
        username: name,
        usn: usn.toUpperCase(),
        year,
        semester,
        branch,
        isNewUser: false
      };
      setUserData(updatedData);
      setEditDialogOpen(false);

      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
        toast.success('Profile updated successfully');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

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
              <AvatarFallback>{userData?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-bold text-[#1A5F7A]">
              {userData?.username || userData?.email || 'User Name Not Available'}
            </h2>
            <p className="text-[#57A7B3]">Computer Science Student</p>
            <p className="text-[#57A7B3]">USN: {usn}</p>
            <p className="text-[#57A7B3]">Year: {year}</p>
            <p className="text-[#57A7B3]">Semester: {semester}</p>
            <Button variant="outline" className="mt-4" onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </CardContent>
        </Card>

        <Dialog 
          open={isEditDialogOpen} 
          onOpenChange={(open) => {
            if (!userData?.isNewUser) {
              setEditDialogOpen(open);
            }
          }}
        >
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="usn">USN</Label>
                <Input id="usn" value={usn} onChange={(e) => setUsn(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Input id="semester" value={semester} onChange={(e) => setSemester(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleEditProfile}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}