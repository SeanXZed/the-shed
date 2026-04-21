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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { useProfile } from '@/hooks/use-profile';
import { t } from '@/lib/translations';
import { supabase } from '@/lib/supabase/client';
import { slugifyStudioName } from '@/lib/slugify';

type TutorReq = {
  id: string;
  studio_id: string;
  requester_user_id: string;
  status: string;
};

type StudentReq = {
  id: string;
  studio_id: string;
  requester_user_id: string;
  status: string;
};

type StudioRow = { id: string; name: string; slug: string };
type LabeledReq = { id: string; studio_id: string; requester_user_id: string; status: string; label?: string };

export default function StudioPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const tr = t(lang);
  const { profile, loading: profileLoading } = useProfile();
  const canCreateStudio = !!(profile?.is_superadmin || profile?.is_tutor);
  const [authed, setAuthed] = useState(false);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [ownerStudios, setOwnerStudios] = useState<StudioRow[]>([]);
  const [activeStudioId, setActiveStudioId] = useState<string>('');
  const [tutorReqs, setTutorReqs] = useState<LabeledReq[]>([]);
  const [studentReqs, setStudentReqs] = useState<LabeledReq[]>([]);
  const [joinSlug, setJoinSlug] = useState('');
  const [joinStudio, setJoinStudio] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [joinMatches, setJoinMatches] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [joinIsMember, setJoinIsMember] = useState(false);

  useEffect(() => {
    getSessionDeduped().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthed(true);
    });
  }, [router]);

  const loadStudios = useCallback(async (): Promise<StudioRow[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: memberships } = await supabase
      .from('studio_memberships')
      .select('studio_id, role, studios(id, name, slug)')
      .eq('user_id', user.id)
      .eq('role', 'owner');

    const studios: StudioRow[] =
      (memberships ?? [])
        .map((m) => {
          const raw = m.studios as { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
          const s = raw == null ? null : Array.isArray(raw) ? raw[0] : raw;
          return s ? { id: s.id, name: s.name, slug: s.slug } : null;
        })
        .filter(Boolean) as StudioRow[];

    setOwnerStudios(studios);
    setActiveStudioId((prev) => (prev && studios.some((s) => s.id === prev) ? prev : studios[0]?.id ?? ''));
    return studios;
  }, []);

  const loadRequests = useCallback(async (studioId: string) => {
    if (!studioId) {
      setTutorReqs([]);
      setStudentReqs([]);
      return;
    }

    const [{ data: trq }, { data: srq }] = await Promise.all([
      supabase
        .from('studio_tutor_join_requests')
        .select('id, studio_id, requester_user_id, status')
        .eq('studio_id', studioId)
        .eq('status', 'pending'),
      supabase
        .from('studio_student_join_requests')
        .select('id, studio_id, requester_user_id, status')
        .eq('studio_id', studioId)
        .eq('status', 'pending'),
    ]);

    const tutorIds = [...new Set((trq ?? []).map((r) => r.requester_user_id))];
    const studentIds = [...new Set((srq ?? []).map((r) => r.requester_user_id))];
    const allIds = [...new Set([...tutorIds, ...studentIds])];

    const { data: profs } =
      allIds.length === 0
        ? { data: [] as { user_id: string; full_name: string | null; nickname: string | null }[] }
        : await supabase.from('profiles').select('user_id, full_name, nickname').in('user_id', allIds);

    const label = (uid: string) => {
      const p = (profs ?? []).find((x) => x.user_id === uid);
      const n = p?.full_name || p?.nickname;
      return n ? `${n} (${uid.slice(0, 8)}…)` : uid.slice(0, 8) + '…';
    };

    setTutorReqs((trq ?? []).map((r) => ({ ...r, label: label(r.requester_user_id) })));
    setStudentReqs((srq ?? []).map((r) => ({ ...r, label: label(r.requester_user_id) })));
  }, []);

  useEffect(() => {
    if (!authed) return;
    startTransition(() => {
      void loadStudios();
    });
  }, [authed, loadStudios]);

  useEffect(() => {
    if (!authed) return;
    startTransition(() => {
      void loadRequests(activeStudioId);
    });
  }, [authed, activeStudioId, loadRequests]);

  async function createStudio(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const n = name.trim();
    if (!n) return;
    const slug = slugifyStudioName(n);
    const { error } = await supabase.from('studios').insert({
      name: n,
      slug,
      created_by_user_id: user.id,
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    setName('');
    setMsg(tr.studioCreated);
    const studios = await loadStudios();
    const created = studios.find((s) => s.slug === slug);
    if (created) setActiveStudioId(created.id);
  }

  async function deleteStudio(studioId: string) {
    setMsg(null);
    if (!confirm(tr.studioDeleteConfirm)) return;
    const { error } = await supabase.from('studios').delete().eq('id', studioId);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg(tr.studioDeleted);
    const studios = await loadStudios();
    if (studios.length === 0) {
      setTutorReqs([]);
      setStudentReqs([]);
      return;
    }
    // activeStudioId will be normalized by loadStudios(); refresh requests for the new active studio.
    await loadRequests((studios.some((x) => x.id === activeStudioId) ? activeStudioId : studios[0]!.id) ?? '');
  }

  async function acceptTutor(req: TutorReq) {
    const { error: uerr } = await supabase
      .from('studio_tutor_join_requests')
      .update({ status: 'accepted', resolved_at: new Date().toISOString() })
      .eq('id', req.id);
    if (uerr) {
      setMsg(uerr.message);
      return;
    }
    const { error: ierr } = await supabase.from('studio_memberships').insert({
      studio_id: req.studio_id,
      user_id: req.requester_user_id,
      role: 'tutor',
    });
    if (ierr) setMsg(ierr.message);
    await loadRequests(activeStudioId);
  }

  async function rejectTutor(req: TutorReq) {
    await supabase
      .from('studio_tutor_join_requests')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', req.id);
    await loadRequests(activeStudioId);
  }

  async function acceptStudent(req: StudentReq) {
    const { error: uerr } = await supabase
      .from('studio_student_join_requests')
      .update({ status: 'accepted', resolved_at: new Date().toISOString() })
      .eq('id', req.id);
    if (uerr) {
      setMsg(uerr.message);
      return;
    }
    const { error: ierr } = await supabase.from('studio_memberships').insert({
      studio_id: req.studio_id,
      user_id: req.requester_user_id,
      role: 'student',
    });
    if (ierr) setMsg(ierr.message);
    await loadRequests(activeStudioId);
  }

  async function rejectStudent(req: StudentReq) {
    await supabase
      .from('studio_student_join_requests')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', req.id);
    await loadRequests(activeStudioId);
  }

  async function lookupJoinStudio() {
    setMsg(null);
    const s = joinSlug.trim().toLowerCase();
    if (!s) return;
    const { data, error } = await supabase.rpc('get_studios_search', { p_query: s });
    if (error) {
      setMsg(error.message);
      setJoinStudio(null);
      setJoinMatches([]);
      setJoinIsMember(false);
      return;
    }
    const rows = (Array.isArray(data) ? data : data ? [data] : []) as { id: string; name: string; slug: string }[];
    if (rows.length === 0) {
      setMsg(tr.studioJoinNotFound);
      setJoinStudio(null);
      setJoinMatches([]);
      setJoinIsMember(false);
      return;
    }
    setJoinMatches(rows);
    const single = rows.length === 1 ? rows[0] ?? null : null;
    setJoinStudio(single);
    if (!single) {
      setJoinIsMember(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: mem } = await supabase
      .from('studio_memberships')
      .select('user_id')
      .eq('studio_id', single.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setJoinIsMember(!!mem);
  }

  async function selectJoinStudio(studioRow: { id: string; name: string; slug: string }) {
    setMsg(null);
    setJoinStudio(studioRow);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: mem } = await supabase
      .from('studio_memberships')
      .select('user_id')
      .eq('studio_id', studioRow.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setJoinIsMember(!!mem);
  }

  async function requestJoinAsTutor() {
    if (!joinStudio) {
      setMsg(tr.studioJoinLookupFirst);
      return;
    }
    setMsg(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('studio_tutor_join_requests').insert({
      studio_id: joinStudio.id,
      requester_user_id: user.id,
    });
    if (error) setMsg(error.message);
    else setMsg(tr.studioJoinRequestSent);
  }

  async function requestJoinAsStudent() {
    if (!joinStudio) {
      setMsg(tr.studioJoinLookupFirst);
      return;
    }
    setMsg(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('studio_student_join_requests').insert({
      studio_id: joinStudio.id,
      requester_user_id: user.id,
    });
    if (error) setMsg(error.message);
    else setMsg(tr.studioJoinRequestSent);
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
                <BreadcrumbPage>{tr.navStudio}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-2 sm:p-6 sm:pt-2">
          <div>
            <h1 className="text-3xl">{tr.studioTitle}</h1>
            <p className="text-muted-foreground">{tr.studioSubtitle}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {profileLoading ? (
              <div className="flex min-h-20 items-center rounded-xl border bg-card p-5 text-muted-foreground">
                …
              </div>
            ) : canCreateStudio ? (
              <form onSubmit={createStudio} className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
                <h2 className="text-base font-semibold">{tr.studioCreate}</h2>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr.studioName} required />
                <Button type="submit">{tr.studioCreate}</Button>
              </form>
            ) : (
              <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
                <h2 className="text-base font-semibold">{tr.studioCreate}</h2>
                <p className="text-sm text-muted-foreground">{tr.studioCreateNeedTutor}</p>
              </div>
            )}

            <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold">{tr.studioJoinSection}</h2>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={joinSlug}
                  onChange={(e) => setJoinSlug(e.target.value)}
                  placeholder={tr.studentStudioSlug}
                  className="min-w-48 flex-1"
                />
                <Button type="button" variant="secondary" onClick={() => void lookupJoinStudio()}>
                  {tr.studentLookupStudio}
                </Button>
              </div>
              {joinMatches.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="space-y-2">
                    {joinMatches.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => void selectJoinStudio(s)}
                        className={[
                          'w-full rounded-md border bg-background/30 p-2 text-left transition-colors',
                          joinStudio?.id === s.id ? 'border-primary ring-2 ring-primary/30' : 'hover:bg-background/50',
                        ].join(' ')}
                      >
                        <p className="font-medium">{s.name}</p>
                        <p className="text-muted-foreground">{s.slug}</p>
                      </button>
                    ))}
                  </div>

                  {joinStudio && (
                    <>
                      {joinIsMember ? (
                        <p className="mt-3 text-muted-foreground">{tr.studioJoinAlreadyMember}</p>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button type="button" size="sm" onClick={() => void requestJoinAsTutor()}>
                            {tr.studioRequestAsTutor}
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => void requestJoinAsStudent()}>
                            {tr.studioRequestAsStudent}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>
          </div>

          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

          {ownerStudios.length > 0 && (
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{tr.studioMyStudios}</h2>
              </div>

              <Tabs
                value={activeStudioId}
                onValueChange={(v) => setActiveStudioId(String(v))}
                className="flex flex-col gap-4"
              >
                <div className="mt-3 overflow-x-auto">
                  <TabsList className="w-max">
                    {ownerStudios.map((s) => (
                      <TabsTrigger
                        key={s.id}
                        value={s.id}
                        className="px-2.5"
                      >
                        {s.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {ownerStudios.map((s) => (
                  <TabsContent key={s.id} value={s.id} className="w-full">
                    <Card>
                      <CardHeader>
                        <CardTitle>{s.name}</CardTitle>
                        <CardDescription>{s.slug}</CardDescription>
                        <CardAction>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => void deleteStudio(s.id)}
                          >
                            {tr.studioDelete}
                          </Button>
                        </CardAction>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-6 lg:grid-cols-2">
                          <div className="space-y-3">
                            <h3 className="text-base font-semibold">{tr.studioTutorRequests}</h3>
                            {tutorReqs.length === 0 ? (
                              <p className="text-sm text-muted-foreground">{tr.studioNoRequests}</p>
                            ) : (
                              <ul className="space-y-2">
                                {tutorReqs.map((r) => (
                                  <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
                                    <span className="flex-1 text-sm">{r.label}</span>
                                    <Button type="button" size="sm" onClick={() => void acceptTutor(r)}>
                                      {tr.studioAccept}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => void rejectTutor(r)}
                                    >
                                      {tr.studioReject}
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-base font-semibold">{tr.studioStudentRequests}</h3>
                            {studentReqs.length === 0 ? (
                              <p className="text-sm text-muted-foreground">{tr.studioNoRequests}</p>
                            ) : (
                              <ul className="space-y-2">
                                {studentReqs.map((r) => (
                                  <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
                                    <span className="flex-1 text-sm">{r.label}</span>
                                    <Button type="button" size="sm" onClick={() => void acceptStudent(r)}>
                                      {tr.studioAccept}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => void rejectStudent(r)}
                                    >
                                      {tr.studioReject}
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
