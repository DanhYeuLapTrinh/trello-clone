'use server'

import prisma from '@/prisma/prisma'
import { boardAccessWhere, BoardOverView, boardOverviewSelect, BoardUser } from '@/prisma/queries/board'
import { labelActiveWhere, labelOrderBy, labelSelect, UILabel } from '@/prisma/queries/label'
import { listSelect, ListWithCards, listWithCardsSelect, UIList } from '@/prisma/queries/list'
import { userSelect } from '@/prisma/queries/user'
import { NotFoundError } from '@/shared/error'
import { Role } from '@prisma/client'
import { getMe } from '../users/queries'

/**
 * Get the overview of a board
 * @param slug - board slug
 * @returns The overview of the board
 */
export const getBoardOverview = async (slug: string): Promise<BoardOverView | null> => {
  const { id } = await getMe()

  try {
    const board = (await prisma.board.findFirst({
      where: {
        slug,
        ...boardAccessWhere(id)
      },
      select: boardOverviewSelect
    })) as BoardOverView | null

    return board
  } catch (error) {
    throw error
  }
}

/**
 * Get the lists with cards of a board
 * @param slug - board slug
 * @returns The lists with cards of the board
 */
export const getBoardListsWithCards = async (slug: string): Promise<ListWithCards[]> => {
  try {
    const { id } = await getMe()

    const board = (await prisma.board.findFirst({
      where: {
        slug,
        ...boardAccessWhere(id)
      },
      select: {
        lists: {
          select: listWithCardsSelect(id),
          orderBy: {
            position: 'asc'
          }
        }
      }
    })) as { lists: ListWithCards[] } | null

    if (!board) {
      throw new NotFoundError('Lists')
    }

    return board.lists
  } catch (error) {
    throw error
  }
}

/**
 * Get the labels of a board
 * @param slug - board slug
 * @returns The labels of the board
 */
export const getBoardLabels = async (slug: string): Promise<UILabel[]> => {
  try {
    const { id } = await getMe()

    const labels = await prisma.label.findMany({
      select: labelSelect,
      where: {
        board: { slug, ...boardAccessWhere(id) },
        ...labelActiveWhere
      },
      orderBy: labelOrderBy
    })

    return labels
  } catch (error) {
    throw error
  }
}

/**
 * Get the members of a board including owner
 * @param slug - board slug
 * @returns The members of a board including owner
 */
export const getBoardUsers = async (slug: string): Promise<BoardUser[]> => {
  try {
    const { id } = await getMe()

    const board = await prisma.board.findFirst({
      where: { slug, ...boardAccessWhere(id) },
      select: {
        owner: {
          select: userSelect
        },
        boardMemberships: {
          select: {
            role: true,
            user: {
              select: userSelect
            }
          }
        }
      }
    })

    if (!board) throw new NotFoundError('Board')

    const owner: BoardUser = {
      id: board.owner.id,
      email: board.owner.email,
      fullName: board.owner.fullName || '',
      imageUrl: board.owner.imageUrl || '',
      role: Role.Owner
    }

    const members: BoardUser[] = board.boardMemberships.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      fullName: m.user.fullName || '',
      imageUrl: m.user.imageUrl || '',
      role: m.role
    }))

    const users = [owner, ...members].filter((user, index, self) => index === self.findIndex((u) => u.id === user.id))

    return users
  } catch (error) {
    throw error
  }
}

/**
 * Get the lists of a board
 * @param slug - board slug
 * @returns The lists of the board
 */
export const getBoardLists = async (slug: string): Promise<UIList[]> => {
  const { id } = await getMe()

  const lists = await prisma.list.findMany({
    select: listSelect,
    where: {
      board: { slug, ...boardAccessWhere(id) }
    }
  })

  return lists
}

/**
 * Check if the user has membership permission
 * @param slug - board slug
 * @returns True if the user has membership permission, false otherwise
 */
export const checkBoardMemberPermission = async (slug: string): Promise<boolean> => {
  try {
    const { id } = await getMe()

    const board = await prisma.board.findUnique({
      where: { slug },
      select: {
        id: true,
        ownerId: true
      }
    })

    if (!board) {
      throw new NotFoundError('Board')
    }

    const boardMember = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId: board.id, userId: id } },
      select: {
        role: true
      }
    })

    return !!boardMember || board.ownerId === id
  } catch (error) {
    throw error
  }
}

/**
 * Check if the user has board permission (admin/owner)
 * @param slug - board slug
 * @returns True if the user has board permission, false otherwise
 */
export const checkBoardPermission = async (slug: string): Promise<boolean> => {
  try {
    const { id } = await getMe()

    const board = await prisma.board.findUnique({
      where: { slug },
      select: {
        id: true,
        ownerId: true,
        boardMemberships: {
          where: { userId: id },
          select: {
            role: true
          }
        }
      }
    })

    if (!board) {
      return false
    }

    if (board.ownerId === id) {
      return true
    }

    const memberRole = board.boardMemberships[0]?.role
    return memberRole === Role.Admin
  } catch {
    return false
  }
}
