/**
 * Returns the cookie domain for cross-subdomain auth.
 *
 * In production (when NEXT_PUBLIC_APP_DOMAIN is set), returns '.draftr.app'
 * so cookies are shared across go.draftr.app, dhf.draftr.app, etc.
 *
 * In dev, returns undefined so cookies work on localhost normally.
 */
export function getCookieDomain(): string | undefined {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (!appDomain) return undefined;
  return `.${appDomain}`;
}
