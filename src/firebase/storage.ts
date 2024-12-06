import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth } from './config';

const storage = getStorage();

export const uploadFile = async (file: File, folderPath: string): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No user authenticated');

  const fileRef = ref(storage, `${folderPath}/${file.name}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};

export const deleteFile = async (filePath: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No user authenticated');

  const cleanPath = filePath.replace(/\/+/g, '/');
  const fileRef = ref(storage, cleanPath);
  await deleteObject(fileRef);
};
