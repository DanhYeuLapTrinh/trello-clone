import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import CreateBoardDialog from '@/features/boards/components/create-board-dialog'
import { UIWorkspaceWithBoards } from '@/prisma/queries/workspace'
import { boardBackgroundClasses, boardVisibility } from '@/shared/constants'
import { cn } from '@/shared/utils'
import { Plus, Settings, Trello, Users } from 'lucide-react'
import Link from 'next/link'
import { createElement } from 'react'

type WorkspaceSectionProps = {
  title: string
  workspaces: UIWorkspaceWithBoards[]
  backgroundMap: Map<string, string>
  showActions?: boolean
}

export default function WorkspaceSection({
  title,
  workspaces,
  backgroundMap,
  showActions = true
}: WorkspaceSectionProps) {
  if (workspaces.length === 0) return null

  return (
    <div className='space-y-4'>
      <p className='font-semibold text-foreground/80'>{title}</p>

      <div className='space-y-8'>
        {workspaces.map((workspace) => (
          <div key={workspace.id} className='space-y-3'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2 flex-1'>
                {workspace.imageUrl ? (
                  <Avatar className='size-9 rounded-md'>
                    <AvatarImage src={workspace.imageUrl} />
                    <AvatarFallback className='font-bold text-xl rounded-md'>{workspace.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className='size-9 rounded-md'>
                    <AvatarImage src={undefined} />
                    <AvatarFallback
                      className={cn('font-bold text-xl rounded-md text-white', backgroundMap.get(workspace.id))}
                    >
                      {workspace.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <p className='font-semibold'>{workspace.name}</p>
              </div>

              {showActions && (
                <>
                  <Link
                    href={`/w/${workspace.shortName}/home`}
                    className={buttonVariants({ size: 'sm', variant: 'secondary' })}
                  >
                    <Trello />
                    Bảng
                  </Link>
                  <Link
                    href={`/w/${workspace.shortName}/members`}
                    className={buttonVariants({ size: 'sm', variant: 'secondary' })}
                  >
                    <Users />
                    Thành viên
                  </Link>
                  <Link
                    href={`/w/${workspace.shortName}/settings`}
                    className={buttonVariants({ size: 'sm', variant: 'secondary' })}
                  >
                    <Settings />
                    Cài đặt
                  </Link>
                </>
              )}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {workspace.boards.map((board) => (
                <Link href={`/b/${board.slug}`} key={board.id} className='h-28 rounded-md shadow-sm'>
                  <div className={cn(boardBackgroundClasses[board.background], 'p-8 rounded-t-md h-[70%] relative')}>
                    <div className='absolute top-1.5 right-1.5 p-1.5 bg-muted/20 rounded-full'>
                      {createElement(boardVisibility[board.visibility].icon, { className: 'text-white size-4' })}
                    </div>
                  </div>
                  <div className='h-[30%] flex items-center px-2'>
                    <p className='text-sm font-medium truncate'>{board.name}</p>
                  </div>
                </Link>
              ))}

              {showActions && (
                <CreateBoardDialog workspaceId={workspace.id}>
                  <div className='h-28 border border-border rounded-md border-dashed flex items-center gap-2 justify-center bg-muted/20 cursor-pointer'>
                    <Plus className='size-4' />
                    <p className='text-sm font-medium'>Tạo bảng mới</p>
                  </div>
                </CreateBoardDialog>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
