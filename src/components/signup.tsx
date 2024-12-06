'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Github, Mail, Eye, EyeOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth, db } from '@/firebase/config'
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth'
import { useAlert } from '@/hooks/useAlert'
import { setDoc, doc, getDocs, collection, getDoc } from 'firebase/firestore'

export function SignupComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState('');
  const router = useRouter();
  const { showAlert } = useAlert()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      showAlert("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;
      
      // First, create the user document
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        username,
        role: 'user',
        tasks: [],
        assignments: [],
        exams: [],
        records: [],
        folders: []
      });

      // Then check if it's the first user and update role if needed
      const usersSnapshot = await getDocs(collection(db, 'users'));
      if (usersSnapshot.size === 1) {
        await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
      }

      router.push('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        showAlert(error.message);
      } else {
        showAlert("An error occurred during signup");
      }
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const { user } = result;
      
      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          username: user.email?.split('@')[0] || '',
          role: 'user',
          tasks: [],
          assignments: [],
          exams: [],
          records: [],
          folders: []
        });

        // Check if first user
        const usersSnapshot = await getDocs(collection(db, 'users'));
        if (usersSnapshot.size === 1) {
          await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
        }
      }
      
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        showAlert(error.message);
      } else {
        showAlert("An error occurred during Google signup");
      }
    }
  };

  const handleGithubSignup = async () => {
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await initializeUserData(result.user.uid, result.user.email || '');
      router.push('/dashboard');
    } catch (error) {
      console.error("Error signing up with Github:", error);
      showAlert((error as Error).message);
    }
  };

  const handleError = (error: Error) => {
    console.error("Error signing in:", error);
    showAlert(error.message);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#E6F3F5]">
      <Card className="w-[350px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-[#1A5F7A]">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignup}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input 
                  id="confirm-password" 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full mt-4 bg-[#57A7B3] hover:bg-[#1A5F7A]">
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#A0D2DB]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#57A7B3]">Or continue with</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2 w-full">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignup}>
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGithubSignup}>
              <Github className="mr-2 h-4 w-4" />
              Github
            </Button>
          </div>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Button 
              variant="link" 
              className="text-[#57A7B3] hover:text-[#1A5F7A] p-0"
              onClick={() => router.push('/login')}
            >
              Login here
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
function initializeUserData(uid: string, arg1: string) {
  throw new Error('Function not implemented.')
}

