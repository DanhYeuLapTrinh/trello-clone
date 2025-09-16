import { getMe } from '@/app/actions/users/actions'
import { getMeWorkspaces } from '@/app/actions/workspaces/actions'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
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
          <header className='flex h-16 shrink-0 items-center gap-2'>
            <div className='flex items-center gap-2 px-4'>
              <SidebarTrigger className='-ml-1' />
              <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className='hidden md:block'>
                    <BreadcrumbLink href='#'>Building Your Application</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className='hidden md:block' />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className='px-4 pb-4'>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  )
}
