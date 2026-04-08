"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { AppSidebar } from "@/components/app-sidebar"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Music2, Flame, CheckCircle2, Clock } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { t } from "@/lib/translations"

export default function DashboardPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const { stats, isLoading: statsLoading } = useDashboardStats()
  const { lang } = useLanguage()
  const tr = t(lang)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/login")
      else setAuthed(true)
    })
  }, [router])

  if (!authed) return null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{tr.navDashboard}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 pt-2">
          <div>
            <h1 className="text-3xl">{tr.welcomeBack}</h1>
            <p className="text-muted-foreground">{tr.welcomeSub}</p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{tr.statDueToday}</CardTitle>
                <Clock className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.dueCount ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground">{tr.statDueSub}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{tr.statStreak}</CardTitle>
                <Flame className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.streak ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground">{tr.statStreakSub}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{tr.statMastered}</CardTitle>
                <CheckCircle2 className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.masteredCount ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground">{tr.statMasteredSub}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{tr.statModes}</CardTitle>
                <Music2 className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">{tr.statModesSub}</p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Link href="/practice" className={buttonVariants({ size: "lg" })}>
              <Music2 className="mr-2 size-4" />
              {tr.startPractice}
            </Link>
            <Link href="/scales" className={buttonVariants({ variant: "outline" })}>
              {tr.browseScales}
            </Link>
          </div>

          {/* Scale grid info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tr.yourLibrary}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{tr.libraryDesc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Major", "Dorian", "Phrygian", "Lydian", "Mixolydian",
                  "Aeolian", "Locrian", "Melodic Minor", "Lydian Dominant",
                  "Altered", "Whole Tone", "Diminished", "Blues",
                  "Bebop Dominant", "Bebop Major", "Pentatonic Major", "Pentatonic Minor",
                ].map((scale) => (
                  <span
                    key={scale}
                    className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium"
                  >
                    {scale}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
