export type WorkspaceType = 'central' | 'branch' | 'unknown'

export interface WorkspaceContext {
  host: string
  type: WorkspaceType
  slug: string | null
  domain: string
}

export interface WorkspaceIdentity {
  slug: string
  type: string
  role: string
}

const defaultDomain = 'bst-maintenance.local'

export function resolveWorkspace(hostHeader: string | undefined): WorkspaceContext {
  const host = (hostHeader ?? '').split(':')[0].toLowerCase()
  const domain = process.env.APP_DOMAIN ?? defaultDomain
  const branchDomain = process.env.BRANCH_DOMAIN ?? domain
  const apiHost = process.env.API_HOST?.toLowerCase()

  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return { host, type: 'unknown', slug: null, domain }
  }

  if (host === domain || host === `www.${domain}` || host === `central.${domain}` || host === apiHost) {
    return { host, type: 'central', slug: 'central', domain }
  }

  const suffix = `.${branchDomain}`
  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length)
    if (slug && !slug.includes('.')) {
      return { host, type: 'branch', slug, domain }
    }
  }

  return { host, type: 'unknown', slug: null, domain }
}

export function canAccessWorkspace(context: WorkspaceContext, identity: WorkspaceIdentity): boolean {
  if (context.type === 'central') {
    return identity.type === 'central' && identity.role === 'developer'
  }

  if (context.type === 'branch') {
    return identity.type === 'branch' && identity.role !== 'developer' && identity.slug === context.slug
  }

  return context.host === 'localhost' || context.host === '127.0.0.1'
}
