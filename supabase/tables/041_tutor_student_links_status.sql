-- tutor_student_links: add lifecycle status for student-initiated requests.

alter table public.tutor_student_links
  add column if not exists status text not null default 'accepted'
    constraint tutor_student_links_status_valid check (status in ('pending', 'accepted', 'rejected'));

comment on column public.tutor_student_links.status is
  'pending = student requested; accepted/rejected = tutor resolved. Default accepted for tutor-created rows.';
