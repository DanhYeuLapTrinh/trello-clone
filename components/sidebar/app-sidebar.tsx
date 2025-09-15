'use client'

import { Activity, Command, Settings, SquareTerminal, Trello, Users } from 'lucide-react'
import * as React from 'react'

import { NavMain } from '@/components/sidebar/nav-main'
import { NavUser } from '@/components/sidebar/nav-user'
import { NavWorkspaces } from '@/components/sidebar/nav-workspaces'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

const data = {
  workspaces: [
    {
      title: 'Dahn',
      url: '#',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: 'Bảng',
          icon: Trello,
          url: '#'
        },
        {
          title: 'Thành viên',
          icon: Users,
          url: '#'
        },
        {
          title: 'Cài đặt',
          icon: Settings,
          url: '#'
        }
      ]
    }
  ],
  main: [
    {
      name: 'Bảng',
      url: '#',
      icon: Trello
    },
    {
      name: 'Trang chủ',
      url: '#',
      icon: Activity
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <a href='#'>
                <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <Command className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>Acme Inc</span>
                  <span className='truncate text-xs'>Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain projects={data.main} />
        <NavWorkspaces items={data.workspaces} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
