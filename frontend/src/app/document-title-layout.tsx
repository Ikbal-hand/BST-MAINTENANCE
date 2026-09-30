import { useEffect } from 'react'
import { Outlet, useMatches } from 'react-router-dom'

const developerTitles: Record<string, string> = {
  users: 'Manajemen User & Cabang',
  'login-users': 'Manajemen User & Cabang',
  'branch-override': 'Manajemen User & Cabang',
  'new-branch': 'Manajemen User & Cabang',
}

const pageTitles: Record<string, string> = {
  '/': 'Beranda',
  '/login': 'Masuk',
  '/app': 'Dashboard',
  '/app/stores': 'Data Toko',
  '/app/bap': 'BAP',
  '/app/invoices': 'Invoice dan SPH',
  '/app/recaps': 'Rekap',
  '/app/settings': 'Pengaturan',
}

export function DocumentTitleLayout() {
  const matches = useMatches()
  const path = matches.at(-1)?.pathname ?? '/'
  const module = path.startsWith('/app/developer/') ? path.split('/').at(-1) ?? '' : ''
  const title = module ? developerTitles[module] ?? 'Developer' : pageTitles[path] ?? 'BST Invoice'

  useEffect(() => {
    document.title = title === 'BST Invoice' ? title : `${title} | BST Invoice`
  }, [title])

  return <Outlet />
}
