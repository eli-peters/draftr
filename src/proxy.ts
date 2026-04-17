import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import {
  resolveSubdomain,
  getRootDomain,
  getPortSuffix,
  APP_SUBDOMAIN,
  HEADER_SUBDOMAIN,
  HEADER_CLUB_SLUG,
} from '@/lib/subdomain';

/** Routes that are allowed on the root (marketing) domain without redirect. */
const MARKETING_ALLOWED_PREFIXES = [
  '/coming-soon',
  '/api/',
  '/sign-in',
  '/auth/',
  '/setup-profile',
];

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? 'localhost';
  const ctx = resolveSubdomain(host);
  const { pathname } = request.nextUrl;

  // ── LOCALHOST / IP ADDRESS — treat as app to preserve dev experience ──
  if (host.startsWith('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(host)) {
    return updateSession(request);
  }

  // ── ROOT DOMAIN (marketing) ──
  if (!ctx.subdomain) {
    // Rewrite / → /coming-soon so the landing page renders at the root URL
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/coming-soon';
      return NextResponse.rewrite(url);
    }

    // Allow marketing routes, API, and auth routes on root domain
    const isAllowed = MARKETING_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    if (isAllowed) {
      return NextResponse.next();
    }

    // Everything else redirects to the app subdomain
    const rootDomain = getRootDomain(request);
    const port = getPortSuffix(request);
    const protocol = request.nextUrl.protocol;
    const redirectUrl = new URL(
      `${protocol}//${APP_SUBDOMAIN}.${rootDomain}${port}${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(redirectUrl);
  }

  // ── APP or CLUB SUBDOMAIN — run auth session refresh ──
  const response = await updateSession(request);

  // Inject subdomain context as headers for server components
  response.headers.set(HEADER_SUBDOMAIN, ctx.subdomain);
  if (ctx.clubSlug) {
    response.headers.set(HEADER_CLUB_SLUG, ctx.clubSlug);
  }

  // Redirect marketing-only routes back to root domain
  if (pathname === '/coming-soon') {
    const rootDomain = getRootDomain(request);
    const port = getPortSuffix(request);
    const protocol = request.nextUrl.protocol;
    return NextResponse.redirect(new URL(`${protocol}//${rootDomain}${port}/`));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
