import type { RequestHandler } from 'express'
import { WorkspaceRepository } from '../repositories/workspace-repository.js'

export function createWorkspaceController(repository: WorkspaceRepository) {
  return {
    listBranches: (async (_request, response) => {
      const branches = await repository.listActiveBranches()
      response.json({ data: branches })
    }) satisfies RequestHandler,
  }
}
