import { PrismaClient } from '@prisma/client'

const REG_OWNER = 'PT Sumber Alfaria Trijaya Tbk.'

async function main() {
  const prisma = new PrismaClient()

  console.log('--- Memulai Handler Migrasi Produksi Data Toko (Store) ---')

  try {
    // 1. Cek apakah kolom ownerName masih ada di tabel Store
    const columns = await prisma.$queryRaw<Array<{ COLUMN_NAME: string }>>`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Store'
        AND COLUMN_NAME = 'ownerName';
    `

    const hasOwnerName = columns.length > 0

    // 2. Update semua toko bertipe REG menjadi 'PT Sumber Alfaria Trijaya Tbk.'
    const regResult = await prisma.$executeRaw`
      UPDATE \`Store\`
      SET \`ownerCompany\` = ${REG_OWNER}
      WHERE UPPER(\`storeType\`) = 'REG';
    `
    console.log(`[OK] Toko REG diperbarui ke "${REG_OWNER}": ${regResult} baris terpengaruh.`)

    // 3. Jika kolom ownerName ada, pindahkan nilai ke ownerCompany untuk toko yang belum memiliki ownerCompany
    if (hasOwnerName) {
      console.log('[INFO] Kolom ownerName terdeteksi. Memindahkan data ownerName ke ownerCompany...')
      const migratedCount = await prisma.$executeRaw`
        UPDATE \`Store\`
        SET \`ownerCompany\` = TRIM(\`ownerName\`)
        WHERE (\`ownerCompany\` IS NULL OR TRIM(\`ownerCompany\`) = '')
          AND \`ownerName\` IS NOT NULL
          AND TRIM(\`ownerName\`) != '';
      `
      console.log(`[OK] Data pemilik non-REG yang dimigrasikan dari ownerName ke ownerCompany: ${migratedCount} baris.`)

      // Drop kolom ownerName
      console.log('[INFO] Menghapus kolom ownerName dari tabel Store...')
      await prisma.$executeRawUnquoted`ALTER TABLE \`Store\` DROP COLUMN \`ownerName\`;`
      console.log('[OK] Kolom ownerName berhasil dihapus.')
    } else {
      console.log('[INFO] Kolom ownerName sudah tidak ada di tabel Store (sudah pernah dimigrasi).')
    }

    console.log('--- Migrasi Produksi Selesai dengan Sukses ---')
  } catch (error) {
    console.error('Terjadi kesalahan saat migrasi produksi:', error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
