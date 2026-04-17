"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSessionDeduped } from "@/lib/supabase/get-session-deduped"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useLanguage } from "@/hooks/use-language"
import { t } from "@/lib/translations"

export default function TrackPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const { lang } = useLanguage()
  const tr = t(lang)

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
                <BreadcrumbPage>{tr.learnTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-2 sm:p-6 sm:pt-2">
          <div>
            <h1 className="text-3xl">{tr.learnTitle}</h1>
            <p className="text-muted-foreground">{tr.learnSubtitle}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tr.learnTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{tr.learnPlaceholderP1}</p>
              <p>{tr.learnPlaceholderP2}</p>
              <ul className="list-disc space-y-2 pl-5 text-foreground">
                <li>{tr.learnBullet1}</li>
                <li>{tr.learnBullet2}</li>
                <li>{tr.learnBullet3}</li>
              </ul>
            </CardContent>
          </Card>

          <section className="space-y-3" aria-labelledby="learn-paths-preview-heading">
            <h2
              id="learn-paths-preview-heading"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {tr.learnPathsPreviewHeading}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              <Link
                href="/track/jazz-101"
                className="group block rounded-xl ring-offset-background transition-all duration-200 ease-out hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99]"
              >
                <Card className="h-full border-2 border-transparent transition-all duration-200 ease-out group-hover:border-neutral-800 group-hover:bg-neutral-950 group-hover:shadow-lg group-hover:shadow-black/25 dark:group-hover:border-neutral-200 dark:group-hover:bg-white dark:group-hover:shadow-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-snug transition-colors duration-200 group-hover:text-white dark:group-hover:text-neutral-950">
                      {tr.learnPathJazz101Title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm leading-relaxed text-muted-foreground transition-colors duration-200 group-hover:text-white/90 dark:group-hover:text-neutral-950/85">
                      {tr.learnPathJazz101Body}
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base leading-snug">{tr.learnPathBirdTitle}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-relaxed text-muted-foreground">{tr.learnPathBirdBody}</p>
                </CardContent>
              </Card>
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base leading-snug">{tr.learnPathMilesTitle}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-relaxed text-muted-foreground">{tr.learnPathMilesBody}</p>
                </CardContent>
              </Card>
              <Card className="h-full border-dashed border-muted-foreground/35 bg-muted/30 ring-muted-foreground/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base leading-snug">{tr.learnPathSoonTitle}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-relaxed text-muted-foreground">{tr.learnPathSoonBody}</p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
