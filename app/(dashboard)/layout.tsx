import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { getMe } from '@/features/users/actions'
import { getMeWorkspaces } from '@/features/workspaces/actions'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  // NOTE: always make a new query client for each Server Component that fetches data
  const queryClient = new QueryClient()

  const { id } = await getMe()
  const workspaces = await getMeWorkspaces()

  if (workspaces.length === 0) {
    redirect('/w/create')
  }

  await queryClient.prefetchQuery({
    queryKey: ['me'],
    queryFn: getMe
  })

  await queryClient.prefetchQuery({
    queryKey: ['workspaces', id],
    queryFn: getMeWorkspaces
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider>
        <AppSidebar userId={id} />
        <SidebarInset>
          <header className='flex h-12 shrink-0 items-center gap-2'>
            <div className='flex items-center gap-2 px-4'>
              <SidebarTrigger className='-ml-1' />
            </div>
          </header>
          <div className='px-4 pb-4'>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  )
}
