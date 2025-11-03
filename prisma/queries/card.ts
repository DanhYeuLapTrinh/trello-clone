import { Prisma } from '@prisma/client'
import { attachmentSelect } from './attachment'
import { labelSelect } from './label'
import { listSelect } from './list'
import { subtaskSelect } from './subtask'
import { userSelect } from './user'

// Queries
export const cardSelect = {
  id: true,
  title: true,
  imageUrl: true,
  listId: true,
  isCompleted: true,
  slug: true,
  description: true,
  startDate: true,
  endDate: true,
  reminderType: true
} satisfies Prisma.CardSelect

export const cardLabelSelect = {
  id: true,
  cardId: true,
  labelId: true
} satisfies Prisma.CardLabelSelect

export const cardAssigneeSelect = {
  id: true,
  cardId: true,
  userId: true
} satisfies Prisma.CardAssigneeSelect

export const cardLabelDetailSelect = {
  ...cardLabelSelect,
  label: {
    select: labelSelect
  }
} satisfies Prisma.CardLabelSelect

export const cardPreviewSelect = (id: string) =>
  ({
    ...cardSelect,
    cardLabels: {
      select: cardLabelDetailSelect,
      where: {
        label: { isDeleted: false }
      },
      orderBy: {
        updatedAt: 'asc'
      }
    },
    subtasks: {
      select: {
        ...subtaskSelect,
        children: {
          select: subtaskSelect,
          where: {
            isDeleted: false,
            NOT: {
              parentId: null
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      where: {
        isDeleted: false,
        parentId: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    },
    assignees: {
      select: {
        user: {
          select: userSelect
        }
      },
      where: {
        user: {
          isDeleted: false
        }
      }
    },
    watchers: {
      select: {
        user: {
          select: userSelect
        }
      },
      where: {
        user: {
          id,
          isDeleted: false
        }
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
  }) satisfies Prisma.CardSelect

export const cardDetailSelect = (id: string) =>
  ({
    ...cardSelect,
    list: {
      select: listSelect
    },
    cardLabels: {
      select: cardLabelDetailSelect,
      where: {
        label: { isDeleted: false }
      },
      orderBy: {
        updatedAt: 'asc'
      }
    },
    subtasks: {
      select: {
        ...subtaskSelect,
        children: {
          select: subtaskSelect,
          where: {
            isDeleted: false,
            NOT: {
              parentId: null
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      where: {
        isDeleted: false,
        parentId: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    },
    assignees: {
      select: {
        user: {
          select: userSelect
        }
      },
      where: {
        user: {
          isDeleted: false
        }
      }
    },
    watchers: {
      select: {
        user: {
          select: userSelect
        }
      },
      where: {
        user: {
          id,
          isDeleted: false
        }
      }
    },
    attachments: {
      select: attachmentSelect,
      where: {
        isDeleted: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    }
  }) satisfies Prisma.CardSelect

// Types
export type UICardLabel = Prisma.CardLabelGetPayload<{
  select: typeof cardLabelSelect
}>

export type CardPreview = Prisma.CardGetPayload<{
  select: ReturnType<typeof cardPreviewSelect>
}>

export type CardDetail = Prisma.CardGetPayload<{
  select: ReturnType<typeof cardDetailSelect>
}>
