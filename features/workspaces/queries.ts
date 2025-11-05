'use server'

import prisma from '@/prisma/prisma'
import { boardAccessWhere, boardSelect, boardVisibilityWhere } from '@/prisma/queries/board'
import {
  UIWorkspace,
  UIWorkspaceWithBoards,
  workspaceGuestAccessWhere,
  workspaceMembershipWhere,
  workspaceOrderBy,
  workspaceOwnerWhere,
  workspaceSelect
} from '@/prisma/queries/workspace'
import { NotFoundError } from '@/shared/error'
import { Role } from '@prisma/client'
import { getMe } from '../users/queries'

/**
 * Get workspaces of current user
 * @returns The workspaces of current user
 */
export const getMeWorkspaces = async (): Promise<UIWorkspace[]> => {
  const { id } = await getMe()

  const workspaces = await prisma.workspace.findMany({
    where: workspaceOwnerWhere(id),
    select: workspaceSelect,
    orderBy: workspaceOrderBy
  })

  return workspaces
}

/**
 * Get workspaces of current user with boards
 * @returns The workspaces of current user with boards
 */
export const getMeWorkspacesWithBoards = async (): Promise<UIWorkspaceWithBoards[]> => {
  const { id } = await getMe()

  const workspaces = await prisma.workspace.findMany({
    where: workspaceOwnerWhere(id),
    select: {
      ...workspaceSelect,
      boards: {
        select: boardSelect
      }
    },
    orderBy: workspaceOrderBy
  })

  return workspaces
}

/**
 * Get workspaces where user is a member or has board access.
 * Workspace members see all non-private boards plus private boards they're on.
 * Non-members only see boards they have direct membership to.
 */
export const getGuestWorkspacesWithBoards = async (): Promise<UIWorkspaceWithBoards[]> => {
  const { id } = await getMe()

  const workspaces = (await prisma.workspace.findMany({
    where: workspaceGuestAccessWhere(id),
    select: {
      ...workspaceSelect,
      boards: {
        where: boardVisibilityWhere(id),
        select: boardSelect
      }
    },
    orderBy: workspaceOrderBy
  })) as UIWorkspaceWithBoards[] | []

  return workspaces
}

/**
 * Get workspace details
 * @param shortName - the short name of the workspace
 */
export const getWorkspaceWithBoards = async (shortName: string): Promise<UIWorkspaceWithBoards> => {
  const { id } = await getMe()

  const workspace = (await prisma.workspace.findFirst({
    select: {
      ...workspaceSelect,
      boards: {
        where: boardAccessWhere(id),
        select: boardSelect
      }
    },
    where: {
      shortName,
      ...workspaceMembershipWhere(id)
    }
  })) as UIWorkspaceWithBoards | null

  if (!workspace) {
    throw new NotFoundError('Workspace')
  }

  return workspace
}

/**
 * Check if the user has workspace permission (owner/admin)
 * @param id - workspace id
 * @returns True if the user has workspace permission, false otherwise
 */
export const checkWorkspacePermission = async (id: string): Promise<boolean> => {
  try {
    const { id: userId } = await getMe()

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: {
        ownerId: true,
        workspaceMemberships: {
          where: { userId },
          select: {
            role: true
          }
        }
      }
    })

    if (!workspace) {
      return false
    }

    if (workspace.ownerId === userId) {
      return true
    }

    const memberRole = workspace.workspaceMemberships[0]?.role
    return memberRole === Role.Admin
  } catch {
    return false
  }
}
