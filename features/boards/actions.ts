'use server'

import BoardInviteEmail from '@/components/mail-templates/board-invite-mail'
import { protectedActionClient } from '@/lib/safe-action'
import { slugify } from '@/lib/utils'
import prisma from '@/prisma/prisma'
import mailService from '@/services/mail.service'
import { ListWithCards } from '@/types/common'
import { NotFoundError } from '@/types/error'
import { Label } from '@prisma/client'
import { render } from '@react-email/render'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { getMe } from '../users/actions'
import { createBoardSchema, shareBoardSchema } from './validations'

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
    const { id: userId } = await getMe()

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
                    updatedAt: 'asc'
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
                  where: {
                    user: {
                      isDeleted: false
                    }
                  },
                  include: {
                    user: true
                  }
                },
                watchers: {
                  where: {
                    user: {
                      isDeleted: false,
                      id: userId
                    }
                  },
                  include: {
                    user: true
                  }
                },
                _count: {
                  select: {
                    attachments: {
                      where: {
                        isDeleted: false
                      }
                    },
                    comments: {
                      where: {
                        isDeleted: false
                      }
                    }
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

export const getBoardLabels = async (slug: string): Promise<Label[]> => {
  try {
    const labels = await prisma.label.findMany({
      where: {
        board: { slug },
        isDeleted: false
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return labels
  } catch (error) {
    throw error
  }
}

export const getBoardOwner = async (slug: string) => {
  try {
    const boardOwner = await prisma.board.findUnique({
      where: { slug },
      select: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true
          }
        }
      }
    })

    if (!boardOwner) {
      throw new NotFoundError('Owner')
    }

    return boardOwner.owner
  } catch (error) {
    throw error
  }
}

export const getBoardMembers = async (slug: string) => {
  try {
    const members = await prisma.boardMember.findMany({
      where: { board: { slug } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true
          }
        }
      }
    })

    return members
  } catch (error) {
    throw error
  }
}

export const shareBoard = protectedActionClient
  .inputSchema(shareBoardSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { boardSlug, value, role, description } = parsedInput
      const { currentUser } = ctx

      const board = await prisma.board.findUnique({ where: { slug: boardSlug } })
      if (!board) {
        throw new NotFoundError('Board')
      }

      await prisma.boardMember.createMany({
        data: value.map((member) => ({
          boardId: board.id,
          userId: member.userId,
          role
        }))
      })

      const html = await render(
        BoardInviteEmail({
          inviterName: currentUser.fullName || 'Trello Clone',
          boardName: board.name,
          boardUrl: `http://localhost:3000/b/${board.slug}`,
          description:
            description || 'Tham gia cùng họ trên Trello để nắm bắt, sắp xếp và giải quyết việc cần làm ở mọi nơi.'
        })
      )

      await mailService.sendEmails({
        payload: {
          from: `${currentUser.fullName} <system@mail.dahn.work>`,
          to: value.map((member) => member.email),
          subject: `${currentUser.fullName} đã mời bạn vào bảng ${board.name}`,
          html
        }
      })

      revalidatePath(`/b/${board.slug}`)

      return { message: 'Bảng đã được chia sẻ thành công.' }
    } catch (error) {
      throw error
    }
  })
