import { useParams } from 'react-router-dom'

const modules: Record<string, string> = {
  'api-requests': 'API Request Report',
  errors: 'Error Report',
}

export function DeveloperModulePage() {
  const { module } = useParams()
  const title = module ? modules[module] : undefined

  if (!title) return null

  return (
    <main className="developer-module-page">
      <h1>{title}</h1>
      <p>Ruang kerja ini disiapkan. Detail fitur akan ditentukan pada tahap berikutnya.</p>
    </main>
  )
}
