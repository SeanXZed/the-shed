'use client';

import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { CircleCheck, Eye, Loader2, MessageSquare, Users } from 'lucide-react';

type StudioInfo = { id: string; name: string; slug: string };
type MembershipRow = { role: string; studio: StudioInfo };
type LabeledReq = {
  kind: 'tutor' | 'student';
  id: string;
  studio_id: string;
  requester_user_id: string;
  status: string;
  label?: string;
};
type StudioMemberRow = {
  user_id: string;
  role: 'tutor' | 'student';
  nickname: string;
  joined_at: string;
};

type PracticeSessionRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'completed' | 'abandoned';
  is_cram: boolean;
  items_completed: number;
  correct_count: number;
  game_title: string;
  game_slug: string;
};

function formatDay(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function roleLabel(role: string, tr: ReturnType<typeof t>): string {
  switch (role) {
    case 'owner':
      return tr.studioRoleOwner;
    case 'admin':
      return tr.studioRoleAdmin;
    case 'tutor':
      return tr.studioRoleTutor;
    case 'student':
      return tr.studioRoleStudent;
    default:
      return role;
  }
}

export default function StudioPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const tr = t(lang);
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useProfile();
  const canCreateStudio = !!(profile?.is_superadmin || profile?.is_tutor);
  const canRequestAsTutor = !!(profile?.is_superadmin || profile?.is_tutor);
  const canRequestAsStudent = !!(profile?.is_superadmin || !profile?.is_tutor);
  const [authed, setAuthed] = useState(false);
  const [studioAction, setStudioAction] = useState<'join' | 'create'>('join');
  const [studioQuery, setStudioQuery] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [activeStudioId, setActiveStudioId] = useState<string>('');
  const [pendingReqs, setPendingReqs] = useState<LabeledReq[]>([]);
  const [joinRequestsOpen, setJoinRequestsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [members, setMembers] = useState<StudioMemberRow[]>([]);
  const [memberFilter, setMemberFilter] = useState<'all' | 'tutor' | 'student'>('all');
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceTarget, setPracticeTarget] = useState<StudioMemberRow | null>(null);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSessionRow[]>([]);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [joinStudio, setJoinStudio] = useState<StudioInfo | null>(null);
  const [joinMatches, setJoinMatches] = useState<StudioInfo[]>([]);
  const [joinIsMember, setJoinIsMember] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRequestingTutor, setIsRequestingTutor] = useState(false);
  const [isRequestingStudent, setIsRequestingStudent] = useState(false);
  const [busyReqIds, setBusyReqIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const isDuplicatePendingJoinRequest = (err: unknown): boolean => {
    const e = err as { code?: string; message?: string; details?: string; hint?: string } | null;
    const msg = `${e?.message ?? ''} ${e?.details ?? ''} ${e?.hint ?? ''}`.toLowerCase();
    return (
      e?.code === '23505' ||
      msg.includes('duplicate key value') ||
      msg.includes('one_pending_idx') ||
      msg.includes('studio_student_join_requests_one_pending_idx') ||
      msg.includes('studio_tutor_join_requests_one_pending_idx')
    );
  };

  const activeMembership = useMemo(
    () => memberships.find((m) => m.studio.id === activeStudioId),
    [memberships, activeStudioId],
  );
  const activeIsOwner = activeMembership?.role === 'owner';

  useEffect(() => {
    getSessionDeduped().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthed(true);
    });
  }, [router]);

  const loadMemberships = useCallback(async (): Promise<MembershipRow[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: raw } = await supabase
      .from('studio_memberships')
      .select('role, studios(id, name, slug)')
      .eq('user_id', user.id);

    const rows: MembershipRow[] = (raw ?? [])
      .map((m) => {
        const st = m.studios as { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
        const s = st == null ? null : Array.isArray(st) ? st[0] : st;
        if (!s) return null;
        return { role: m.role, studio: s };
      })
      .filter(Boolean) as MembershipRow[];

    rows.sort((a, b) => a.studio.name.localeCompare(b.studio.name));
    setMemberships(rows);
    setActiveStudioId((prev) => (prev && rows.some((r) => r.studio.id === prev) ? prev : rows[0]?.studio.id ?? ''));
    return rows;
  }, []);

  const loadRequests = useCallback(async (studioId: string) => {
    if (!studioId) {
      setPendingReqs([]);
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

    const merged: LabeledReq[] = [
      ...(trq ?? []).map((r) => ({
        kind: 'tutor' as const,
        ...r,
        label: label(r.requester_user_id),
      })),
      ...(srq ?? []).map((r) => ({
        kind: 'student' as const,
        ...r,
        label: label(r.requester_user_id),
      })),
    ];
    setPendingReqs(merged);
  }, []);

  const loadMembers = useCallback(
    async (studioId: string) => {
      if (!studioId) {
        setMembers([]);
        return;
      }
      const { data: ms } = await supabase
        .from('studio_memberships')
        .select('user_id, role, created_at')
        .eq('studio_id', studioId)
        .in('role', ['tutor', 'student']);

      const ids = [...new Set((ms ?? []).map((m) => m.user_id))];
      const { data: profs } =
        ids.length === 0
          ? { data: [] as { user_id: string; nickname: string | null; full_name: string | null }[] }
          : await supabase.from('profiles').select('user_id, nickname, full_name').in('user_id', ids);

      const nicknameFor = (uid: string) => {
        const p = (profs ?? []).find((x) => x.user_id === uid);
        return p?.nickname || p?.full_name || uid.slice(0, 8) + '…';
      };

      const rows: StudioMemberRow[] = (ms ?? [])
        .filter((m) => m.role === 'tutor' || m.role === 'student')
        .map((m) => ({
          user_id: m.user_id,
          role: m.role,
          nickname: nicknameFor(m.user_id),
          joined_at: (m as { created_at: string }).created_at,
        }));

      rows.sort((a, b) => {
        if (a.role !== b.role) return a.role.localeCompare(b.role);
        return a.nickname.localeCompare(b.nickname);
      });

      setMembers(rows);
    },
    [],
  );

  const loadPracticeResults = useCallback(
    async (target: StudioMemberRow) => {
      setPracticeLoading(true);
      setPracticeSessions([]);
      try {
        const { data, error } = await supabase
          .from('practice_sessions')
          .select('id,started_at,ended_at,status,is_cram,items_completed,correct_count,games!inner(title,slug)')
          .eq('user_id', target.user_id)
          .order('started_at', { ascending: false })
          .limit(20);

        if (error) {
          setMsg(error.message);
          return;
        }

        const rows: PracticeSessionRow[] = (data ?? []).map((row) => {
          const game = (row as unknown as { games?: { title?: string; slug?: string } }).games ?? {};
          return {
            id: (row as { id: string }).id,
            started_at: (row as { started_at: string }).started_at,
            ended_at: (row as { ended_at: string | null }).ended_at,
            status: ((row as { status?: PracticeSessionRow['status'] }).status ?? 'completed'),
            is_cram: Boolean((row as { is_cram?: boolean }).is_cram),
            items_completed: Number((row as { items_completed?: number }).items_completed ?? 0),
            correct_count: Number((row as { correct_count?: number }).correct_count ?? 0),
            game_title: game.title ?? 'Game',
            game_slug: game.slug ?? 'unknown',
          };
        });

        setPracticeSessions(rows);
      } finally {
        setPracticeLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!authed) return;
    startTransition(() => {
      void loadMemberships();
    });
  }, [authed, loadMemberships]);

  useEffect(() => {
    if (!authed) return;
    startTransition(() => {
      void loadMembers(activeStudioId);
    });
  }, [authed, activeStudioId, loadMembers]);

  useEffect(() => {
    if (!authed || !activeIsOwner) return;
    startTransition(() => {
      void loadRequests(activeStudioId);
    });
  }, [authed, activeStudioId, activeIsOwner, loadRequests]);

  async function createStudio(studioName: string) {
    setMsg(null);
    setIsCreating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    try {
      if (!user) return;
      const n = studioName.trim();
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
      setMsg(tr.studioCreated);
      const rows = await loadMemberships();
      const created = rows.find((r) => r.studio.slug === slug);
      if (created) setActiveStudioId(created.studio.id);
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteStudio(studioId: string) {
    setMsg(null);
    setIsDeleting(true);
    const { error } = await supabase.from('studios').delete().eq('id', studioId);
    if (error) {
      setMsg(error.message);
      setIsDeleting(false);
      return;
    }
    setMsg(tr.studioDeleted);
    const rows = await loadMemberships();
    if (rows.length === 0) {
      setPendingReqs([]);
    } else {
      const next = rows.some((r) => r.studio.id === activeStudioId) ? activeStudioId : rows[0]!.studio.id;
      if (rows.find((r) => r.studio.id === next)?.role === 'owner') {
        await loadRequests(next);
      }
    }
    setIsDeleting(false);
  }

  async function acceptRequest(req: LabeledReq) {
    setBusyReqIds((prev) => new Set(prev).add(req.id));
    if (req.kind === 'tutor') {
      const { error: uerr } = await supabase
        .from('studio_tutor_join_requests')
        .update({ status: 'accepted', resolved_at: new Date().toISOString() })
        .eq('id', req.id);
      if (uerr) {
        setMsg(uerr.message);
        setBusyReqIds((prev) => {
          const n = new Set(prev);
          n.delete(req.id);
          return n;
        });
        return;
      }
      const { error: ierr } = await supabase.from('studio_memberships').insert({
        studio_id: req.studio_id,
        user_id: req.requester_user_id,
        role: 'tutor',
      });
      if (ierr) setMsg(ierr.message);
    } else {
      const { error: uerr } = await supabase
        .from('studio_student_join_requests')
        .update({ status: 'accepted', resolved_at: new Date().toISOString() })
        .eq('id', req.id);
      if (uerr) {
        setMsg(uerr.message);
        setBusyReqIds((prev) => {
          const n = new Set(prev);
          n.delete(req.id);
          return n;
        });
        return;
      }
      const { error: ierr } = await supabase.from('studio_memberships').insert({
        studio_id: req.studio_id,
        user_id: req.requester_user_id,
        role: 'student',
      });
      if (ierr) setMsg(ierr.message);
    }
    await loadRequests(activeStudioId);
    await loadMembers(activeStudioId);
    setBusyReqIds((prev) => {
      const n = new Set(prev);
      n.delete(req.id);
      return n;
    });
  }

  async function rejectRequest(req: LabeledReq) {
    setBusyReqIds((prev) => new Set(prev).add(req.id));
    if (req.kind === 'tutor') {
      await supabase
        .from('studio_tutor_join_requests')
        .update({ status: 'rejected', resolved_at: new Date().toISOString() })
        .eq('id', req.id);
    } else {
      await supabase
        .from('studio_student_join_requests')
        .update({ status: 'rejected', resolved_at: new Date().toISOString() })
        .eq('id', req.id);
    }
    await loadRequests(activeStudioId);
    setBusyReqIds((prev) => {
      const n = new Set(prev);
      n.delete(req.id);
      return n;
    });
  }

  async function lookupJoinStudio(query: string) {
    setMsg(null);
    setIsLookingUp(true);
    const s = query.trim().toLowerCase();
    try {
      if (!s) return;
      const { data, error } = await supabase.rpc('get_studios_search', { p_query: s });
      if (error) {
        setMsg(error.message);
        setJoinStudio(null);
        setJoinMatches([]);
        setJoinIsMember(false);
        return;
      }
      const rows = (Array.isArray(data) ? data : data ? [data] : []) as StudioInfo[];
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
    } finally {
      setIsLookingUp(false);
    }
  }

  async function selectJoinStudio(studioRow: StudioInfo) {
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
    setIsRequestingTutor(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    try {
      if (!user) return;
      const { error } = await supabase.from('studio_tutor_join_requests').insert({
        studio_id: joinStudio.id,
        requester_user_id: user.id,
      });
      if (error) {
        if (isDuplicatePendingJoinRequest(error)) {
          toast(tr.studioJoinRequestAlreadyPending);
          return;
        }
        setMsg(error.message);
      }
      else {
        toast(tr.studioJoinRequestToast);
      }
    } finally {
      setIsRequestingTutor(false);
    }
  }

  async function requestJoinAsStudent() {
    if (!joinStudio) {
      setMsg(tr.studioJoinLookupFirst);
      return;
    }
    setMsg(null);
    setIsRequestingStudent(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    try {
      if (!user) return;
      const { error } = await supabase.from('studio_student_join_requests').insert({
        studio_id: joinStudio.id,
        requester_user_id: user.id,
      });
      if (error) {
        if (isDuplicatePendingJoinRequest(error)) {
          toast(tr.studioJoinRequestAlreadyPending);
          return;
        }
        setMsg(error.message);
      }
      else {
        toast(tr.studioJoinRequestToast);
      }
    } finally {
      setIsRequestingStudent(false);
    }
  }

  const joinResults =
    joinMatches.length === 0 ? null : (
      <div className="rounded-lg border bg-muted/30 p-3 text-sm">
        <div className="space-y-2">
          {joinMatches.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => void selectJoinStudio(s)}
              className={[
                'w-full rounded-md bg-background/30 p-2 text-left transition-colors',
                joinStudio?.id === s.id ? 'bg-background/60 ring-2 ring-primary/30' : 'hover:bg-background/50',
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
                {canRequestAsTutor && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void requestJoinAsTutor()}
                    disabled={isRequestingTutor || isRequestingStudent}
                  >
                    {isRequestingTutor ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        <span>{tr.studioRequestAsTutor}</span>
                      </span>
                    ) : (
                      tr.studioRequestAsTutor
                    )}
                  </Button>
                )}
                {canRequestAsStudent && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void requestJoinAsStudent()}
                    disabled={isRequestingTutor || isRequestingStudent}
                  >
                    {isRequestingStudent ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        <span>{tr.studioRequestAsStudent}</span>
                      </span>
                    ) : (
                      tr.studioRequestAsStudent
                    )}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );

  const visibleMembers = useMemo(() => {
    if (memberFilter === 'all') return members;
    return members.filter((m) => m.role === memberFilter);
  }, [members, memberFilter]);

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

          {profileLoading ? (
            <div className="flex min-h-20 items-center rounded-xl border bg-card p-5 text-muted-foreground">…</div>
          ) : canCreateStudio ? (
            <section className="flex flex-col gap-6 rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{tr.studioCreateOrJoinTitle}</h2>
                  <div className="flex rounded-lg border p-1" role="group" aria-label={tr.studioCreateOrJoinTitle}>
                    <button
                      type="button"
                      onClick={() => {
                        setStudioAction('create');
                        setStudioQuery('');
                        setMsg(null);
                        setJoinMatches([]);
                        setJoinStudio(null);
                        setJoinIsMember(false);
                      }}
                      className={[
                        'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                        studioAction === 'create'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      ].join(' ')}
                    >
                      {tr.studioCreate}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudioAction('join');
                        setStudioQuery('');
                        setMsg(null);
                        setJoinMatches([]);
                        setJoinStudio(null);
                        setJoinIsMember(false);
                      }}
                      className={[
                        'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                        studioAction === 'join'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      ].join(' ')}
                    >
                      {tr.studioJoinSection}
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (studioAction === 'create') void createStudio(studioQuery);
                    else void lookupJoinStudio(studioQuery);
                  }}
                  className="flex flex-col gap-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <Input
                        value={studioQuery}
                        onChange={(e) => setStudioQuery(e.target.value)}
                        placeholder={studioAction === 'create' ? tr.studioName : tr.studentStudioSlug}
                        required
                      />
                    </div>
                    <Button type="submit" className="shrink-0 sm:w-auto" disabled={studioAction === 'create' ? isCreating : isLookingUp}>
                      {studioAction === 'create'
                        ? isCreating
                          ? '…'
                          : tr.studioCreate
                        : isLookingUp
                          ? '…'
                          : tr.studentLookupStudio}
                    </Button>
                  </div>
                </form>
              </div>

              {studioAction === 'join' && joinResults}
            </section>
          ) : (
            <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
                <h2 className="text-lg font-semibold">{tr.studioJoinStudentTitle}</h2>
              <p className="text-sm text-muted-foreground">{tr.studioJoinHelp}</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void lookupJoinStudio(studioQuery);
                }}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={studioQuery}
                    onChange={(e) => setStudioQuery(e.target.value)}
                    placeholder={tr.studentStudioSlug}
                    className="min-w-48 flex-1"
                    required
                  />
                  <Button type="submit" variant="secondary" disabled={isLookingUp}>
                    {isLookingUp ? '…' : tr.studentLookupStudio}
                  </Button>
                </div>
              </form>
              {joinResults}
            </section>
          )}

          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

          {memberships.length > 0 && (
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{tr.studioMyStudios}</h2>

              <Tabs
                value={activeStudioId}
                onValueChange={(v) => setActiveStudioId(String(v))}
                className="mt-3 flex flex-col gap-4"
              >
                <div className="overflow-x-auto">
                  <TabsList className="w-max rounded-lg border bg-muted/30 p-1">
                    {memberships.map((m) => (
                      <TabsTrigger
                        key={m.studio.id}
                        value={m.studio.id}
                        className="h-auto border-0 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-none hover:text-foreground data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none after:hidden"
                      >
                        <span className="max-w-36 truncate sm:max-w-56">{m.studio.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {memberships.map((m) => (
                  <TabsContent key={m.studio.id} value={m.studio.id} className="w-full">
                    {m.role === 'owner' ? (
                      <Card>
                        <CardHeader>
                          <CardTitle>{m.studio.name}</CardTitle>
                          <CardDescription>
                            {m.studio.slug} · {tr.studioYourRole}: {roleLabel(m.role, tr)}
                          </CardDescription>
                          <CardAction>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Dialog
                                open={joinRequestsOpen && m.studio.id === activeStudioId}
                                onOpenChange={(open) => {
                                  setJoinRequestsOpen(open);
                                  if (open && m.studio.id === activeStudioId) void loadRequests(activeStudioId);
                                }}
                              >
                                <DialogTrigger
                                  render={
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                    />
                                  }
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <span>{tr.studioViewJoinRequests}</span>
                                    {m.studio.id === activeStudioId ? (
                                      pendingReqs.length === 0 ? (
                                        <CircleCheck className="size-4 text-muted-foreground" aria-label={tr.studioNoRequests} />
                                      ) : (
                                        <span
                                          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground"
                                          aria-label={tr.studioPendingRequestsAll}
                                        >
                                          {pendingReqs.length}
                                        </span>
                                      )
                                    ) : (
                                      <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                                    )}
                                  </span>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>{tr.studioPendingRequestsAll}</DialogTitle>
                                  </DialogHeader>

                                  <div className="mt-4 space-y-3">
                                    {pendingReqs.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">{tr.studioNoRequests}</p>
                                    ) : (
                                      <ul className="max-h-[60vh] space-y-2 overflow-auto pr-1">
                                        {pendingReqs.map((r) => (
                                          <li
                                            key={`${r.kind}-${r.id}`}
                                            className="flex flex-wrap items-center gap-2 rounded-lg border p-3"
                                          >
                                            <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-medium">
                                              {r.kind === 'tutor' ? tr.studioRoleTutor : tr.studioRoleStudent}
                                            </span>
                                            <span className="min-w-0 flex-1 text-sm">{r.label}</span>
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() => void acceptRequest(r)}
                                              disabled={busyReqIds.has(r.id)}
                                            >
                                              {busyReqIds.has(r.id) ? '…' : tr.studioAccept}
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              onClick={() => void rejectRequest(r)}
                                              disabled={busyReqIds.has(r.id)}
                                            >
                                              {busyReqIds.has(r.id) ? '…' : tr.studioReject}
                                            </Button>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setDeleteTarget({ id: m.studio.id, name: m.studio.name });
                                  setDeleteConfirmOpen(true);
                                }}
                                disabled={isDeleting}
                              >
                                {tr.studioDelete}
                              </Button>
                            </div>
                          </CardAction>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-base font-semibold">{tr.studioMembersTitle}</h3>
                            <div className="flex rounded-lg border bg-muted/30 p-1" role="group" aria-label={tr.studioMembersTitle}>
                              <button
                                type="button"
                                onClick={() => setMemberFilter('all')}
                                className={[
                                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                  memberFilter === 'all'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                                ].join(' ')}
                              >
                                {tr.studioFilterAll}
                              </button>
                              <button
                                type="button"
                                onClick={() => setMemberFilter('tutor')}
                                className={[
                                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                  memberFilter === 'tutor'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                                ].join(' ')}
                              >
                                {tr.studioFilterTutors}
                              </button>
                              <button
                                type="button"
                                onClick={() => setMemberFilter('student')}
                                className={[
                                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                  memberFilter === 'student'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                                ].join(' ')}
                              >
                                {tr.studioFilterStudents}
                              </button>
                            </div>
                          </div>

                          <div className="relative mt-3 overflow-x-auto rounded-lg border">
                            {visibleMembers.length === 0 ? (
                              <p className="p-4 text-sm text-muted-foreground">{tr.studioMembersNone}</p>
                            ) : (
                              <table className="w-full text-sm">
                                <thead className="bg-muted/30 text-muted-foreground">
                                  <tr>
                                    <th className="px-3 py-2 text-center font-medium">{tr.studioMembersNickname}</th>
                                    <th className="px-3 py-2 text-center font-medium">{tr.studioMembersRole}</th>
                                    <th className="px-3 py-2 text-center font-medium">{tr.studioMembersJoinedSince}</th>
                                    <th className="sticky right-0 border-l px-3 py-2 text-center font-medium bg-muted/30">{tr.studioMembersOperation}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {visibleMembers.map((row) => (
                                    <tr key={`${row.role}-${row.user_id}`} className="border-t">
                                      <td className="px-3 py-2 text-center">{row.nickname}</td>
                                      <td className="px-3 py-2 text-center">
                                        <span className="inline-flex rounded bg-muted px-2 py-0.5 text-xs font-medium">
                                          {row.role === 'tutor' ? tr.studioRoleTutor : tr.studioRoleStudent}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-center text-muted-foreground">{formatDay(row.joined_at)}</td>
                                      <td className="sticky right-0 border-l px-3 py-2 bg-card">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => {
                                              setPracticeTarget(row);
                                              setPracticeOpen(true);
                                              void loadPracticeResults(row);
                                            }}
                                            aria-label={tr.studioViewPracticeResults}
                                          >
                                            <Eye className="size-4" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => {
                                              void navigator.clipboard?.writeText(row.user_id);
                                              toast(tr.studioDmCopied);
                                            }}
                                            aria-label={tr.studioSendDm}
                                          >
                                            <MessageSquare className="size-4" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>

                          {/* practice results dialog is rendered once at page level */}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>{m.studio.name}</CardTitle>
                          <CardDescription>
                            {m.studio.slug} · {tr.studioYourRole}: {roleLabel(m.role, tr)}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          )}

          <Dialog
            open={practiceOpen}
            onOpenChange={(open) => {
              setPracticeOpen(open);
              if (!open) {
                setPracticeTarget(null);
                setPracticeSessions([]);
                setPracticeLoading(false);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {practiceTarget
                    ? `${tr.studioPracticeResultsTitle}: ${practiceTarget.nickname}`
                    : tr.studioPracticeResultsTitle}
                </DialogTitle>
                <DialogDescription>{tr.studioPracticeResultsSubtitle}</DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                {practiceLoading ? (
                  <p className="text-sm text-muted-foreground">{tr.studioPracticeResultsLoading}</p>
                ) : practiceSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{tr.studioPracticeResultsEmpty}</p>
                ) : (
                  (() => {
                    const completed = practiceSessions.filter((s) => s.status === 'completed').length;
                    const totalItems = practiceSessions.reduce((sum, s) => sum + (s.items_completed || 0), 0);
                    const totalCorrect = practiceSessions.reduce((sum, s) => sum + (s.correct_count || 0), 0);
                    const accuracy = totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;
                    const lastPracticed = practiceSessions[0]?.started_at ? formatDay(practiceSessions[0].started_at) : '—';

                    const byGame = new Map<string, { title: string; items: number; correct: number; sessions: number }>();
                    for (const s of practiceSessions) {
                      const key = s.game_slug || s.game_title;
                      const cur = byGame.get(key) ?? { title: s.game_title, items: 0, correct: 0, sessions: 0 };
                      cur.items += s.items_completed || 0;
                      cur.correct += s.correct_count || 0;
                      cur.sessions += 1;
                      byGame.set(key, cur);
                    }
                    const topGames = [...byGame.entries()]
                      .map(([slug, v]) => ({ slug, ...v }))
                      .sort((a, b) => b.sessions - a.sessions)
                      .slice(0, 4);

                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/20 p-3 sm:grid-cols-4">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">{tr.studioPracticeStatsSessions}</div>
                            <div className="mt-0.5 text-sm font-medium">{practiceSessions.length}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">{tr.studioPracticeStatsCompleted}</div>
                            <div className="mt-0.5 text-sm font-medium">{completed}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">{tr.studioPracticeStatsAccuracy}</div>
                            <div className="mt-0.5 text-sm font-medium">{accuracy}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">{tr.studioPracticeStatsLastPracticed}</div>
                            <div className="mt-0.5 text-sm font-medium">{lastPracticed}</div>
                          </div>
                        </div>

                        {topGames.length > 0 && (
                          <div className="rounded-lg border p-3">
                            <div className="text-xs font-medium text-muted-foreground">{tr.studioPracticeStatsByGame}</div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              {topGames.map((g) => {
                                const acc = g.items > 0 ? Math.round((g.correct / g.items) * 100) : 0;
                                return (
                                  <div key={g.slug} className="rounded-md bg-muted/20 px-3 py-2">
                                    <div className="flex items-baseline justify-between gap-2">
                                      <div className="min-w-0 truncate text-sm font-medium">{g.title}</div>
                                      <div className="shrink-0 text-xs text-muted-foreground">{g.sessions}×</div>
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      {g.correct}/{g.items} ({acc}%)
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="max-h-[45vh] overflow-auto rounded-lg border">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/30 text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 text-center font-medium">{tr.studioPracticeSessionStarted}</th>
                                <th className="px-3 py-2 text-center font-medium">{tr.studioPracticeSessionGame}</th>
                                <th className="px-3 py-2 text-center font-medium">{tr.studioPracticeSessionResult}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {practiceSessions.map((s) => {
                                const acc = s.items_completed > 0 ? Math.round((s.correct_count / s.items_completed) * 100) : 0;
                                return (
                                  <tr key={s.id} className="border-t">
                                    <td className="px-3 py-2 text-center">{formatDay(s.started_at)}</td>
                                    <td className="px-3 py-2 text-center">
                                      <div className="inline-flex max-w-full flex-col items-center">
                                        <span className="max-w-full truncate font-medium">{s.game_title}</span>
                                        <span className="max-w-full truncate text-xs text-muted-foreground">{s.game_slug}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-center text-muted-foreground">
                                      {s.correct_count}/{s.items_completed} ({acc}%)
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={deleteConfirmOpen}
            onOpenChange={(open) => {
              setDeleteConfirmOpen(open);
              if (!open) setDeleteTarget(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{tr.studioDeleteConfirmButton}</DialogTitle>
                <DialogDescription>
                  {deleteTarget ? (
                    <>
                      <span className="font-medium text-foreground">{deleteTarget.name}</span>
                      {' — '}
                      {tr.studioDeleteConfirm}
                    </>
                  ) : (
                    tr.studioDeleteConfirm
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  {tr.studioDeleteCancel}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (!deleteTarget) return;
                    void deleteStudio(deleteTarget.id);
                    setDeleteConfirmOpen(false);
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? '…' : tr.studioDeleteConfirmButton}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
