'use server'

import { protectedActionClient } from '@/lib/safe-action'
import { slugify } from '@/lib/utils'
import prisma from '@/prisma/prisma'
import { ListWithCards } from '@/types/common'
import { NotFoundError } from '@/types/error'
import { Label } from '@prisma/client'
import { flattenValidationErrors } from 'next-safe-action'
import { createBoardSchema } from './validations'

export const createBoard = protectedActionClient
  .inputSchema(createBoardSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const board = await prisma.board.create({
        data: {
          name: parsedInput.name,
          background: parsedInput.background,
          visibility: parsedInput.visibility,
          description: parsedInput.description,
          workspaceId: parsedInput.workspaceId,
          slug: slugify(parsedInput.name),
          ownerId: ctx.currentUser.id
        }
      })

      return board
    } catch (error) {
      throw error
    }
  })

export const getBoardWithWorkspace = async (slug: string) => {
  try {
    const board = await prisma.board.findUnique({
      where: {
        slug
      },
      include: {
        workspace: true
      }
    })

    if (!board) {
      throw new NotFoundError('Board')
    }

    return {
      board,
      workspace: board.workspace
    }
  } catch (error) {
    throw error
  }
}

export const getBoardListsWithCards = async (slug: string): Promise<ListWithCards[]> => {
  try {
    const board = await prisma.board.findUnique({
      where: {
        slug
      },
      include: {
        lists: {
          orderBy: {
            position: 'asc'
          },
          include: {
            cards: {
              orderBy: {
                position: 'asc'
              },
              include: {
                cardLabels: {
                  where: {
                    label: {
                      isDeleted: false
                    }
                  },
                  include: {
                    label: true
                  },
                  orderBy: {
                    label: {
                      updatedAt: 'asc'
                    }
                  }
                },
                subtasks: {
                  where: {
                    parentId: null,
                    isDeleted: false
                  },
                  include: {
                    children: {
                      where: {
                        isDeleted: false
                      },
                      orderBy: {
                        createdAt: 'asc'
                      }
                    }
                  }
                },
                assignees: {
                  include: {
                    user: true
                  }
                },
                _count: {
                  select: {
                    attachments: true,
                    comments: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!board) {
      throw new NotFoundError('Lists')
    }

    return board.lists
  } catch (error) {
    throw error
  }
}

// Get board labels
export const getBoardLabels = async (slug: string): Promise<Label[]> => {
  try {
    const labels = await prisma.label.findMany({
      where: {
        board: { slug },
        isDeleted: false
      },
      orderBy: {
        updatedAt: 'asc'
      }
    })

    return labels
  } catch (error) {
    throw error
  }
}
