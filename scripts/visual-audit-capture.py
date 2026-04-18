"""
Visual audit screenshot capture.

Logs into the dev server with admin credentials, then captures:
  - Rider screens at 390x844 (iPhone 14 Pro)
  - Admin screens at 1440x900
Each in light + dark mode.

Output: docs/audit-screenshots/{rider,admin}/{light,dark}/<route>.png

Run via:
  python3 .claude/skills/webapp-testing/scripts/with_server.py \
    --server "npm run dev" --port 3000 --timeout 90 \
    -- python3 scripts/visual-audit-capture.py
"""

from __future__ import annotations

import os
import sys
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, Page, BrowserContext

BASE_URL = "http://localhost:3000"
EMAIL = "admin@draftr.app"
PASSWORD = "pwd123"

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_BASE = REPO_ROOT / "docs" / (os.environ.get("CAPTURE_OUT_DIR") or "audit-screenshots")

MOBILE_VIEWPORT = {"width": 390, "height": 844}
DESKTOP_VIEWPORT = {"width": 1440, "height": 900}

RIDER_ROUTES = [
    ("dashboard", "/"),
    ("rides", "/rides"),
    ("profile-self", "/profile"),
    ("profile-history", "/profile/history"),
    ("notifications", "/notifications"),
    ("settings", "/settings"),
]

ADMIN_ROUTES = [
    ("manage-dashboard", "/manage"),
    ("manage-rides", "/manage/rides"),
    ("manage-rides-new", "/manage/rides/new"),
    ("manage-members", "/manage/members"),
    ("manage-announcements", "/manage/announcements"),
    ("manage-settings", "/manage/settings"),
]

def safe_filename(name: str) -> str:
    return re.sub(r"[^a-z0-9_-]+", "-", name.lower()).strip("-")


def login(page: Page) -> None:
    """Sign in via the auth form. Idempotent — skips if already authenticated."""
    page.goto(f"{BASE_URL}/sign-in", wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle")

    # If we got redirected away from /sign-in we're already logged in.
    if "/sign-in" not in page.url:
        print(f"  already authenticated (landed on {page.url})")
        return

    page.fill("#email", EMAIL)
    page.fill("#password", PASSWORD)
    page.click('button[type="submit"]')
    # Wait for redirect away from /sign-in
    try:
        page.wait_for_url(lambda url: "/sign-in" not in url, timeout=15000)
    except Exception:
        # Capture the failure for debugging
        page.screenshot(path=str(OUT_BASE / "_login-failed.png"))
        body_text = page.text_content("body") or ""
        print(f"  LOGIN FAILED. Page text snippet: {body_text[:300]!r}")
        raise
    page.wait_for_load_state("networkidle")
    print(f"  signed in (now on {page.url})")


def set_color_mode(page: Page, mode: str) -> None:
    """Set color mode by writing localStorage and applying the .dark class.

    Draftr's ThemeProvider reads localStorage key 'draftr-theme' and applies
    '.dark' to <html>. We set both directly so the next navigation picks it up.
    """
    page.evaluate(
        """(mode) => {
            try { localStorage.setItem('draftr-theme', mode); } catch (e) {}
            const root = document.documentElement;
            if (mode === 'dark') root.classList.add('dark');
            else root.classList.remove('dark');
        }""",
        mode,
    )


def capture_route(page: Page, slug: str, route: str, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    target = f"{BASE_URL}{route}"
    try:
        page.goto(target, wait_until="domcontentloaded", timeout=20000)
    except Exception as e:
        print(f"  ! goto failed for {route}: {e}")
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except Exception:
        pass
    # Brief settle for animations / counter mounts
    page.wait_for_timeout(500)
    out_path = out_dir / f"{safe_filename(slug)}.png"
    try:
        page.screenshot(path=str(out_path), full_page=True)
        print(f"  captured {out_path.relative_to(REPO_ROOT)}")
    except Exception as e:
        print(f"  ! screenshot failed for {route}: {e}")


def first_ride_id(page: Page) -> str | None:
    """Pull the first ride id from /rides for ride-detail capture."""
    page.goto(f"{BASE_URL}/rides", wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle")
    ride_link = page.locator('a[href^="/rides/"]').first
    try:
        href = ride_link.get_attribute("href", timeout=4000)
    except Exception:
        return None
    if not href:
        return None
    m = re.match(r"^/rides/([\w-]+)$", href)
    return m.group(1) if m else None


def first_member_id(page: Page) -> str | None:
    """Pull the first member id from /manage/members for public profile capture."""
    page.goto(f"{BASE_URL}/manage/members", wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)
    link = page.locator('a[href^="/profile/"], tr[role="link"]').first
    try:
        href = link.get_attribute("href", timeout=2000)
        if href:
            m = re.match(r"^/profile/([\w-]+)", href)
            if m:
                return m.group(1)
    except Exception:
        pass
    return None


def run_capture_pass(
    context: BrowserContext,
    surface: str,
    routes: list[tuple[str, str]],
    viewport: dict,
    extra_routes: list[tuple[str, str]] | None = None,
) -> None:
    print(f"\n=== Surface: {surface} ===")
    page = context.new_page()
    page.set_viewport_size(viewport)
    login(page)

    # Discover dynamic ids once (they're the same across light/dark).
    ride_id = first_ride_id(page) if surface == "rider" else None
    member_id = first_member_id(page) if surface == "rider" else None

    full_routes = list(routes)
    # Insert ride detail right after rides list
    if ride_id:
        idx = next((i for i, (s, _) in enumerate(full_routes) if s == "rides"), -1)
        full_routes.insert(idx + 1, ("ride-detail", f"/rides/{ride_id}"))
    if member_id and surface == "rider":
        full_routes.append(("profile-public", f"/profile/{member_id}"))

    if extra_routes:
        full_routes.extend(extra_routes)

    # Capture sign-in only in light mode (no auth context for dark toggle on page).
    sign_in_dir = OUT_BASE / surface / "light"
    sign_in_dir.mkdir(parents=True, exist_ok=True)
    print("\n[light] capturing /sign-in (logged-out chrome)")
    page.context.clear_cookies()
    capture_route(page, "sign-in", "/sign-in", sign_in_dir)

    # Re-authenticate for the rest of the pass
    login(page)

    for mode in ("light", "dark"):
        out_dir = OUT_BASE / surface / mode
        print(f"\n[{mode}] {surface}")
        set_color_mode(page, mode)
        for slug, route in full_routes:
            capture_route(page, slug, route, out_dir)

    page.close()


def main() -> int:
    OUT_BASE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Rider pass — mobile viewport
        rider_ctx = browser.new_context(
            viewport=MOBILE_VIEWPORT,
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            user_agent=(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            ),
        )
        run_capture_pass(rider_ctx, "rider", RIDER_ROUTES, MOBILE_VIEWPORT)
        rider_ctx.close()

        # Admin pass — desktop viewport
        admin_ctx = browser.new_context(
            viewport=DESKTOP_VIEWPORT,
            device_scale_factor=1,
        )
        run_capture_pass(admin_ctx, "admin", ADMIN_ROUTES, DESKTOP_VIEWPORT)
        admin_ctx.close()

        browser.close()
    print("\nCapture complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
