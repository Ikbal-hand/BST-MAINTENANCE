import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import { test } from 'node:test'
import { ConflictError, UnauthorizedError } from '../src/errors.js'
import type { UserRepository } from '../src/repositories/user-repository.js'
import { AuthService } from '../src/services/auth-service.js'

const currentPassword = 'current-password-123'
const testUser = {
  id: 'branch-admin-id',
  workspaceId: 'workspace-bandung',
  name: 'Admin Bandung',
  email: 'admin@bandung.test',
  passwordHash: bcrypt.hashSync(currentPassword, 4),
  passwordVersion: 0,
  role: 'branch_admin',
  isActive: true,
  workspace: {
    id: 'workspace-bandung',
    slug: 'bandung',
    name: 'Bandung',
    type: 'branch',
    isActive: true,
  },
}

test('looks up a repeated email in the current branch workspace during login', async () => {
  let queriedEmail = ''
  let queriedWorkspaceSlug: string | undefined
  const users: Pick<UserRepository, 'findByEmail' | 'findById' | 'changePassword'> = {
    findByEmail: async (email, workspaceSlug) => {
      queriedEmail = email
      queriedWorkspaceSlug = workspaceSlug
      return testUser
    },
    findById: async () => testUser,
    changePassword: async () => ({ count: 1 }),
  }

  const result = await new AuthService(users).login(
    'ADMIN@EXAMPLE.TEST',
    currentPassword,
    false,
    { host: 'bandung.example.test', type: 'branch', slug: 'bandung', domain: 'example.test' },
  )

  assert.equal(queriedEmail, 'admin@example.test')
  assert.equal(queriedWorkspaceSlug, 'bandung')
  assert.equal(result.user.workspace.slug, 'bandung')
})

test('changes a password after verifying the current password', async () => {
  let storedHash = testUser.passwordHash
  let updateCount = 0
  const users: Pick<UserRepository, 'findByEmail' | 'findById' | 'changePassword'> = {
    findByEmail: async () => testUser,
    findById: async () => ({ ...testUser, passwordHash: storedHash }),
    changePassword: async (_id, oldHash, newHash) => {
      if (storedHash !== oldHash) return { count: 0 }
      storedHash = newHash
      updateCount += 1
      return { count: 1 }
    },
  }

  assert.deepEqual(await new AuthService(users).changePassword(testUser.id, currentPassword, 'new-password-456'), {
    changed: true,
  })
  assert.equal(updateCount, 1)
  assert.notEqual(storedHash, 'new-password-456')
  assert.equal(await bcrypt.compare('new-password-456', storedHash), true)
})

test('rejects an incorrect current password without changing the password', async () => {
  let updated = false
  const users: Pick<UserRepository, 'findByEmail' | 'findById' | 'changePassword'> = {
    findByEmail: async () => testUser,
    findById: async () => testUser,
    changePassword: async () => {
      updated = true
      return { count: 1 }
    },
  }

  await assert.rejects(
    new AuthService(users).changePassword(testUser.id, 'incorrect-password', 'new-password-456'),
    (error) => error instanceof UnauthorizedError && error.message === 'Password saat ini tidak sesuai',
  )
  assert.equal(updated, false)
})

test('rejects reusing the current password', async () => {
  const users: Pick<UserRepository, 'findByEmail' | 'findById' | 'changePassword'> = {
    findByEmail: async () => testUser,
    findById: async () => testUser,
    changePassword: async () => ({ count: 0 }),
  }

  await assert.rejects(
    new AuthService(users).changePassword(testUser.id, currentPassword, currentPassword),
    (error) => error instanceof ConflictError && error.message === 'Password baru harus berbeda dari password saat ini',
  )
})

test('rejects a password update if another change wins the race', async () => {
  const users: Pick<UserRepository, 'findByEmail' | 'findById' | 'changePassword'> = {
    findByEmail: async () => testUser,
    findById: async () => testUser,
    changePassword: async () => ({ count: 0 }),
  }

  await assert.rejects(
    new AuthService(users).changePassword(testUser.id, currentPassword, 'new-password-456'),
    (error) => error instanceof ConflictError && error.message.includes('baru saja berubah'),
  )
})
