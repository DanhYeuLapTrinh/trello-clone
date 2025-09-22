import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** --- System Data --- */

async function seedSystem() {}

/** --- Demo/All Data --- */
async function seedDemoData() {}

async function main() {
  const args = process.argv.slice(2)
  const systemOnly = args.includes('--system')

  if (systemOnly) {
    await seedSystem()
  } else {
    await seedSystem()
    await seedDemoData()
  }

  console.log('🌱 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
