import { Separator } from '@/components/ui/separator'
import { getGuestWorkspacesWithBoards, getMeWorkspacesWithBoards } from '@/features/workspaces/actions'
import WorkspaceSection from '@/features/workspaces/components/workspace-section'
import { workspaceBackgroundClasses } from '@/lib/constants'
import { redirect } from 'next/navigation'

type Workspace = {
  id: string
  name: string
  imageUrl: string | null
}

const assignWorkspaceBackgrounds = (workspaces: Workspace[]): Map<string, string> => {
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

export default async function DashboardPage() {
  const workspaces = await getMeWorkspacesWithBoards()

  if (workspaces.length === 0) {
    redirect('/w/create')
  }

  const guestWorkspaces = await getGuestWorkspacesWithBoards()

  // Assign unique backgrounds when possible
  const allWorkspaces = [...workspaces, ...guestWorkspaces]
  const backgroundMap = assignWorkspaceBackgrounds(allWorkspaces)

  return (
    <div className='px-4 flex flex-col gap-10 max-w-4xl mx-auto'>
      <WorkspaceSection
        title='CÁC KHÔNG GIAN LÀM VIỆC CỦA BẠN'
        workspaces={workspaces}
        backgroundMap={backgroundMap}
        showActions={true}
      />

      <Separator />

      <WorkspaceSection
        title='CÁC KHÔNG GIAN LÀM VIỆC KHÁCH'
        workspaces={guestWorkspaces}
        backgroundMap={backgroundMap}
        showActions={false}
      />
    </div>
  )
}
