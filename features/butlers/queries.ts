'use server'

import prisma from '@/prisma/prisma'
import { BoardButler, butlerActiveWhere, butlerOrderBy, butlerSelect } from '@/prisma/queries/butler'
import { userSelect } from '@/prisma/queries/user'
import { ButlerCategory } from '@prisma/client'

/**
 * Get the butlers of a board by category
 * @param slug - board slug
 * @param category - butler category
 * @returns The butlers of a board by category
 */
export const getBoardButlers = async (slug: string, category: ButlerCategory): Promise<BoardButler[]> => {
  const butlers = await prisma.butler.findMany({
    select: {
      ...butlerSelect,
      creator: {
        select: userSelect
      }
    },
    where: {
      board: {
        slug: slug
      },
      category: category,
      ...butlerActiveWhere
    },
    orderBy: butlerOrderBy
  })

  return butlers
}
