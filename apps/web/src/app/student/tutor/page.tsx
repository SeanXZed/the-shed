'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';
import { supabase } from '@/lib/supabase/client';

type StudioRow = { id: string; name: string; slug: string };

export default function StudentTutorPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const tr = t(lang);
  const [authed, setAuthed] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [studio, setStudio] = useState<StudioRow | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [tutors, setTutors] = useState<{ user_id: string; label: string }[]>([]);
  const [membership, setMembership] = useState<'none' | 'student' | 'other'>('none');

  useEffect(() => {
    getSessionDeduped().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthed(true);
    });
  }, [router]);

  const refreshTutors = useCallback(async (studioId: string) => {
    const { data: ms } = await supabase
      .from('studio_memberships')
      .select('user_id')
      .eq('studio_id', studioId)
      .eq('role', 'tutor');

    const ids = (ms ?? []).map((m) => m.user_id);
    if (ids.length === 0) {
      setTutors([]);
      return;
    }
    const { data: profs } = await supabase.from('profiles').select('user_id, full_name, nickname').in('user_id', ids);
    setTutors(
      ids.map((uid) => {
        const p = (profs ?? []).find((x) => x.user_id === uid);
        const n = p?.full_name || p?.nickname;
        return { user_id: uid, label: n ?? uid.slice(0, 8) + '…' };
      }),
    );
  }, []);

  async function lookupStudio() {
    setMsg(null);
    const s = slugInput.trim().toLowerCase();
    if (!s) return;
    const { data, error } = await supabase.rpc('get_studio_by_slug', { p_slug: s });
    if (error) {
      setMsg(error.message);
      setStudio(null);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      setMsg('Not found');
      setStudio(null);
      return;
    }
    const studioRow = row as StudioRow;
    setStudio(studioRow);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: mem } = await supabase
      .from('studio_memberships')
      .select('role')
      .eq('studio_id', studioRow.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!mem) setMembership('none');
    else if (mem.role === 'student') setMembership('student');
    else setMembership('other');

    if (mem?.role === 'student') await refreshTutors(studioRow.id);
  }

  async function requestJoinStudio() {
    if (!studio) return;
    setMsg(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('studio_student_join_requests').insert({
      studio_id: studio.id,
      requester_user_id: user.id,
    });
    if (error) setMsg(error.message);
    else setMsg(tr.studentRequestSent);
  }

  async function requestTutor(tutorUserId: string) {
    if (!studio) return;
    setMsg(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('tutor_student_links').insert({
      studio_id: studio.id,
      tutor_user_id: tutorUserId,
      student_user_id: user.id,
      status: 'pending',
    });
    if (error) setMsg(error.message);
    else setMsg(tr.studentRequestSent);
  }

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
                <BreadcrumbPage>{tr.navStudentTutor}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-2 sm:p-6 sm:pt-2">
          <div>
            <h1 className="text-3xl">{tr.studentTutorTitle}</h1>
            <p className="text-muted-foreground">{tr.studentTutorSubtitle}</p>
          </div>

          <div className="flex max-w-xl flex-col gap-2">
            <label className="text-sm font-medium">{tr.studentStudioSlug}</label>
            <div className="flex flex-wrap gap-2">
              <Input value={slugInput} onChange={(e) => setSlugInput(e.target.value)} placeholder="my-studio-a3f2" />
              <Button type="button" onClick={() => void lookupStudio()}>
                {tr.studentLookupStudio}
              </Button>
            </div>
          </div>

          {studio && (
            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
              <p className="font-medium">{studio.name}</p>
              <p className="text-sm text-muted-foreground">{studio.slug}</p>
              {membership === 'none' && (
                <Button type="button" onClick={() => void requestJoinStudio()}>
                  {tr.studentRequestJoin}
                </Button>
              )}
              {membership === 'other' && (
                <p className="text-sm text-muted-foreground">You are not a student in this studio.</p>
              )}
              {membership === 'student' && (
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium">{tr.studentPickTutor}</p>
                  {tutors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tutors yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {tutors.map((tu) => (
                        <li key={tu.user_id} className="flex items-center gap-2">
                          <span className="flex-1 text-sm">{tu.label}</span>
                          <Button type="button" size="sm" onClick={() => void requestTutor(tu.user_id)}>
                            {tr.studentRequestTutor}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
