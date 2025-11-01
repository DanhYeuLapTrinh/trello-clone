'use client'

import { type LucideIcon } from 'lucide-react'

import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavMain({
  items
}: {
  items: {
    name: string
    url: string
    urlValue: string[]
    icon: LucideIcon
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className='group-data-[collapsible=icon]:hidden'>
      <SidebarMenu>
        {items.map((item) => {
          const segments = pathname.split('/')
          const isActive = segments[1] === item.urlValue[0]

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild className={isActive ? 'bg-primary/10' : ''}>
                <Link href={item.url}>
                  <item.icon />
                  <span className={isActive ? 'text-primary font-medium' : ''}>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
