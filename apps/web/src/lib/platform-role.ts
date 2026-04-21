/** Platform role for admin UI (maps to `profiles.is_superadmin` / `is_tutor`). */
export type PlatformRole = 'student' | 'tutor' | 'superadmin';

export function profileToPlatformRole(row: {
  is_superadmin: boolean;
  is_tutor: boolean;
}): PlatformRole {
  if (row.is_superadmin) return 'superadmin';
  if (row.is_tutor) return 'tutor';
  return 'student';
}

export function platformRoleToFlags(role: PlatformRole): {
  is_superadmin: boolean;
  is_tutor: boolean;
} {
  switch (role) {
    case 'superadmin':
      return { is_superadmin: true, is_tutor: false };
    case 'tutor':
      return { is_superadmin: false, is_tutor: true };
    default:
      return { is_superadmin: false, is_tutor: false };
  }
}

export function isPlatformRole(v: unknown): v is PlatformRole {
  return v === 'student' || v === 'tutor' || v === 'superadmin';
}
