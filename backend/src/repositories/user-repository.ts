import type { PrismaClient } from '@prisma/client'

export class UserRepository {
  constructor(private readonly database: PrismaClient) {}

  findByEmail(email: string) {
    return this.database.user.findUnique({
      where: { email },
      include: { workspace: true },
    })
  }

  findById(id: string) {
    return this.database.user.findUnique({
      where: { id },
      include: { workspace: true },
    })
  }

  listBranchUsers() {
    return this.database.user.findMany({
      where: { workspace: { is: { type: 'branch' } } },
      orderBy: [{ workspace: { name: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        passwordHash: true,
        workspace: {
          select: {
            id: true,
            slug: true,
            name: true,
            isActive: true,
            contactPhone: true,
            _count: { select: { stores: true, baps: true, invoices: true } },
          },
        },
      },
    })
  }

  updateBranchUserPassword(id: string, passwordHash: string) {
    return this.database.user.updateMany({
      where: { id, workspace: { is: { type: 'branch' } } },
      data: { passwordHash, passwordVersion: { increment: 1 } },
    })
  }

  changePassword(id: string, currentPasswordHash: string, newPasswordHash: string) {
    return this.database.user.updateMany({
      where: { id, passwordHash: currentPasswordHash, isActive: true },
      data: { passwordHash: newPasswordHash, passwordVersion: { increment: 1 } },
    })
  }

  moveBranchUser(id: string, workspaceId: string) {
    return this.database.$transaction(async (transaction) => {
      const destination = await transaction.workspace.findFirst({
        where: { id: workspaceId, type: 'branch', isActive: true },
        select: { id: true },
      })
      if (!destination) return { count: 0 }

      return transaction.user.updateMany({
        where: { id, workspace: { is: { type: 'branch' } } },
        data: { workspaceId: destination.id },
      })
    })
  }

  setBranchUserActive(id: string, isActive: boolean) {
    return this.database.user.updateMany({
      where: { id, workspace: { is: { type: 'branch' } } },
      data: { isActive },
    })
  }

  setBranchActive(id: string, isActive: boolean) {
    return this.database.workspace.updateMany({
      where: { id, type: 'branch' },
      data: { isActive },
    })
  }

  deleteBranch(id: string) {
    return this.database.$transaction(async (transaction) => {
      const branch = await transaction.workspace.findFirst({
        where: { id, type: 'branch' },
        select: { id: true, isActive: true },
      })
      if (!branch) return { status: 'not-found' as const }

      const [stores, baps, invoices] = await Promise.all([
        transaction.store.count({ where: { workspaceId: id } }),
        transaction.bap.count({ where: { workspaceId: id } }),
        transaction.invoice.count({ where: { workspaceId: id } }),
      ])
      if (stores + baps + invoices > 0) return { status: 'has-data' as const }

      await transaction.user.deleteMany({ where: { workspaceId: id } })
      await transaction.document.deleteMany({ where: { workspaceId: id } })
      await transaction.workspace.delete({ where: { id } })
      return { status: 'deleted' as const }
    })
  }

  createBranchWithAdmin(input: {
    name: string
    slug: string
    domain: string
    contactPhone: string
    adminName: string
    adminEmail: string
    passwordHash: string
  }) {
    return this.database.workspace.create({
      data: {
        name: input.name,
        slug: input.slug,
        type: 'branch',
        domain: input.domain,
        contactPhone: input.contactPhone,
        users: {
          create: {
            name: input.adminName,
            email: input.adminEmail,
            role: 'branch_admin',
            passwordHash: input.passwordHash,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        contactPhone: true,
        isActive: true,
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true },
        },
      },
    })
  }
}
