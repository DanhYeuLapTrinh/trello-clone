'use server'

import prisma from '@/prisma/prisma'
import { activityOrderBy, activitySelect } from '@/prisma/queries/activity'
import { CardDetail, cardDetailSelect } from '@/prisma/queries/card'
import { commentActiveWhere, commentOrderBy, commentSelect } from '@/prisma/queries/comment'
import { userSelect } from '@/prisma/queries/user'
import { NotFoundError } from '@/shared/error'
import { CardTimeline, TimelineItemType } from '@/shared/types'
import { cache } from 'react'
import { getMe } from '../users/queries'

/**
 * Get card detail
 * @param cardSlug - card slug
 * @returns The detail of the card
 */
export const getCard = cache(async (cardSlug: string): Promise<CardDetail> => {
  try {
    const { id } = await getMe()

    const card = await prisma.card.findUnique({
      where: {
        slug: cardSlug
      },
      select: cardDetailSelect(id)
    })

    if (!card) {
      throw new NotFoundError('Card')
    }

    return card
  } catch (error) {
    throw error
  }
})

/**
 * Get the activities and comments of a card
 * @param cardSlug - card slug
 * @returns The activities and comments of the card
 */
export const getCardActivitiesAndComments = cache(async (cardSlug: string): Promise<CardTimeline> => {
  try {
    const card = await prisma.card.findUnique({
      where: { slug: cardSlug }
    })

    if (!card) {
      throw new NotFoundError('Card')
    }

    const activities = (
      await prisma.activity.findMany({
        select: {
          ...activitySelect,
          user: {
            select: userSelect
          }
        },
        where: { cardId: card.id },
        orderBy: activityOrderBy
      })
    ).map((a) => ({ ...a, __type: TimelineItemType.Activity as const }))

    const comments = (
      await prisma.comment.findMany({
        select: {
          ...commentSelect,
          user: {
            select: userSelect
          }
        },
        where: { cardId: card.id, ...commentActiveWhere },
        orderBy: commentOrderBy
      })
    ).map((c) => ({ ...c, __type: TimelineItemType.Comment as const }))

    const sortedList = [...activities, ...comments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return { activities, comments, sortedList }
  } catch (error) {
    throw error
  }
})
