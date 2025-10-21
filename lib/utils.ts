import { CardDetail, CardTimeline, ListWithCards } from '@/types/common'
import { CardReminderType } from '@prisma/client'
import { QueryClient } from '@tanstack/react-query'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { sortedCardLabelColors } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function getColorTextClass(color: string) {
  return sortedCardLabelColors.flatMap((col) => col.shades).find((shade) => shade.value === color)?.textColor
}

export function getTempId(prefix: string) {
  return `${prefix}-${Date.now().toString()}`
}

export const updateCardDetailQuery = (
  queryClient: QueryClient,
  boardSlug: string,
  cardSlug: string,
  updater: (prev: CardDetail) => CardDetail
) => {
  queryClient.setQueryData(['card', boardSlug, cardSlug], (prev: CardDetail) => {
    if (!prev) return prev
    return updater(prev)
  })
}

export const updateBoardListsQuery = (
  queryClient: QueryClient,
  boardSlug: string,
  updater: (prev: ListWithCards[]) => ListWithCards[]
) => {
  queryClient.setQueryData(['board', 'lists', boardSlug], (prev: ListWithCards[]) => {
    if (!prev) return prev
    return updater(prev)
  })
}

export const updateCardActivitiesQuery = (
  queryClient: QueryClient,
  boardSlug: string,
  cardSlug: string,
  updater: (prev: CardTimeline) => CardTimeline
) => {
  queryClient.setQueryData(['card', 'activities', 'comments', boardSlug, cardSlug], (prev: CardTimeline) => {
    if (!prev) return prev

    return updater(prev)
  })
}

export function getReminderDate(date: Date, type: CardReminderType) {
  const newDate = new Date(date)

  switch (type) {
    case 'NONE':
    case 'EXPIRED_DATE':
      return newDate
    case 'FIVE_MINUTES_BEFORE':
      newDate.setMinutes(newDate.getMinutes() - 5)
      break
    case 'TEN_MINUTES_BEFORE':
      newDate.setMinutes(newDate.getMinutes() - 10)
      break
    case 'FIFTEEN_MINUTES_BEFORE':
      newDate.setMinutes(newDate.getMinutes() - 15)
      break
    case 'ONE_HOUR_BEFORE':
      newDate.setHours(newDate.getHours() - 1)
      break
    case 'TWO_HOURS_BEFORE':
      newDate.setHours(newDate.getHours() - 2)
      break
    case 'ONE_DAY_BEFORE':
      newDate.setDate(newDate.getDate() - 1)
      break
    case 'TWO_DAYS_BEFORE':
      newDate.setDate(newDate.getDate() - 2)
      break
  }

  return newDate
}

export function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}
