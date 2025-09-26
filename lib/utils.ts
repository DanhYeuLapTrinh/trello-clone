import { clsx, type ClassValue } from 'clsx'
import { isBefore } from 'date-fns'
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

export function isCardExpired(endDate: Date | null): boolean {
  if (!endDate) return false
  return isBefore(endDate, new Date())
}

export function getColorTextClass(color: string) {
  return sortedCardLabelColors.flatMap((col) => col.shades).find((shade) => shade.value === color)?.textColor
}

export function getTempId(prefix: string) {
  return `${prefix}-${Date.now().toString()}`
}
