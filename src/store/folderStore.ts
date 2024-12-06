import { create } from 'zustand'
import type { Folder } from '@/types/materials'

interface FolderStore {
  folders: Folder[]
  setFolders: (folders: Folder[]) => void
  addFolder: (folder: Folder) => void
  deleteFolder: (folderId: string) => void
}

export const useFolderStore = create<FolderStore>((set) => ({
  folders: [],
  setFolders: (folders) => set({ folders }),
  addFolder: (folder) => set((state) => ({ folders: [...state.folders, folder] })),
  deleteFolder: (folderId) => set((state) => ({
    folders: state.folders.filter(folder => folder.id !== folderId)
  })),
})) 