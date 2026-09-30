import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { canAccessWorkspace, resolveWorkspace } from '../src/domain.js'

const originalAppDomain = process.env.APP_DOMAIN
const originalBranchDomain = process.env.BRANCH_DOMAIN
before(() => {
  process.env.APP_DOMAIN = 'bst-maintenance.com'
  process.env.BRANCH_DOMAIN = 'bst-finance.com'
})
after(() => {
  if (originalAppDomain === undefined) delete process.env.APP_DOMAIN
  else process.env.APP_DOMAIN = originalAppDomain
  if (originalBranchDomain === undefined) delete process.env.BRANCH_DOMAIN
  else process.env.BRANCH_DOMAIN = originalBranchDomain
})

test('resolves the root domain and its reserved central hosts to the developer workspace', () => {
  for (const host of ['bst-maintenance.com', 'www.bst-maintenance.com', 'central.bst-maintenance.com']) {
    assert.deepEqual(resolveWorkspace(host), {
      host,
      type: 'central',
      slug: 'central',
      domain: 'bst-maintenance.com',
    })
  }
})

test('resolves a single subdomain on the separate branch domain', () => {
  assert.deepEqual(resolveWorkspace('bandung.bst-finance.com'), {
    host: 'bandung.bst-finance.com',
    type: 'branch',
    slug: 'bandung',
    domain: 'bst-maintenance.com',
  })
  assert.equal(resolveWorkspace('bandung.bst-maintenance.com').type, 'unknown')
})

test('allows only the workspace and role assigned to the current domain', () => {
  const developer = { slug: 'central', type: 'central', role: 'developer' }
  const bandungAdmin = { slug: 'bandung', type: 'branch', role: 'branch_admin' }

  assert.equal(canAccessWorkspace(resolveWorkspace('bst-maintenance.com'), developer), true)
  assert.equal(canAccessWorkspace(resolveWorkspace('bst-maintenance.com'), bandungAdmin), false)
  assert.equal(canAccessWorkspace(resolveWorkspace('bandung.bst-finance.com'), bandungAdmin), true)
  assert.equal(canAccessWorkspace(resolveWorkspace('jakarta.bst-finance.com'), bandungAdmin), false)
  assert.equal(canAccessWorkspace(resolveWorkspace('bandung.bst-finance.com'), developer), false)
  assert.equal(canAccessWorkspace(resolveWorkspace('other.example.com'), developer), false)
})

test('keeps local development hosts available without allowing unknown public hosts', () => {
  assert.equal(canAccessWorkspace(resolveWorkspace('localhost'), { slug: 'bandung', type: 'branch', role: 'branch_admin' }), true)
  assert.equal(canAccessWorkspace(resolveWorkspace('127.0.0.1'), { slug: 'central', type: 'central', role: 'developer' }), true)
  assert.equal(canAccessWorkspace(resolveWorkspace('unknown.example.com'), { slug: 'central', type: 'central', role: 'developer' }), false)
})
