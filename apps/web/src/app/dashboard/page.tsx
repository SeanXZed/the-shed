"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSessionDeduped } from "@/lib/supabase/get-session-deduped"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { useRecentSessionsInfinite } from "@/hooks/use-recent-sessions"
import { useSessionTrend } from "@/hooks/use-session-trend"
import { AppSidebar } from "@/components/app-sidebar"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import { GAME_SLUG_TO_PATH } from "@/lib/practiceGameRoutes"

function formatDateTime(input: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(input))
}

export default function DashboardPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const { stats, isLoading: statsLoading } = useDashboardStats()
  const {
    data: recentPages,
    isLoading: sessionsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRecentSessionsInfinite(5)
  const { trend, isLoading: trendLoading } = useSessionTrend()
  const { lang } = useLanguage()
  const tr = t(lang)
  const recentSessions = (recentPages?.pages ?? []).flat()

  useEffect(() => {
    getSessionDeduped().then(({ data: { session } }) => {
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

        <div className="flex flex-1 flex-col gap-6 p-4 pt-2 sm:p-6 sm:pt-2">
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
                <CardTitle className="text-sm font-medium">{tr.statXp}</CardTitle>
                <Music2 className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.totalXp ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground">{tr.statXpSub}</p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{tr.quickStart}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/practice"
                className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto justify-center")}
              >
                <Music2 className="mr-2 size-4" />
                {tr.startPractice}
              </Link>
              <Link
                href="/scales"
                className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto justify-center")}
              >
                {tr.browseScales}
              </Link>
              <Link
                href="/chords"
                className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto justify-center")}
              >
                {tr.browseChords}
              </Link>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tr.weeklyProgress}</CardTitle>
              <p className="text-sm text-muted-foreground">{tr.weeklyProgressSub}</p>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <Skeleton className="h-28 w-full" />
                </div>
              ) : !trend || trend.totalSessions === 0 ? (
                <p className="text-sm text-muted-foreground">{tr.weeklyNoActivity}</p>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border bg-card/50 p-4">
                      <p className="text-xs text-muted-foreground">{tr.weeklySessions}</p>
                      <p className="mt-2 text-2xl font-bold">{trend.totalSessions}</p>
                    </div>
                    <div className="rounded-lg border bg-card/50 p-4">
                      <p className="text-xs text-muted-foreground">{tr.weeklyItemsCompleted}</p>
                      <p className="mt-2 text-2xl font-bold">{trend.totalItemsCompleted}</p>
                    </div>
                    <div className="rounded-lg border bg-card/50 p-4">
                      <p className="text-xs text-muted-foreground">{tr.weeklyAverageAccuracy}</p>
                      <p className="mt-2 text-2xl font-bold">{trend.averageAccuracy}%</p>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card/50 p-4">
                    <p className="text-xs text-muted-foreground">{tr.weeklyXp}</p>
                    <p className="mt-2 text-2xl font-bold">{trend.totalXp}</p>
                  </div>

                  <div className="flex h-32 items-end gap-3">
                    {trend.daily.map((day) => {
                      const barHeight = trend.maxSessions > 0
                        ? Math.max(12, Math.round((day.sessions / trend.maxSessions) * 100))
                        : 12

                      return (
                        <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                          <div className="flex h-24 w-full items-end">
                            <div
                              className="w-full rounded-md bg-primary/80 transition-all"
                              style={{ height: `${barHeight}%` }}
                              title={`${day.label}: ${day.sessions} ${tr.weeklySessions.toLowerCase()}`}
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-medium">{day.sessions}</p>
                            <p className="text-[11px] text-muted-foreground">{day.label}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tr.recentSessions}</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !recentSessions || recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{tr.recentSessionsEmpty}</p>
              ) : (
                <div className="max-h-[520px] overflow-auto pr-1">
                  <div className="space-y-3">
                    {recentSessions.map((session) => {
                    const accuracy = session.items_completed > 0
                      ? Math.round((session.correct_count / session.items_completed) * 100)
                      : 0

                    const statusLabel =
                      session.status === "active"
                        ? tr.sessionStatusActive
                        : session.status === "abandoned"
                          ? tr.sessionStatusAbandoned
                          : tr.sessionStatusCompleted

                    const practiceSegment = GAME_SLUG_TO_PATH[session.game_slug] ?? "full-scale"
                    const resumeHref = `/practice/${practiceSegment}?resume=${encodeURIComponent(session.id)}`

                    const rowClass = cn(
                      "rounded-lg border bg-card/50 px-4 py-3",
                      session.canResume && "transition-colors hover:border-ring/50 hover:bg-card",
                    )

                    const body = (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{session.game_title}</p>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                {statusLabel}
                              </span>
                              {session.canResume && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                  {tr.sessionContinue}
                                </span>
                              )}
                              {session.is_cram && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                  {tr.sessionCram}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {tr.sessionStarted}: {formatDateTime(session.started_at)}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium">{accuracy}%</p>
                            <p className="text-xs text-muted-foreground">{tr.sessionAccuracy}</p>
                            <p className="mt-2 font-medium">{session.xp} {tr.sessionXp}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{tr.sessionItems}: {session.items_completed}</span>
                          <span>{session.correct_count} / {session.items_completed}</span>
                        </div>
                      </>
                    )

                    return session.canResume ? (
                      <Link key={session.id} href={resumeHref} className={cn(rowClass, "block")}>
                        {body}
                      </Link>
                    ) : (
                      <div key={session.id} className={rowClass}>
                        {body}
                      </div>
                    )
                    })}
                  </div>
                </div>
              )}

              {hasNextPage && (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? tr.recentSessionsLoadingMore : tr.recentSessionsLoadMore}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
