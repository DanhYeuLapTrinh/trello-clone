import { BoardVisibility, Prisma, Role } from '@prisma/client'
import { UIUser } from './user'

// Select
export const boardSelect = {
  id: true,
  name: true,
  background: true,
  slug: true,
  visibility: true
} satisfies Prisma.BoardSelect

export const boardOverviewSelect = {
  ...boardSelect,
  workspace: {
    select: {
      id: true
    }
  }
} satisfies Prisma.BoardSelect

// Where conditions
/**
 * Board visibility and permission conditions for a given user
 * Checks if user can access board based on:
 * - Board ownership
 * - Board membership
 * - Public visibility
 * - Workspace visibility (for workspace members)
 * - Private visibility (for owner or board members)
 */
export const boardAccessWhere = (userId: string): Prisma.BoardWhereInput => ({
  OR: [
    { ownerId: userId },
    {
      boardMemberships: {
        some: { userId }
      }
    },
    {
      visibility: BoardVisibility.PUBLIC
    },
    {
      visibility: BoardVisibility.WORKSPACE,
      workspace: {
        workspaceMemberships: {
          some: { userId }
        }
      }
    },
    {
      visibility: BoardVisibility.PRIVATE,
      OR: [{ ownerId: userId }, { boardMemberships: { some: { userId } } }]
    }
  ]
})

/**
 * Simplified board visibility where condition (for nested queries in workspaces)
 */
export const boardVisibilityWhere = (userId: string): Prisma.BoardWhereInput => ({
  OR: [
    {
      boardMemberships: {
        some: { userId }
      }
    },
    {
      visibility: 'PUBLIC'
    },
    {
      visibility: 'WORKSPACE',
      workspace: {
        workspaceMemberships: {
          some: { userId }
        }
      }
    },
    {
      visibility: 'PRIVATE',
      OR: [
        { ownerId: userId },
        {
          boardMemberships: {
            some: { userId }
          }
        }
      ]
    }
  ]
})

// OrderBy
export const boardOrderBy = {
  createdAt: 'asc'
} satisfies Prisma.BoardOrderByWithRelationInput

// Types
export type UIBoard = Prisma.BoardGetPayload<{
  select: typeof boardSelect
}>

export type BoardOverView = Prisma.BoardGetPayload<{
  select: typeof boardOverviewSelect
}>

export interface BoardUser extends UIUser {
  role: Role
}
