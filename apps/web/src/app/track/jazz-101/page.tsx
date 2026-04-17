'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Jazz101Path } from '@/components/jazz101-path';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';

export default function Jazz101Page() {
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
                <BreadcrumbPage>{tr.jazz101PageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-2 sm:p-6 sm:pt-2">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight">{tr.jazz101PageTitle}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{tr.jazz101PathSubtitle}</p>
          </div>

          <Jazz101Path
            lang={lang}
            currentLessonIndex={0}
            startHref="/practice"
            lockedLabel={tr.jazz101LessonLocked}
            startLabel={tr.learnGoFreePractice}
            firstLessonAriaLabel={tr.jazz101OpenLesson}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
