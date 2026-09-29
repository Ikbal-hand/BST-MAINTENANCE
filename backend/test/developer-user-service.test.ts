import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import { test } from 'node:test'
import { ConflictError } from '../src/errors.js'
import type { UserRepository } from '../src/repositories/user-repository.js'
import { DeveloperUserService } from '../src/services/developer-user-service.js'

type DeveloperUserRepository = Pick<
  UserRepository,
  'listBranchUsers' | 'updateBranchUserPassword' | 'moveBranchUser' | 'setBranchUserActive' | 'setBranchActive' | 'deleteBranch' | 'createBranchWithAdmin'
>

const branchUser = {
  id: 'user-bandung',
  name: 'Admin Bandung',
  email: 'bandung@example.test',
  role: 'branch_admin',
  isActive: true,
  passwordHash: '$2b$12$alreadyhashed',
  workspace: {
    id: 'workspace-bandung',
    slug: 'bandung',
    name: 'Bandung',
    isActive: true,
    contactPhone: '081234567890',
    _count: { stores: 0, baps: 0, invoices: 0 },
  },
}

function makeUsers(overrides: Partial<DeveloperUserRepository> = {}): DeveloperUserRepository {
  return {
    listBranchUsers: async () => [branchUser],
    updateBranchUserPassword: async () => ({ count: 1 }),
    moveBranchUser: async () => ({ count: 1 }),
    setBranchUserActive: async () => ({ count: 1 }),
    setBranchActive: async () => ({ count: 1 }),
    deleteBranch: async () => ({ status: 'deleted' as const }),
    createBranchWithAdmin: async (input) => ({
      id: 'workspace-new',
      name: input.name,
      slug: input.slug,
      domain: input.domain,
      contactPhone: input.contactPhone,
      isActive: true,
      users: [{
        id: 'admin-new',
        name: input.adminName,
        email: input.adminEmail,
        role: 'branch_admin',
        isActive: true,
      }],
    }),
    ...overrides,
  }
}

test('lists branch user details without exposing password hashes', async () => {
  const users = makeUsers()

  const result = await new DeveloperUserService(users).listBranchUsers()

  assert.deepEqual(result, [{
    id: branchUser.id,
    name: branchUser.name,
    email: branchUser.email,
    role: branchUser.role,
    isActive: true,
    workspace: {
      id: branchUser.workspace.id,
      slug: branchUser.workspace.slug,
      name: branchUser.workspace.name,
      isActive: branchUser.workspace.isActive,
      contactPhone: branchUser.workspace.contactPhone,
      counts: branchUser.workspace._count,
    },
    hasPassword: true,
  }])
  assert.equal(JSON.stringify(result).includes('passwordHash'), false)
  assert.equal(JSON.stringify(result).includes(branchUser.passwordHash), false)
})

test('resets a branch password to a bcrypt hash and returns the new password once', async () => {
  let storedHash = ''
  const users: Pick<UserRepository, 'listBranchUsers' | 'updateBranchUserPassword'> = {
    listBranchUsers: async () => [branchUser],
    updateBranchUserPassword: async (_id, hash) => {
      storedHash = hash
      return { count: 1 }
    },
  }

  const result = await new DeveloperUserService(users).resetBranchUserPassword(branchUser.id)

  assert.equal(result.userId, branchUser.id)
  assert.ok(result.newPassword.length >= 20)
  assert.notEqual(storedHash, result.newPassword)
  assert.equal(await bcrypt.compare(result.newPassword, storedHash), true)
})

test('does not return a new password when no branch user was updated', async () => {
  const users = makeUsers({
    listBranchUsers: async () => [],
    updateBranchUserPassword: async () => ({ count: 0 }),
  })

  await assert.rejects(
    new DeveloperUserService(users, async () => 'hashed-value').resetBranchUserPassword('central-user'),
    { message: 'User cabang tidak ditemukan' },
  )
})

test('moves a branch user and reports account activation changes', async () => {
  let movedTo = ''
  let activeValue = true
  const users = makeUsers({
    moveBranchUser: async (_id, workspaceId) => {
      movedTo = workspaceId
      return { count: 1 }
    },
    setBranchUserActive: async (_id, isActive) => {
      activeValue = isActive
      return { count: 1 }
    },
  })
  const service = new DeveloperUserService(users)

  assert.deepEqual(await service.moveBranchUser(branchUser.id, 'workspace-jakarta'), {
    userId: branchUser.id,
    workspaceId: 'workspace-jakarta',
  })
  assert.equal(movedTo, 'workspace-jakarta')
  assert.deepEqual(await service.setBranchUserActive(branchUser.id, false), {
    userId: branchUser.id,
    isActive: false,
  })
  assert.equal(activeValue, false)
})

test('opens a branch with a hashed initial admin password and normalized email', async () => {
  let createdInput: Parameters<UserRepository['createBranchWithAdmin']>[0] | undefined
  const users = makeUsers({
    createBranchWithAdmin: async (input) => {
      createdInput = input
      return {
        id: 'workspace-new',
        name: input.name,
        slug: input.slug,
        domain: input.domain,
        contactPhone: input.contactPhone,
        isActive: true,
        users: [{
          id: 'admin-new',
          name: input.adminName,
          email: input.adminEmail,
          role: 'branch_admin',
          isActive: true,
        }],
      }
    },
  })
  const result = await new DeveloperUserService(users).createBranch({
    name: 'Jakarta',
    slug: 'jakarta',
    contactPhone: '081234567890',
    adminName: 'Admin Jakarta',
    adminEmail: 'ADMIN@EXAMPLE.TEST',
  })

  assert.equal(result.workspace.slug, 'jakarta')
  assert.equal(result.admin.email, 'admin@example.test')
  assert.equal(createdInput?.adminEmail, 'admin@example.test')
  assert.match(createdInput?.domain ?? '', /^jakarta\./)
  assert.ok(createdInput?.passwordHash)
  assert.equal(await bcrypt.compare(result.newPassword, createdInput?.passwordHash ?? ''), true)
})

test('reports branch slug or admin email collisions clearly', async () => {
  const users = makeUsers({
    createBranchWithAdmin: async () => {
      throw { code: 'P2002' }
    },
  })

  await assert.rejects(
    new DeveloperUserService(users, async () => 'hashed-value').createBranch({
      name: 'Jakarta',
      slug: 'jakarta',
      contactPhone: '081234567890',
      adminName: 'Admin Jakarta',
      adminEmail: 'admin@example.test',
    }),
    (error) => error instanceof ConflictError && error.message === 'Slug cabang atau email admin sudah digunakan',
  )
})
