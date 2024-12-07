import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth } from './config';

const storage = getStorage();

export const uploadFile = async (file: File, folderPath: string): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No user authenticated');

  const normalizedPath = folderPath.startsWith('global/') ? folderPath : `global/${folderPath}`;
  const fileRef = ref(storage, `${normalizedPath}/${file.name}`);
  
  const metadata = {
    customMetadata: {
      uploadedBy: currentUser.uid
    }
  };

  await uploadBytes(fileRef, file, metadata);
  return getDownloadURL(fileRef);
};

export const deleteFile = async (filePath: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No user authenticated');

  const cleanPath = filePath.replace(/\/+/g, '/');
  const fileRef = ref(storage, cleanPath);
  await deleteObject(fileRef);
};
