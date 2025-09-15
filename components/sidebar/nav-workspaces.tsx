'use client'

import { ChevronRight, Settings, Trello, Users } from 'lucide-react'

import { getMeWorkspaces } from '@/app/actions/workspaces/actions'
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
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

const subItems = [
  {
    title: 'Bảng',
    icon: Trello,
    url: (id: string) => `/workspaces/${id}/boards`
  },
  {
    title: 'Thành viên',
    icon: Users,
    url: (id: string) => `/workspaces/${id}/members`
  },
  {
    title: 'Cài đặt',
    icon: Settings,
    url: (id: string) => `/workspaces/${id}/settings`
  }
]

export function NavWorkspaces({ userId }: { userId: string }) {
  const { data: workspaces } = useQuery({
    queryKey: ['workspaces', userId],
    queryFn: getMeWorkspaces
  })

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Các Không gian làm việc</SidebarGroupLabel>
      <SidebarMenu>
        {workspaces?.map((item) => (
          <Collapsible key={item.name} asChild>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.name}>
                <Link href={`/workspaces/${item.shortName}`}>
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>

              <>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className='data-[state=open]:rotate-90'>
                    <ChevronRight />
                    <span className='sr-only'>Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {subItems?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.url(item.id)}>
                            <subItem.icon />
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
