import { Prisma } from '@prisma/client'
import { UIBoard } from './board'

// Select
export const workspaceSelect = {
  id: true,
  name: true,
  shortName: true,
  imageUrl: true,
  description: true,
  websiteUrl: true
} satisfies Prisma.WorkspaceSelect

// Where conditions
/**
 * Workspace ownership filter (active workspaces owned by user)
 */
export const workspaceOwnerWhere = (userId: string): Prisma.WorkspaceWhereInput => ({
  ownerId: userId,
  isDeleted: false
})

/**
 * Workspace access filter (for guest users who are members or have board access)
 */
export const workspaceGuestAccessWhere = (userId: string): Prisma.WorkspaceWhereInput => ({
  isDeleted: false,
  OR: [
    {
      boards: {
        some: {
          boardMemberships: {
            some: { userId }
          }
        }
      }
    },
    {
      workspaceMemberships: {
        some: { userId }
      }
    }
  ]
})

/**
 * Workspace membership check (owner or member)
 */
export const workspaceMembershipWhere = (userId: string): Prisma.WorkspaceWhereInput => ({
  OR: [
    { ownerId: userId },
    {
      workspaceMemberships: {
        some: { userId }
      }
    }
  ]
})

// OrderBy
export const workspaceOrderBy = {
  createdAt: 'asc'
} satisfies Prisma.WorkspaceOrderByWithRelationInput

// Types
export type UIWorkspace = Prisma.WorkspaceGetPayload<{
  select: typeof workspaceSelect
}>

export type UIWorkspaceWithBoards = UIWorkspace & {
  boards: UIBoard[]
}
