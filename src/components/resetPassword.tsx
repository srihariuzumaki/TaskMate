'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth } from '@/firebase/config'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useAlert } from '@/hooks/useAlert'

export function ResetPasswordComponent() {
  const [email, setEmail] = useState('');
  const router = useRouter();
  const { showAlert } = useAlert()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showAlert("Please enter your email address.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showAlert("Password reset email sent! Please check your inbox.");
      router.push('/login'); // Redirect to login after sending email
    } catch (error) {
      console.error("Error sending password reset email:", error);
      showAlert("Failed to send password reset email. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#E6F3F5]">
      <Card className="w-[350px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-[#1A5F7A]">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleResetPassword}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <Button type="submit" className="w-full mt-4 bg-[#57A7B3] hover:bg-[#1A5F7A]">
              Send Reset Link
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Remembered your password?{" "}
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
