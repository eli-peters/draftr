# Auth Flow & Member Onboarding

## Overview

Draftr uses **admin-gated registration**. Members don't self-register. An admin adds them by email after verifying their Ontario Cycling Association (OCA) membership.

## How it works (step by step)

### 1. Admin invites a member

- Admin goes to the Manage tab → Invite Member
- Enters the rider's email address
- Selects a role: `rider`, `ride_leader`, or `admin`
- System calls `supabase.auth.admin.inviteUserByEmail(email)`
- Supabase sends the rider an email with a magic link
- A `club_memberships` row is pre-created with status `pending`

### 2. Rider receives invite email

- Rider clicks the magic link in their email
- This redirects them to the app and creates their Supabase Auth account
- They land on the **Set Password** page (handled by Supabase Auth UI or a custom page)

### 3. Profile setup

- After setting their password, the rider is redirected to `/setup-profile`
- They fill in: full name, display name (optional), bio (optional), preferred pace
- On submit, a `users` row is created with `onboarding_completed = true`
- The `club_memberships` row is updated from `pending` → `active`
- They're redirected to the ride feed

### 4. Subsequent logins

- Rider goes to `/sign-in` → enters email + password
- If `onboarding_completed` is false, redirected to `/setup-profile`
- If complete, redirected to `/rides`

## Auth state checks

The root page (`/`) checks auth state and redirects:

- No session → `/sign-in`
- Session but no profile → `/setup-profile`
- Session + profile complete → `/rides`

## Roles

| Role          | Permissions                                                                     |
| ------------- | ------------------------------------------------------------------------------- |
| `rider`       | Browse rides, sign up, view profiles, manage own notifications                  |
| `ride_leader` | Everything riders can do + create/edit/cancel rides                             |
| `admin`       | Everything leaders can do + invite members, manage club settings, announcements |

Roles are stored in `club_memberships.role`. A user can have different roles in different clubs (future multi-club support).

## Environment requirements

The `inviteMember` action uses `supabase.auth.admin.inviteUserByEmail()`, which requires the **service role key** (not the anon key). This should be set as a server-side environment variable:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

This key should **never** be exposed to the client. It's only used in server actions.

## Future enhancements

- Google / Apple SSO (see BACKLOG.md for account linking considerations)
- Self-registration with admin approval workflow
- Bulk CSV import for initial member migration
- OCA / ccnbikes.com integration for automatic membership verification
