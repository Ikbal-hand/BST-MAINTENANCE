import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { ConflictError, NotFoundError } from '../errors.js'
import { config } from '../config.js'
import type { UserRepository } from '../repositories/user-repository.js'

export class DeveloperUserService {
  constructor(
    private readonly users: Pick<
      UserRepository,
      'listBranchUsers' | 'updateBranchUserPassword' | 'moveBranchUser' | 'setBranchUserActive' | 'setBranchActive' | 'deleteBranch' | 'createBranchWithAdmin'
    >,
    private readonly hashPassword: (password: string) => Promise<string> = (password) => bcrypt.hash(password, 12),
  ) {}

  async listBranchUsers() {
    const users = await this.users.listBranchUsers()
    return users.map(({ passwordHash, workspace, ...user }) => {
      const { _count, ...branch } = workspace
      return {
        ...user,
        workspace: {
          ...branch,
          counts: _count,
        },
        hasPassword: passwordHash !== null,
      }
    })
  }

  async resetBranchUserPassword(id: string) {
    const newPassword = randomBytes(18).toString('base64url')
    const passwordHash = await this.hashPassword(newPassword)
    const result = await this.users.updateBranchUserPassword(id, passwordHash)

    if (result.count === 0) throw new NotFoundError('User cabang tidak ditemukan')

    return { userId: id, newPassword }
  }

  async moveBranchUser(id: string, workspaceId: string) {
    const result = await this.users.moveBranchUser(id, workspaceId)
    if (result.count === 0) throw new NotFoundError('User cabang tidak ditemukan')
    return { userId: id, workspaceId }
  }

  async setBranchUserActive(id: string, isActive: boolean) {
    const result = await this.users.setBranchUserActive(id, isActive)
    if (result.count === 0) throw new NotFoundError('User cabang tidak ditemukan')
    return { userId: id, isActive }
  }

  async setBranchActive(id: string, isActive: boolean) {
    const result = await this.users.setBranchActive(id, isActive)
    if (result.count === 0) throw new NotFoundError('Cabang tidak ditemukan')
    return { branchId: id, isActive }
  }

  async deleteBranch(id: string) {
    const result = await this.users.deleteBranch(id)
    if (result.status === 'not-found') throw new NotFoundError('Cabang tidak ditemukan')
    if (result.status === 'has-data') {
      throw new ConflictError('Cabang masih memiliki toko, BAP, atau invoice. Rekap dan SPH mengikuti data invoice; hapus data operasional tersebut terlebih dahulu.')
    }
    return { branchId: id, deleted: true }
  }

  async createBranch(input: {
    name: string
    slug: string
    contactPhone: string
    adminName: string
    adminEmail: string
  }) {
    const newPassword = randomBytes(18).toString('base64url')
    const passwordHash = await this.hashPassword(newPassword)
    const branchDomain = config.BRANCH_DOMAIN ?? config.APP_DOMAIN

    try {
      const branch = await this.users.createBranchWithAdmin({
        ...input,
        adminEmail: input.adminEmail.toLowerCase(),
        domain: `${input.slug}.${branchDomain}`,
        passwordHash,
      })
      const [admin] = branch.users
      if (!admin) throw new Error('User admin cabang gagal dibuat')
      const { users: _users, ...workspace } = branch
      return { workspace, admin, newPassword }
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError('Slug atau domain cabang sudah digunakan')
      }
      throw error
    }
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}
