/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Activity,
  Attachment,
  Board,
  BoardMember,
  Butler,
  Card,
  CardAssignee,
  CardLabel,
  CardWatcher,
  Comment,
  Label,
  List,
  PrismaClient,
  Subtask,
  User,
  Workspace,
  WorkspaceMember
} from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const activities = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'activity.json'), 'utf8')).data as Activity[]
const attachments = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'attachment.json'), 'utf8'))
  .data as Attachment[]
const boards = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'board.json'), 'utf8')).data as Board[]
const cardLabels = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'card-label.json'), 'utf8'))
  .data as CardLabel[]
const cardWatchers = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'card-watcher.json'), 'utf8'))
  .data as CardWatcher[]
const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'card.json'), 'utf8')).data as Card[]
const comments = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'comment.json'), 'utf8')).data as Comment[]
const labels = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'label.json'), 'utf8')).data as Label[]
const lists = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'list.json'), 'utf8')).data as List[]
const subtask = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'subtask.json'), 'utf8')).data as Subtask[]
const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'user.json'), 'utf8')).data as User[]
const workspaces = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'workspace.json'), 'utf8'))
  .data as Workspace[]
const butlers = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'butler.json'), 'utf8')).data as Butler[]
const boardMembers = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'board-member.json'), 'utf8'))
  .data as BoardMember[]
const workspaceMembers = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'workspace-member.json'), 'utf8'))
  .data as WorkspaceMember[]
const cardAssignees = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'card-assignee.json'), 'utf8'))
  .data as CardAssignee[]

