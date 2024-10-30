import { create } from 'zustand'

type AlertStore = {
  isOpen: boolean
  message: string
  showAlert: (message: string) => void
  hideAlert: () => void
}

export const useAlert = create<AlertStore>((set) => ({
  isOpen: false,
  message: '',
  showAlert: (message: string) => set({ isOpen: true, message }),
  hideAlert: () => set({ isOpen: false, message: '' }),
}))
