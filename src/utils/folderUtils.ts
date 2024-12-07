import { Folder } from '@/types/materials';

export const findFolder = (folders: Folder[], targetId: string): Folder | null => {
  for (const folder of folders) {
    if (folder.id === targetId) return folder;
    if (folder.subFolders) {
      const found = findFolder(folder.subFolders, targetId);
      if (found) return found;
    }
  }
  return null;
}; 