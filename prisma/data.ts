import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function exportData() {
  console.log('📦 Exporting database data to JSON files...\n')

  const dataDir = path.join(__dirname, 'data')

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Define all models to export (in dependency order)
  const models = [
    { name: 'user', fetch: async () => await prisma.user.findMany() },
    { name: 'workspace', fetch: async () => await prisma.workspace.findMany() },
    { name: 'workspace-member', fetch: async () => await prisma.workspaceMember.findMany() },
    { name: 'board', fetch: async () => await prisma.board.findMany() },
    { name: 'board-member', fetch: async () => await prisma.boardMember.findMany() },
    { name: 'list', fetch: async () => await prisma.list.findMany() },
    { name: 'card', fetch: async () => await prisma.card.findMany() },
    { name: 'subtask', fetch: async () => await prisma.subtask.findMany() },
    { name: 'card-assignee', fetch: async () => await prisma.cardAssignee.findMany() },
    { name: 'card-watcher', fetch: async () => await prisma.cardWatcher.findMany() },
    { name: 'label', fetch: async () => await prisma.label.findMany() },
    { name: 'card-label', fetch: async () => await prisma.cardLabel.findMany() },
    { name: 'comment', fetch: async () => await prisma.comment.findMany() },
    { name: 'attachment', fetch: async () => await prisma.attachment.findMany() },
    { name: 'activity', fetch: async () => await prisma.activity.findMany() },
    { name: 'butler', fetch: async () => await prisma.butler.findMany() }
  ]

  for (const { name, fetch } of models) {
    try {
      // Fetch all records from the model
      const records = await fetch()

      // Write to JSON file
      const filePath = path.join(dataDir, `${name}.json`)
      const jsonContent = JSON.stringify({ data: records }, null, 2)

      fs.writeFileSync(filePath, jsonContent, 'utf8')

      console.log(`✅ ${name.padEnd(20)} → ${records.length} records exported`)
    } catch (error) {
      console.error(`❌ Failed to export ${name}:`, error)
    }
  }

  console.log('\n🎉 All data exported successfully!')
}

async function main() {
  await exportData()
}

main()
  .catch((e) => {
    console.error('❌ Export failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
