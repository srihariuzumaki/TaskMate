'use client'

import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { signInAnonymously } from 'firebase/auth';
import { Button } from "@/components/ui/button";

export function ProfileSection() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error("Error signing in anonymously:", error);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex items-center space-x-4">
      {user && (
        <>
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            {user.isAnonymous ? '?' : user.email?.[0].toUpperCase()}
          </div>
          {user.isAnonymous && (
            <Button variant="outline" onClick={() => {/* TODO: Implement login logic */}}>
              Login
            </Button>
          )}
        </>
      )}
    </div>
  );
}
