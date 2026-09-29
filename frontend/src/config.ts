export const appConfig = {
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  appDomain: import.meta.env.VITE_APP_DOMAIN ?? 'bst-maintenance.local',
  branchDomain: import.meta.env.VITE_BRANCH_DOMAIN ?? 'bst-maintenance.local',
  appVersion: import.meta.env.VITE_APP_VERSION ?? '0.1.0',
} as const

export function resolveCurrentWorkspace(hostname = window.location.hostname) {
  const host = hostname.toLowerCase()
  const domain = appConfig.appDomain.toLowerCase()

  if (host === domain || host === `www.${domain}` || host === `central.${domain}`) {
    return { type: 'central' as const, slug: 'central' }
  }

  const suffix = `.${appConfig.branchDomain.toLowerCase()}`
  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length)
    if (slug && !slug.includes('.')) return { type: 'branch' as const, slug }
  }

  return { type: 'unknown' as const, slug: null }
}

export function getMainLandingUrl(location: Pick<Location, 'protocol' | 'port'> = window.location) {
  const port = location.port ? `:${location.port}` : ''
  return `${location.protocol}//${appConfig.appDomain}${port}/`
}
