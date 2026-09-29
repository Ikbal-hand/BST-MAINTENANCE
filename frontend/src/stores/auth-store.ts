import { create } from 'zustand'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  workspace: {
    id: string
    slug: string
    name: string
    type: string
  }
}

interface AuthState {
  user: AuthUser | null
  status: 'initializing' | 'authenticated' | 'unauthenticated'
  setUser: (user: AuthUser | null) => void
  setStatus: (status: AuthState['status']) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'initializing',
  setUser: (user) => set({ user, status: user ? 'authenticated' : 'unauthenticated' }),
  setStatus: (status) => set({ status }),
  clear: () => set({ user: null, status: 'unauthenticated' }),
}))
