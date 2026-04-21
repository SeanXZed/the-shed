'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionDeduped } from '@/lib/supabase/get-session-deduped';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';
import { supabase } from '@/lib/supabase/client';

type LinkRow = {
  studio_id: string;
  student_user_id: string;
  status: string;
  label?: string;
};

export default function TutorStudentsPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const tr = t(lang);
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<LinkRow[]>([]);

  useEffect(() => {
    getSessionDeduped().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthed(true);
    });
  }, [router]);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: links } = await supabase
      .from('tutor_student_links')
      .select('studio_id, student_user_id, status')
      .eq('tutor_user_id', user.id)
      .order('status', { ascending: true });

    const ids = [...new Set((links ?? []).map((l) => l.student_user_id))];
    const { data: profs } = await supabase.from('profiles').select('user_id, full_name, nickname').in('user_id', ids);

    const label = (uid: string) => {
      const p = (profs ?? []).find((x) => x.user_id === uid);
      const n = p?.full_name || p?.nickname;
      return n ? `${n}` : uid.slice(0, 8) + '…';
    };

    setRows((links ?? []).map((l) => ({ ...l, label: label(l.student_user_id) })));
  }, []);

  useEffect(() => {
    if (!authed) return;
    startTransition(() => {
      void load();
    });
  }, [authed, load]);

  async function accept(row: LinkRow) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('tutor_student_links')
      .update({ status: 'accepted' })
      .eq('studio_id', row.studio_id)
      .eq('tutor_user_id', user.id)
      .eq('student_user_id', row.student_user_id);
    await load();
  }

  async function reject(row: LinkRow) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('tutor_student_links')
      .delete()
      .eq('studio_id', row.studio_id)
      .eq('tutor_user_id', user.id)
      .eq('student_user_id', row.student_user_id)
      .eq('status', 'pending');
    await load();
  }

  if (!authed) return null;

  const pending = rows.filter((r) => r.status === 'pending');
  const accepted = rows.filter((r) => r.status === 'accepted');

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
                <BreadcrumbPage>{tr.navTutorStudents}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-2 sm:p-6 sm:pt-2">
          <div>
            <h1 className="text-3xl">{tr.tutorStudentsTitle}</h1>
            <p className="text-muted-foreground">{tr.tutorStudentsSubtitle}</p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">{tr.tutorPending}</h2>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tr.tutorNoStudents}</p>
            ) : (
              <ul className="space-y-2">
                {pending.map((r) => (
                  <li key={`${r.studio_id}-${r.student_user_id}`} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
                    <span className="flex-1 text-sm">{r.label}</span>
                    <Button type="button" size="sm" onClick={() => void accept(r)}>
                      {tr.tutorAccept}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void reject(r)}>
                      {tr.tutorReject}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">{tr.tutorAccepted}</h2>
            {accepted.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tr.tutorNoStudents}</p>
            ) : (
              <ul className="space-y-1">
                {accepted.map((r) => (
                  <li key={`${r.studio_id}-${r.student_user_id}`} className="rounded-lg border p-3 text-sm">
                    {r.label}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
