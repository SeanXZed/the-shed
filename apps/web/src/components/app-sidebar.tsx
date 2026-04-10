"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Music2,
  BookOpen,
  Piano,
  LogOut,
  ChevronsUpDown,
  Music,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useLanguage } from "@/hooks/use-language"
import { t } from "@/lib/translations"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const [user, setUser] = useState<User | null>(null)
  const { lang, toggle } = useLanguage()
  const tr = t(lang)

  const navItems = [
    { title: tr.navDashboard, url: "/dashboard", icon: LayoutDashboard },
    { title: tr.navPractice,  url: "/practice",  icon: Music2 },
    { title: tr.navScales,    url: "/scales",     icon: BookOpen },
    { title: tr.navChords,    url: "/chords",     icon: Piano },
  ]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??"

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Music className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{tr.appName}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">{tr.appSubtitle}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<a href={item.url} />} tooltip={item.title}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Language toggle */}
      <div className="px-3 py-2">
        <div className="flex items-center rounded-lg bg-muted/50 p-1">
          {(['en', 'zh'] as const).map((l) => (
            <button
              key={l}
              onClick={() => l !== lang && toggle()}
              className={cn(
                'flex-1 rounded-md py-1 text-xs font-medium transition-colors',
                lang === l
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l === 'en' ? 'EN' : '中文'}
            </button>
          ))}
        </div>
      </div>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.email ?? "…"}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  {tr.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
