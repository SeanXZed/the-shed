'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CHROMATIC } from '@the-shed/shared';
import { getSessionDeduped } from '@/lib/supabase/get-session-deduped';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';

export default function Jazz101Lesson1Page() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const { lang } = useLanguage();
  const tr = t(lang);

  useEffect(() => {
    getSessionDeduped().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthed(true);
    });
  }, [router]);

  if (!authed) return null;

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
                <BreadcrumbLink href="/track">{tr.learnTitle}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/track/jazz-101">{tr.jazz101PageTitle}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{tr.jazz101Lesson1Title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-2 sm:p-6 sm:pt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tr.jazz101Lesson1Title}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">{tr.jazz101Lesson1Placeholder}</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {CHROMATIC.map((note) => (
                  <div
                    key={note}
                    className="flex aspect-square items-center justify-center rounded-lg border bg-muted/40 font-mono text-lg font-semibold tabular-nums"
                  >
                    {note}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
