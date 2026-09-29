import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useEffect } from 'react'
import { getCurrentUser } from '../features/auth/auth-api'
import { useAuthStore } from '../stores/auth-store'
import { getSettings } from '../features/settings/settings-api'
import { installGlobalErrorReporting } from '../lib/developer-error-reporter'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export function App() {
  const setUser = useAuthStore((state) => state.setUser)
  const authStatus = useAuthStore((state) => state.status)

  useEffect(() => installGlobalErrorReporting(), [])

  useEffect(() => {
    let active = true

    getCurrentUser()
      .then((user) => {
        if (active && useAuthStore.getState().status === 'initializing') setUser(user)
      })
      .catch(() => {
        if (active && useAuthStore.getState().status === 'initializing') setUser(null)
      })

    return () => {
      active = false
    }
  }, [setUser])

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    getSettings().then((settings) => {
      document.documentElement.style.setProperty('--app-primary-color', settings.primaryColor)
    }).catch(() => undefined)
  }, [authStatus])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
