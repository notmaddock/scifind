import { createFileRoute, Link, Outlet } from '@tanstack/react-router'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '#/components/ui/sidebar'
import { GraphStarIcon, SearchIcon, UploadIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const Route = createFileRoute('/_sidebar')({
  component: RouteComponent,
})

type NavigationItem = {
  title: string;
  icon: LucideIcon;
  href: string;
}

function Navigation() {
  const nav: NavigationItem[] = [
    { title: 'Search', icon: SearchIcon, href: '/search' },
    { title: 'Upload', icon: UploadIcon, href: '/upload' },
    { title: 'Embeddings', icon: GraphStarIcon, href: '/embeddings' },
  ]


  return <>
    {nav.map(n => {
      const Icon = n.icon

      return (
        <SidebarMenuItem key={n.href}>
          <SidebarMenuButton render={<Link to={n.href} />}>
            <Icon />
            {n.title}
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    })}
  </>
}

function RouteComponent() {
  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader className="px-4 py-4">
          <h1 className="text-lg text-accent-foreground">scifind</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <Navigation />
          </SidebarMenu>

        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <main className='h-full'>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
