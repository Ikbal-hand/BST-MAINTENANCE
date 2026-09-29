import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function getSeedPassword(): string {
  const password = process.env.SEED_PASSWORD
  if (!password || password.length < 8) {
    throw new Error('SEED_PASSWORD wajib diisi dan minimal 8 karakter')
  }
  return password
}

async function main() {
  const seedPassword = getSeedPassword()
  const passwordHash = await bcrypt.hash(seedPassword, 12)
  const appDomain = process.env.APP_DOMAIN ?? 'bst-maintenance.local'
  const branchDomain = process.env.BRANCH_DOMAIN ?? appDomain

  const central = await prisma.workspace.upsert({
    where: { slug: 'central' },
    update: {
      name: 'BST Maintenance Central',
      type: 'central',
      domain: appDomain,
      isActive: true,
    },
    create: {
      slug: 'central',
      name: 'BST Maintenance Central',
      type: 'central',
      domain: appDomain,
    },
  })

  const bandung = await prisma.workspace.upsert({
    where: { slug: 'bandung' },
    update: {
      name: 'BST Maintenance Bandung',
      type: 'branch',
      domain: `bandung.${branchDomain}`,
      isActive: true,
    },
    create: {
      slug: 'bandung',
      name: 'BST Maintenance Bandung',
      type: 'branch',
      domain: `bandung.${branchDomain}`,
    },
  })

  const users = [
    {
      email: 'admin@bst-maintenance.local',
      name: 'BST Developer',
      role: 'developer',
      workspaceId: central.id,
    },
    {
      email: 'developer@bst-maintenance.local',
      name: 'BST Developer',
      role: 'developer',
      workspaceId: central.id,
    },
    {
      email: 'admin.bandung@bst-maintenance.local',
      name: 'Bandung Administrator',
      role: 'branch_admin',
      workspaceId: bandung.id,
    },
    {
      email: 'operator.bandung@bst-maintenance.local',
      name: 'Bandung Administrator',
      role: 'branch_admin',
      workspaceId: bandung.id,
    },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        workspaceId: user.workspaceId,
        passwordHash,
        isActive: true,
      },
      create: {
        ...user,
        passwordHash,
      },
    })
  }

  await prisma.store.upsert({
    where: {
      workspaceId_code: {
        workspaceId: bandung.id,
        code: 'B032',
      },
    },
    update: {
      name: 'CIKUTRA',
      storeType: 'REG',
      address: 'Jl. Cikutra No. 39 - 41 Bandung',
      ownerCompany: 'PT Sumber Alfaria Trijaya Tbk.',
      isActive: true,
    },
    create: {
      workspaceId: bandung.id,
      code: 'B032',
      name: 'CIKUTRA',
      storeType: 'REG',
      address: 'Jl. Cikutra No. 39 - 41 Bandung',
      ownerCompany: 'PT Sumber Alfaria Trijaya Tbk.',
    },
  })

  console.log(`Seed selesai: ${users.length} user, 2 workspace, 1 sample store`)
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
