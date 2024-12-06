import { db } from './config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface UserData {
  tasks: Array<{
    name: string;
    time: string;
    progress?: number;
  }>;
  assignments: Array<{
    name: string;
    date: string;
    progress?: number;
  }>;
  exams: Array<{
    name: string;
    date: string;
  }>;
  records: Array<{
    name: string;
    date: string;
  }>;
  folders: Array<{
    id: string;
    name: string;
    tags: string[];
    files: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
      createdAt: string;
    }>;
    createdAt: string;
  }>;
}

export const initializeUserData = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const initialData: UserData = {
      tasks: [],
      assignments: [],
      exams: [],
      records: [],
      folders: []
    };
    await setDoc(userRef, initialData);
  }
};

export const updateUserTasks = async (userId: string, tasks: UserData['tasks']) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { tasks });
};

export const updateUserAssignments = async (userId: string, assignments: UserData['assignments']) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { assignments });
};

export const updateUserExams = async (userId: string, exams: UserData['exams']) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { exams });
};

export const updateUserRecords = async (userId: string, records: UserData['records']) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { records });
};

export const updateUserFolders = async (userId: string, folders: UserData['folders']) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { folders });
};

export const getUserData = async (userId: string): Promise<UserData | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserData;
  }
  return null;
};
