import { Separator } from '@/components/ui/separator'
import WorkspaceSection from '@/features/workspaces/components/workspace-section'
import { getGuestWorkspacesWithBoards, getMeWorkspacesWithBoards } from '@/features/workspaces/queries'
import { UIWorkspace } from '@/prisma/queries/workspace'
import { workspaceBackgroundClasses } from '@/shared/constants'
import { redirect } from 'next/navigation'

const assignWorkspaceBackgrounds = (workspaces: UIWorkspace[]): Map<string, string> => {
  const bgMap = new Map<string, string>()
  const availableBgs = Object.values(workspaceBackgroundClasses)
  const usedBgs: string[] = []

  workspaces.forEach((workspace) => {
    if (workspace.imageUrl) return

    let background: string

    // If we haven't used all backgrounds yet, pick an unused one
    if (usedBgs.length < availableBgs.length) {
      const unusedBackgrounds = availableBgs.filter((bg) => !usedBgs.includes(bg))
      const randomIndex = Math.floor(Math.random() * unusedBackgrounds.length)
      background = unusedBackgrounds[randomIndex]
    } else {
      // All backgrounds used, allow duplicates
      const randomIndex = Math.floor(Math.random() * availableBgs.length)
      background = availableBgs[randomIndex]
    }

    usedBgs.push(background)
    bgMap.set(workspace.id, background)
  })

  return bgMap
}

export default async function BoardsPage() {
  const workspaces = await getMeWorkspacesWithBoards()

  if (workspaces.length === 0) {
    redirect('/w/create')
  }

  const guestWorkspaces = await getGuestWorkspacesWithBoards()

  // Assign unique backgrounds when possible
  const allWorkspaces = [...workspaces, ...guestWorkspaces]
  const backgroundMap = assignWorkspaceBackgrounds(allWorkspaces)

  return (
    <div className='p-4 flex flex-col gap-10 max-w-4xl mx-auto'>
      <WorkspaceSection title='CÁC KHÔNG GIAN LÀM VIỆC CỦA BẠN' workspaces={workspaces} backgroundMap={backgroundMap} />

      {guestWorkspaces.length > 0 && <Separator />}

      <WorkspaceSection
        title='CÁC KHÔNG GIAN LÀM VIỆC KHÁCH'
        workspaces={guestWorkspaces}
        backgroundMap={backgroundMap}
      />
    </div>
  )
}
