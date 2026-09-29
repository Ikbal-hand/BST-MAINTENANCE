import type { WorkspaceContext } from '../domain.js'

declare global {
  namespace Express {
    interface Request {
      requestId: string
      workspace: WorkspaceContext
      auth?: {
        userId: string
        workspaceId: string
        workspaceSlug: string
        workspaceType: 'central' | 'branch'
        role: string
      }
    }
  }
}

export {}
