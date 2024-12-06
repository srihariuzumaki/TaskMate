'use client'

import { AdminComponent } from '@/components/admin';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('Unauthorized access');
        router.push('/admin/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
        toast.error('Unauthorized access');
        router.push('/admin/login');
        return;
      }

      setIsAuthorized(true);
    };

    checkAdminAccess();
  }, [router]);

  if (!isAuthorized) {
    return null;
  }

  return <AdminComponent />;
} 