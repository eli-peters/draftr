import { cookies } from 'next/headers';

const COOKIE_NAME = 'draftr-dev-role';

/**
 * Get the dev role override from cookies (development only).
 * Returns null if no override is set.
 */
export async function getDevRoleOverride(): Promise<string | null> {
  if (process.env.NODE_ENV !== 'development') return null;

  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Set or clear the dev role override cookie.
 */
export async function setDevRoleOverride(role: string | null) {
  const cookieStore = await cookies();

  if (role) {
    cookieStore.set(COOKIE_NAME, role, { path: '/', maxAge: 60 * 60 * 24 });
  } else {
    cookieStore.delete(COOKIE_NAME);
  }
}
