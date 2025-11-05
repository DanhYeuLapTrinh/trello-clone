'use client'

import { ChevronRight, Settings, Trello, Users } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar'
import { getMeWorkspaces } from '@/features/workspaces/queries'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const subItems = [
  {
    title: 'Bảng',
    urlValue: ['w', 'home'],
    icon: Trello,
    url: (shortName: string) => `/w/${shortName}/home`
  },
  {
    title: 'Thành viên',
    urlValue: ['w', 'members'],
    icon: Users,
    url: (shortName: string) => `/w/${shortName}/members`
  },
  {
    title: 'Cài đặt',
    urlValue: ['w', 'settings'],
    icon: Settings,
    url: (shortName: string) => `/w/${shortName}/settings`
  }
]

export function NavWorkspaces({ userId }: { userId: string }) {
  const pathname = usePathname()
  const [openWorkspace, setOpenWorkspace] = useState<string | null>(null)

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces', userId],
    queryFn: getMeWorkspaces
  })

  useEffect(() => {
    const current = pathname.split('/')[2]
    setOpenWorkspace(current)
  }, [pathname])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Các Không gian làm việc</SidebarGroupLabel>
      <SidebarMenu>
        {workspaces.map((workspace) => {
          const isOpen = openWorkspace === workspace.shortName

          return (
            <Collapsible
              key={workspace.name}
              asChild
              open={isOpen}
              onOpenChange={(open) => setOpenWorkspace(open ? workspace.shortName : null)}
            >
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={workspace.name}>
                  <span>{workspace.name}</span>
                </SidebarMenuButton>

                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className='data-[state=open]:rotate-90'>
                    <ChevronRight />
                    <span className='sr-only'>Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {subItems?.map((subItem) => {
                      const segments = pathname.split('/')
                      const isActive =
                        segments[1] === subItem.urlValue[0] &&
                        segments[2] === workspace.shortName &&
                        segments[3] === subItem.urlValue[1]

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild className={isActive ? 'bg-primary/10' : ''}>
                            <Link href={subItem.url(workspace.shortName)}>
                              <subItem.icon />
                              <span className={isActive ? 'text-primary font-medium' : ''}>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