/** --- System Data --- */
async function seedSystem() {
  console.log('🌱 Seeding system data...')

  // 1. Seed Users first (no dependencies)
  console.log('  📝 Seeding users...')
  await prisma.$transaction(async (tx) => {
    for (const user of users) {
      await tx.user.upsert({
        where: { id: user.id },
        update: {
          clerkId: user.clerkId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          imageUrl: user.imageUrl,
          isDeleted: user.isDeleted,
          updatedAt: new Date(user.updatedAt)
        },
        create: {
          id: user.id,
          clerkId: user.clerkId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          imageUrl: user.imageUrl,
          isDeleted: user.isDeleted,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      })
    }
  })

  // 2. Seed Workspaces (depends on Users)
  console.log('  🏢 Seeding workspaces...')
  await prisma.$transaction(async (tx) => {
    for (const workspace of workspaces) {
      await tx.workspace.upsert({
        where: { id: workspace.id },
        update: {
          name: workspace.name,
          shortName: workspace.shortName,
          websiteUrl: workspace.websiteUrl,
          description: workspace.description,
          imageUrl: workspace.imageUrl,
          isDeleted: workspace.isDeleted,
          ownerId: workspace.ownerId,
          updatedAt: new Date(workspace.updatedAt)
        },
        create: {
          id: workspace.id,
          name: workspace.name,
          shortName: workspace.shortName,
          websiteUrl: workspace.websiteUrl,
          description: workspace.description,
          imageUrl: workspace.imageUrl,
          isDeleted: workspace.isDeleted,
          ownerId: workspace.ownerId,
          createdAt: new Date(workspace.createdAt),
          updatedAt: new Date(workspace.updatedAt)
        }
      })
    }
  })

  // 3. Seed Workspace Members (depends on Workspaces and Users)
  console.log('  👥 Seeding workspace members...')
  await prisma.$transaction(async (tx) => {
    for (const workspaceMember of workspaceMembers) {
      await tx.workspaceMember.upsert({
        where: { id: workspaceMember.id },
        update: {
          role: workspaceMember.role,
          workspaceId: workspaceMember.workspaceId,
          userId: workspaceMember.userId
        },
        create: {
          id: workspaceMember.id,
          role: workspaceMember.role,
          workspaceId: workspaceMember.workspaceId,
          userId: workspaceMember.userId
        }
      })
    }
  })

  // 4. Seed Boards (depends on Workspaces and Users)
  console.log('  📋 Seeding boards...')
  await prisma.$transaction(async (tx) => {
    for (const board of boards) {
      await tx.board.upsert({
        where: { id: board.id },
        update: {
          name: board.name,
          description: board.description,
          background: board.background,
          visibility: board.visibility,
          slug: board.slug,
          isDeleted: board.isDeleted,
          workspaceId: board.workspaceId,
          ownerId: board.ownerId,
          updatedAt: new Date(board.updatedAt)
        },
        create: {
          id: board.id,
          name: board.name,
          description: board.description,
          background: board.background,
          visibility: board.visibility,
          slug: board.slug,
          isDeleted: board.isDeleted,
          workspaceId: board.workspaceId,
          ownerId: board.ownerId,
          createdAt: new Date(board.createdAt),
          updatedAt: new Date(board.updatedAt)
        }
      })
    }
  })

  // 5. Seed Butlers (depends on Boards)
  console.log('  🤖 Seeding butlers...')
  await prisma.$transaction(async (tx) => {
    for (const butler of butlers) {
      await tx.butler.upsert({
        where: { id: butler.id },
        update: {
          boardId: butler.boardId,
          creatorId: butler.creatorId,
          category: butler.category,
          handlerKey: butler.handlerKey,
          details: butler.details as any,
          isEnabled: butler.isEnabled,
          isDeleted: butler.isDeleted
        },
        create: {
          id: butler.id,
          boardId: butler.boardId,
          creatorId: butler.creatorId,
          category: butler.category,
          handlerKey: butler.handlerKey,
          details: butler.details as any,
          isEnabled: butler.isEnabled,
          isDeleted: butler.isDeleted,
          createdAt: new Date(butler.createdAt),
          updatedAt: new Date(butler.updatedAt)
        }
      })
    }
  })

  // 6. Seed Lists (depends on Boards)
  console.log('  📝 Seeding lists...')
  await prisma.$transaction(async (tx) => {
    for (const list of lists) {
      await tx.list.upsert({
        where: { id: list.id },
        update: {
          name: list.name,
          position: list.position,
          isDeleted: list.isDeleted,
          boardId: list.boardId,
          creatorId: list.creatorId,
          updatedAt: new Date(list.updatedAt)
        },
        create: {
          id: list.id,
          name: list.name,
          position: list.position,
          isDeleted: list.isDeleted,
          boardId: list.boardId,
          creatorId: list.creatorId,
          createdAt: new Date(list.createdAt),
          updatedAt: new Date(list.updatedAt)
        }
      })
    }
  })

  // 7. Seed Labels (depends on Boards)
  console.log('  🏷️ Seeding labels...')
  await prisma.$transaction(async (tx) => {
    for (const label of labels) {
      await tx.label.upsert({
        where: { id: label.id },
        update: {
          title: label.title,
          color: label.color,
          isDeleted: label.isDeleted,
          boardId: label.boardId,
          updatedAt: new Date(label.updatedAt)
        },
        create: {
          id: label.id,
          title: label.title,
          color: label.color,
          isDeleted: label.isDeleted,
          boardId: label.boardId,
          createdAt: new Date(label.createdAt),
          updatedAt: new Date(label.updatedAt)
        }
      })
    }
  })

  // 8. Seed Cards (depends on Lists)
  console.log('  🃏 Seeding cards...')
  await prisma.$transaction(async (tx) => {
    for (const card of cards) {
      await tx.card.upsert({
        where: { id: card.id },
        update: {
          title: card.title,
          slug: card.slug,
          description: card.description,
          position: card.position,
          imageUrl: card.imageUrl,
          startDate: card.startDate ? new Date(card.startDate) : null,
          endDate: card.endDate ? new Date(card.endDate) : null,
          reminderType: card.reminderType,
          isDeleted: card.isDeleted,
          listId: card.listId,
          updatedAt: new Date(card.updatedAt)
        },
        create: {
          id: card.id,
          creatorId: card.creatorId,

          title: card.title,
          slug: card.slug,
          description: card.description,
          position: card.position,
          imageUrl: card.imageUrl,
          startDate: card.startDate ? new Date(card.startDate) : null,
          endDate: card.endDate ? new Date(card.endDate) : null,
          reminderType: card.reminderType,
          isDeleted: card.isDeleted,
          listId: card.listId,
          createdAt: new Date(card.createdAt),
          updatedAt: new Date(card.updatedAt)
        }
      })
    }
  })

  // 9. Seed Board Members (depends on Boards and Users)
  console.log('  👥 Seeding board members...')
  await prisma.$transaction(async (tx) => {
    for (const boardMember of boardMembers) {
      await tx.boardMember.upsert({
        where: { id: boardMember.id },
        update: {
          role: boardMember.role,
          boardId: boardMember.boardId,
          userId: boardMember.userId,
          lastAssignedAt: new Date(boardMember.lastAssignedAt)
        },
        create: {
          id: boardMember.id,
          role: boardMember.role,
          boardId: boardMember.boardId,
          userId: boardMember.userId,
          lastAssignedAt: new Date(boardMember.lastAssignedAt)
        }
      })
    }
  })

  console.log('✅ System data seeded successfully!')
}

/** --- Demo/All Data --- */
async function seedDemoData() {
  console.log('🌱 Seeding demo data...')

  // 10. Seed Subtasks (depends on Cards, self-referential)
  console.log('  ✅ Seeding subtasks...')
  await prisma.$transaction(async (tx) => {
    // First pass: create subtasks without parent references
    for (const subtaskItem of subtask) {
      await tx.subtask.upsert({
        where: { id: subtaskItem.id },
        update: {
          title: subtaskItem.title,
          isDone: subtaskItem.isDone,
          cardId: subtaskItem.cardId,
          isDeleted: subtaskItem.isDeleted,
          updatedAt: new Date(subtaskItem.updatedAt)
        },
        create: {
          id: subtaskItem.id,
          title: subtaskItem.title,
          isDone: subtaskItem.isDone,
          cardId: subtaskItem.cardId,
          isDeleted: subtaskItem.isDeleted,
          createdAt: new Date(subtaskItem.createdAt),
          updatedAt: new Date(subtaskItem.updatedAt)
        }
      })
    }
  })

  // Second pass: update parent references
  await prisma.$transaction(async (tx) => {
    for (const subtaskItem of subtask) {
      if (subtaskItem.parentId) {
        await tx.subtask.update({
          where: { id: subtaskItem.id },
          data: { parentId: subtaskItem.parentId }
        })
      }
    }
  })

  // 11. Seed Card Assignees (depends on Cards and Users)
  console.log('  👤 Seeding card assignees...')
  await prisma.$transaction(async (tx) => {
    for (const assignee of cardAssignees) {
      await tx.cardAssignee.upsert({
        where: {
          cardId_userId: {
            cardId: assignee.cardId,
            userId: assignee.userId
          }
        },
        update: {
          cardId: assignee.cardId,
          userId: assignee.userId
        },
        create: {
          id: assignee.id,
          cardId: assignee.cardId,
          userId: assignee.userId
        }
      })
    }
  })

  // 12. Seed Card Watchers (depends on Cards and Users)
  console.log('  👀 Seeding card watchers...')
  await prisma.$transaction(async (tx) => {
    for (const watcher of cardWatchers) {
      await tx.cardWatcher.upsert({
        where: {
          cardId_userId: {
            cardId: watcher.cardId,
            userId: watcher.userId
          }
        },
        update: {
          updatedAt: new Date(watcher.updatedAt)
        },
        create: {
          id: watcher.id,
          cardId: watcher.cardId,
          userId: watcher.userId,
          createdAt: new Date(watcher.createdAt),
          updatedAt: new Date(watcher.updatedAt)
        }
      })
    }
  })

  // 13. Seed Card Labels (depends on Cards and Labels)
  console.log('  🏷️ Seeding card labels...')
  await prisma.$transaction(async (tx) => {
    for (const cardLabel of cardLabels) {
      await tx.cardLabel.upsert({
        where: {
          cardId_labelId: {
            cardId: cardLabel.cardId,
            labelId: cardLabel.labelId
          }
        },
        update: {
          updatedAt: new Date(cardLabel.updatedAt)
        },
        create: {
          id: cardLabel.id,
          cardId: cardLabel.cardId,
          labelId: cardLabel.labelId,
          createdAt: new Date(cardLabel.createdAt),
          updatedAt: new Date(cardLabel.updatedAt)
        }
      })
    }
  })

  // 14. Seed Comments (depends on Cards and Users)
  console.log('  💬 Seeding comments...')
  await prisma.$transaction(async (tx) => {
    for (const comment of comments) {
      await tx.comment.upsert({
        where: { id: comment.id },
        update: {
          content: comment.content,
          isDeleted: comment.isDeleted,
          cardId: comment.cardId,
          userId: comment.userId,
          updatedAt: new Date(comment.updatedAt)
        },
        create: {
          id: comment.id,
          content: comment.content,
          isDeleted: comment.isDeleted,
          cardId: comment.cardId,
          userId: comment.userId,
          createdAt: new Date(comment.createdAt),
          updatedAt: new Date(comment.updatedAt)
        }
      })
    }
  })

  // 15. Seed Attachments (depends on Cards)
  console.log('  📎 Seeding attachments...')
  await prisma.$transaction(async (tx) => {
    for (const attachment of attachments) {
      await tx.attachment.upsert({
        where: { id: attachment.id },
        update: {
          url: attachment.url,
          fileName: attachment.fileName,
          fileType: attachment.fileType,
          isDeleted: attachment.isDeleted,
          cardId: attachment.cardId,
          updatedAt: new Date(attachment.updatedAt)
        },
        create: {
          id: attachment.id,
          url: attachment.url,
          fileName: attachment.fileName,
          fileType: attachment.fileType,
          isDeleted: attachment.isDeleted,
          cardId: attachment.cardId,
          createdAt: new Date(attachment.createdAt),
          updatedAt: new Date(attachment.updatedAt)
        }
      })
    }
  })

  // 16. Seed Activities (depends on Cards and Users)
  console.log('  📊 Seeding activities...')
  await prisma.$transaction(async (tx) => {
    for (const activity of activities) {
      await tx.activity.upsert({
        where: { id: activity.id },
        update: {
          model: activity.model,
          action: activity.action,
          details: activity.details as any,
          userId: activity.userId,
          cardId: activity.cardId,
          updatedAt: new Date(activity.updatedAt)
        },
        create: {
          id: activity.id,
          model: activity.model,
          action: activity.action,
          details: activity.details as any,
          userId: activity.userId,
          cardId: activity.cardId,
          createdAt: new Date(activity.createdAt),
          updatedAt: new Date(activity.updatedAt)
        }
      })
    }
  })

  console.log('✅ Demo data seeded successfully!')
}

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
