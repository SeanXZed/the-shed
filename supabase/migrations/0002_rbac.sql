-- 0002_rbac.sql
-- Purpose: add RBAC / tenant tables (schema-only phase).
--
-- Apply the files in this order:
--
-- 1) supabase/tables/020_studios.sql
-- 2) supabase/tables/021_studio_memberships.sql
-- 3) supabase/tables/022_tutor_student_links.sql
-- 4) supabase/tables/023_rbac_policies.sql
--
-- Notes:
-- - This defines the tenant boundary (studios) and roles (memberships).
-- - No app code is required to deploy these tables, but tutor/student features
--   should not ship until RLS is validated against real user flows.

-- Intentionally empty (ordering-only). See files above.

