import { ByOption } from '@/features/butlers/types'

export const shouldExecuteButler = (by: ByOption, userId1: string, userId2: string): boolean => {
  switch (by) {
    case ByOption.ME:
      return userId1 === userId2
    case ByOption.ANYONE:
      return true
    case ByOption.ANYONE_EXCEPT_ME:
      return userId1 !== userId2
  }
}
