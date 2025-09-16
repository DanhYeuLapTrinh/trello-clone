import { BoardBackground } from '@prisma/client'

export const boardBackgroundClasses: Record<BoardBackground, string> = {
  OCEAN: 'bg-gradient-to-br from-sky-400 via-teal-500 to-blue-600',
  SUNSET: 'bg-gradient-to-br from-pink-400 via-orange-400 to-red-500',
  FOREST: 'bg-gradient-to-br from-green-400 via-emerald-500 to-green-700',
  ROYAL_PURPLE: 'bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600',
  GOLDEN: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400',
  FIRE: 'bg-gradient-to-br from-red-400 via-orange-500 to-yellow-400',
  SKY: 'bg-gradient-to-br from-sky-300 via-blue-400 to-indigo-500',
  ROSE: 'bg-gradient-to-br from-rose-300 via-pink-400 to-fuchsia-500',
  AQUA: 'bg-gradient-to-br from-cyan-300 via-teal-400 to-blue-500',
  GRAY: 'bg-gradient-to-br from-gray-200 via-slate-400 to-gray-500'
}
