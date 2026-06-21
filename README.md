# SiteForce — Workforce, Attendance & Payroll

Rebuilt from the original HTML prototype into a real, responsive
**React + Vite + Tailwind** app wired to **Supabase** (Postgres + Auth + RLS).

Two surfaces in one app:

- **Employee mobile app** (`/`) — PIN login, clock in/out, 4-step check-in,
  attendance, leave, payslips, profile.
- **Web admin console** (`/admin`) — dashboard, attendance (board/table/map),
  projects, inventory, payroll wizard, payslips, leave approvals, employees,
  settings (geofence/pay rules/roles).

The surface is chosen by URL path and by the signed-in account's `is_admin` flag.

## Stack

- **React 18 + Vite 6** — fast SPA build
- **Tailwind CSS v4** — design tokens in `src/index.css`
- **@supabase/supabase-js** — data, auth, row-level security
- **@zxing/browser** — real camera QR scanning
- Browser **Geolocation** API — real GPS geofencing
- Browser **getUserMedia** — camera face capture (liveness simulated)

## Getting started

```bash
cd siteforce
npm install
npm run dev
```

Open the printed URL (default http://localhost:5173).

### Environment

`.env.local` is already filled in for the provisioned Supabase project
(`siteforce`). To point at a different project copy `.env.example`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

## Logins

- **Employee app** (`/`) — company email + 6-digit PIN.
- **Web admin console** (`/admin`) — administrator email + password.

Both use real Supabase `signInWithPassword` (for employees, the PIN *is* the
password), so row-level security applies to every query afterwards. Only
accounts with `profiles.is_admin = true` can enter the admin console.

> Demo account credentials are **not** committed to this public repo. Ask the
> project owner, or create your own users in Supabase Auth and add a matching
> row in `public.profiles`.

## How the "native" steps work on the web

The 4-step check-in uses real browser capabilities, with graceful fallbacks so
the flow always completes (e.g. in environments without a camera):

1. **QR** — live camera scan via ZXing. The decoded value is matched against
   `sites.qr_payload`. A **Simulate scan** button falls back to the employee's
   assigned site.
2. **GPS** — real `navigator.geolocation`; distance to the site is computed with
   the haversine formula and compared to `sites.radius_m` (the geofence).
3. **Face** — front camera preview via `getUserMedia`; liveness is simulated.
4. **Success** — writes a real `attendance` row (site, project, lat/lng,
   method, `clock_in`). Clocking out from Home sets `clock_out` + `hours`.

> Camera and geolocation require a **secure context** — they work on
> `localhost` and any `https://` deployment.

## Web admin console (`/admin`)

- **Dashboard** — present/late/absent/on-leave counts, 7-day attendance trend,
  next payroll run, pending leave approvals — all computed live.
- **Attendance** — Board (per-site), Table, and Map views of today's check-ins.
- **Projects / Project detail** — progress, members + today status, inventory.
- **Inventory** — stock levels, low/critical alerts.
- **Payroll** — 4-step wizard; **Approve & lock** writes a real `payroll_runs`
  row, then generates payslips.
- **Leave** — approval queue; Approve/Reject writes back to `leave_requests`
  (admin RLS), plus a team calendar.
- **Employees** — roster + detail panel.
- **Settings** — Geofence editor (saves `sites.radius_m`, the same value the
  mobile check-in enforces), Pay rules, Roles.

## Responsive behavior

- **Phones**: the mobile app fills the viewport; the admin sidebar collapses to
  a hamburger drawer and grids stack.
- **Tablet / desktop**: the mobile UI centers inside a phone-style device frame;
  the admin shows a fixed sidebar + content layout.

## Database

Created via Supabase migrations on project `siteforce`:

```
organizations · sites · profiles · attendance · leave_types · leave_balances ·
leave_requests · payslips · announcements                        (employee app)
projects · project_members · inventory_items · payroll_runs ·
roles · org_settings                                             (web admin)
```

Every table has **RLS enabled**. Employees read their org's shared data and
read/write their own attendance/leave/payslips. Admins (`is_admin = true`) can
manage org-wide data (approve leave, edit geofences, lock payroll). The
`public.current_org_id()` and `public.is_admin()` security-definer helpers back
the policies.

## Project structure

```
src/
  lib/        supabase client, api + adminApi queries, geo + format helpers
  context/    AuthContext (session + profile + sign-in)
  components/ PhoneFrame, StatusBar, BottomNav, Toast
  screens/    Employee app: Login, Home, CheckIn, Attendance, Leave,
              Requests, Payslips, PayslipDetail, Profile
  Shell.jsx   employee screen router + bottom nav
  admin/
    AdminLogin.jsx   email + password console login
    AdminShell.jsx   sidebar + topbar + routing + toast
    ui.jsx           Avatar, Pill, Card helpers
    screens/   Dashboard, Attendance, Projects, ProjectDetail, Inventory,
               Payroll, Payslip, Leave, Employees, Settings
  App.jsx     routes / (employee) vs /admin (console) by path + is_admin
```
