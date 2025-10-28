import { CardLabelColor } from '@/types/ui'
import { BoardBackground, BoardVisibility, CardReminderType, Role } from '@prisma/client'
import { Globe, LockKeyhole, LucideIcon, Users } from 'lucide-react'

export const boardBackgroundClasses: Record<BoardBackground, string> = {
  OCEAN: 'bg-gradient-to-br from-sky-400 via-teal-500 to-blue-600',
  SUNSET: 'bg-gradient-to-br from-pink-400 via-orange-400 to-red-500',
  FOREST: 'bg-gradient-to-br from-green-400 via-emerald-500 to-green-700',
  ROYAL_PURPLE: 'bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600',
  GOLDEN: 'bg-gradient-to-br from-yellow-600 via-amber-400 to-orange-400',
  FIRE: 'bg-gradient-to-br from-red-400 via-orange-500 to-yellow-400',
  SKY: 'bg-gradient-to-br from-sky-600 via-blue-400 to-indigo-500',
  ROSE: 'bg-gradient-to-br from-rose-600 via-pink-400 to-fuchsia-500',
  AQUA: 'bg-gradient-to-br from-cyan-600 via-teal-400 to-blue-500',
  GRAY: 'bg-gradient-to-br from-gray-200 via-slate-400 to-gray-500'
}

export const boardVisibility: Record<BoardVisibility, { title: string; description: string; icon: LucideIcon }> = {
  PUBLIC: {
    title: 'Công khai',
    description:
      'Bất kỳ ai trên mạng internet đều có thể xem bảng thông tin này. Chỉ thành viên bảng thông tin mới có quyền chỉnh sửa.',
    icon: Globe
  },
  WORKSPACE: {
    title: 'Không gian làm việc',
    description: 'Tất cả thành viên của Không gian làm việc có thể xem và sửa bảng thông tin này.',
    icon: Users
  },
  PRIVATE: {
    title: 'Riêng tư',
    description:
      'Chỉ thành viên bảng thông tin mới có quyền xem bảng thông tin này. Quản trị viên có thể đóng bảng thông tin hoặc xóa thành viên.',
    icon: LockKeyhole
  }
}

export const cardReminderTypes: Record<CardReminderType, string> = {
  NONE: 'Không có',
  EXPIRED_DATE: 'Vào thời điểm ngày hết hạn',
  FIVE_MINUTES_BEFORE: '5 phút trước',
  TEN_MINUTES_BEFORE: '10 phút trước',
  FIFTEEN_MINUTES_BEFORE: '15 phút trước',
  ONE_HOUR_BEFORE: '1 giờ trước',
  TWO_HOURS_BEFORE: '2 giờ trước',
  ONE_DAY_BEFORE: '1 ngày trước',
  TWO_DAYS_BEFORE: '2 ngày trước'
}

const cardLabelColors: CardLabelColor[] = [
  {
    baseColor: 'Emerald',
    shades: [
      { value: 'bg-emerald-200', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-emerald-950' },
      { value: 'bg-emerald-400', isDefaultSelect: true, isDefaultDisplay: false, textColor: 'text-emerald-900' },
      { value: 'bg-emerald-600', isDefaultSelect: false, isDefaultDisplay: true, textColor: 'text-background' }
    ]
  },
  {
    baseColor: 'Yellow',
    shades: [
      { value: 'bg-yellow-200', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-yellow-950' },
      { value: 'bg-yellow-400', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-yellow-900' },
      { value: 'bg-yellow-600', isDefaultSelect: false, isDefaultDisplay: true, textColor: 'text-background' }
    ]
  },
  {
    baseColor: 'Orange',
    shades: [
      { value: 'bg-orange-200', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-orange-950' },
      { value: 'bg-orange-400', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-orange-900' },
      { value: 'bg-orange-600', isDefaultSelect: false, isDefaultDisplay: true, textColor: 'text-background' }
    ]
  },
  {
    baseColor: 'Rose',
    shades: [
      { value: 'bg-rose-200', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-rose-950' },
      { value: 'bg-rose-400', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-rose-900' },
      { value: 'bg-rose-600', isDefaultSelect: false, isDefaultDisplay: true, textColor: 'text-background' }
    ]
  },
  {
    baseColor: 'Fuchsia',
    shades: [
      { value: 'bg-fuchsia-200', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-fuchsia-950' },
      { value: 'bg-fuchsia-400', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-fuchsia-900' },
      { value: 'bg-fuchsia-600', isDefaultSelect: false, isDefaultDisplay: true, textColor: 'text-background' }
    ]
  },
  {
    baseColor: 'Indigo',
    shades: [
      { value: 'bg-indigo-200', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-indigo-950' },
      { value: 'bg-indigo-400', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-indigo-900' },
      { value: 'bg-indigo-600', isDefaultSelect: false, isDefaultDisplay: true, textColor: 'text-background' }
    ]
  },
  {
    baseColor: 'Sky',
    shades: [
      { value: 'bg-sky-200', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-sky-950' },
      { value: 'bg-sky-400', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-sky-900' },
      { value: 'bg-sky-600', isDefaultSelect: false, isDefaultDisplay: true, textColor: 'text-background' }
    ]
  },
  {
    baseColor: 'Lime',
    shades: [
      { value: 'bg-lime-200', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-lime-950' },
      { value: 'bg-lime-400', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-lime-900' },
      { value: 'bg-lime-600', isDefaultSelect: false, isDefaultDisplay: true, textColor: 'text-background' }
    ]
  },
  {
    baseColor: 'Pink',
    shades: [
      { value: 'bg-pink-200', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-pink-950' },
      { value: 'bg-pink-400', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-pink-900' },
      { value: 'bg-pink-600', isDefaultSelect: false, isDefaultDisplay: true, textColor: 'text-background' }
    ]
  },
  {
    baseColor: 'Gray',
    shades: [
      { value: 'bg-gray-200', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-gray-950' },
      { value: 'bg-gray-400', isDefaultSelect: false, isDefaultDisplay: false, textColor: 'text-gray-700' },
      { value: 'bg-gray-600', isDefaultSelect: false, isDefaultDisplay: true, textColor: 'text-background' }
    ]
  }
]

export const sortedCardLabelColors = cardLabelColors.sort((a, b) => a.baseColor.localeCompare(b.baseColor))

export const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

export const FILE_TYPE_GROUPS = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  VIDEOS: ['video/mp4'],
  ALL: [...DEFAULT_ALLOWED_TYPES]
}

export const FILE_TYPE_LABEL: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'image/webp': 'WEBP',
  'application/pdf': 'PDF',
  'text/plain': 'TXT',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'video/mp4': 'MP4',
  unknown: '?'
}

export const FILE_FOLDER = {
  ATTACHMENTS: 'attachments',
  CARDS: 'cards',
  TIPTAP: 'tiptap'
}

export const ROLE_LABEL: Record<Role, string> = {
  Owner: 'Chủ',
  Admin: 'Quản trị viên',
  Member: 'Thành viên'
}

export const POSITION_GAP = 1024

export const ABLY_CHANNELS = {
  BOARD: (boardSlug: string) => `board:${boardSlug}`
} as const

export const ABLY_EVENTS = {
  LIST_CREATED: 'list.created',
  CARD_CREATED: 'card.created'
} as const

export type AblyEventPayload = {
  [ABLY_EVENTS.CARD_CREATED]: { boardSlug: string }
  [ABLY_EVENTS.LIST_CREATED]: { listId: string; boardSlug: string; data: Record<string, unknown> }
}
