import { CardDetail, ListWithCards } from '@/types/common'
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
