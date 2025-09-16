import { BoardBackground, BoardVisibility } from '@prisma/client'
import { Globe, LockKeyhole, LucideIcon, Users } from 'lucide-react'

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
