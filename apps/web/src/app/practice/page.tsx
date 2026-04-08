'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AppSidebar } from '@/components/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Music2, Layers, GitBranch, Shuffle, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function PracticePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const tr = t(lang);

  const modes = [
    { id: 'full-scale', title: tr.modeFullScale,  description: tr.modeFullScaleDesc,  icon: Music2 },
    { id: 'full-chord', title: tr.modeFullChord,  description: tr.modeFullChordDesc,  icon: Layers },
    { id: 'sequence',   title: tr.modeSequence,   description: tr.modeSequenceDesc,   icon: GitBranch },
    { id: '251',        title: tr.mode251,         description: tr.mode251Desc,         icon: Shuffle },
    { id: 'interval',   title: tr.modeInterval,   description: tr.modeIntervalDesc,   icon: ArrowUpDown },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setLoading(false);
    });
  }, [router]);

  if (loading) return null;

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
                <BreadcrumbPage>{tr.practiceTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-2 sm:p-6 sm:pt-2">
          <div>
            <h1 className="text-3xl">{tr.practiceTitle}</h1>
            <p className="text-muted-foreground">{tr.practiceSubtitle}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {modes.map((mode) => (
              <Card key={mode.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <mode.icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{mode.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-sm text-muted-foreground">{mode.description}</p>
                  <Link
                    href={`/practice/${mode.id}`}
                    className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
                  >
                    {tr.modeStart}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
