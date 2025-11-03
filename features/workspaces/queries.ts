'use server'

import prisma from '@/prisma/prisma'
import { boardSelect, boardVisibilityWhere } from '@/prisma/queries/board'
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
 * Get workspaces with boards that the current user:
 * + is workspace member
 * + is board member of that workspace
 * @returns The workspaces that the current user is member or has at least 1 board membership
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
 * Get a workspace with boards by short name and user id
 * @param shortName - the short name of the workspace
 * @param userId - the id of the user
 * @returns The workspace with boards
 */
export const getWorkspaceWithBoards = async (shortName: string): Promise<UIWorkspaceWithBoards> => {
  const { id } = await getMe()

  const workspace = (await prisma.workspace.findFirst({
    select: {
      ...workspaceSelect,
      boards: {
        where: boardVisibilityWhere(id),
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
