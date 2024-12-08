'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/firebase/config'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/config'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (userData?.isNewUser) {
          router.push('/profile');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return null
}
