"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { AppSidebar } from "@/components/app-sidebar"
import { buttonVariants } from "@/components/ui/button"
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
import { Music2 } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { t } from "@/lib/translations"
import { cn } from "@/lib/utils"

export default function TrackPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
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
              <Link
                href="/practice"
                className={cn(buttonVariants({ variant: "default", size: "lg" }), "mt-2 w-full justify-center sm:w-fit")}
              >
                <Music2 className="mr-2 size-4" />
                {tr.learnGoFreePractice}
              </Link>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
