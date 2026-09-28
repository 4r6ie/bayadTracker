# BayadTracker

Amotan (class contribution) monitoring for one school section, used by the
class mayor and the secretary on their own phones.

- Keep a roster of the students and a list of amotan (e.g. "Class T-shirt,
  ₱150 each, due Oct 1").
- Record payments per student, including partial payments ("hulog").
- See at a glance who has paid and who has not, per student and per amotan.
- Works fully offline. When online, the two phones sync through Supabase.

Built with Expo (SDK 57), React Native, TypeScript, Expo Router, `expo-sqlite`
and `@supabase/supabase-js`. Everything runs in Expo Go; no development build
is needed.

## Screens

Tabs:

- **Students** (`src/app/(tabs)/index.tsx`) — every student with what they
  still owe ("Owes ₱250.00 · 1 of 3 paid" or "All paid"), a search field, and
  "+" to add one. Tap a student for their checklist; long-press to delete.
- **Amotan** (`src/app/(tabs)/amotan.tsx`) — every amotan with its target,
  deadline and class progress ("12 of 40 paid · ₱1,800.00 collected"). Tap for
  who paid and who has not; long-press to delete.
- **Account** (`src/app/(tabs)/account.tsx`) — who is signed in, sync status,
  changes waiting to upload, Sync Now and Sign Out.

Pushed on top:

- **Student details** (`src/app/student/[id].tsx`) — the student's checklist:
  one row per amotan with a checkbox (empty / half / check), "₱50.00 / ₱150.00"
  and a progress bar. Tapping the checkbox records the remaining balance (after
  a confirmation); tapping the row opens the payment history.
- **Amotan details** (`src/app/amotan/[id].tsx`) — the roster for one amotan
  with filters All / Not yet / Paid, collected vs expected, and **Share**,
  which sends the "not paid yet" list to the class group chat.
- **Payments** (`src/app/record-payment.tsx`) — one student's payments toward
  one amotan: what is left, a form for the next installment (defaults to the
  remaining balance, can be lowered for a partial payment, cannot exceed what
  is left or be dated in the future) and the history with Delete.
- **Add / Edit Student**, **Add / Edit Amotan** — forms; the edit screens also
  have Delete in the header.
- **Login** (`src/app/login.tsx`) — shown only when Supabase is configured and
  nobody has signed in on this phone yet.

Every list pulls down to refresh, which also syncs.

## Data model

Local SQLite (`src/database/database.ts`, schema version 2):

| Table | Columns |
| --- | --- |
| `students` | `id`, `name`, `created_at`, `updated_at`, `deleted_at`, `synced` |
| `amotan` | `id`, `title`, `amount_cents`, `due_date`, `created_at`, `updated_at`, `deleted_at`, `synced` |
| `amotan_payments` | `id`, `student_id`, `amotan_id`, `amount_cents`, `paid_date`, `created_at`, `updated_at`, `deleted_at`, `synced` |
| `sync_state` | `table_name`, `last_pulled_at` |

- **Ledger, not a flag.** Each installment is its own row. How much a student
  paid is the `SUM` of their rows; the status (unpaid / partial / paid) is
  computed from it, never stored, so it cannot go out of sync.
- **Money is integer centavos** (`₱150.50` → `15050`), so sums and the
  "fully paid?" comparison never hit floating-point rounding.
- **UUID ids** so two phones can create rows offline without colliding.
- **Soft deletes** (`deleted_at`) so a delete can reach the other phone.
  Deleting a student or an amotan also soft-deletes its payments.
- **`synced`**: `0` = changed on this phone and not uploaded yet.

Migrations run on launch from `PRAGMA user_version`; a new schema version is a
new `if (version < N)` block, never an edit to an old one.

All SQL lives in the repositories (`src/database/*Repository.ts`) and binds
every value with `?`. The "who has not paid" queries are `LEFT JOIN`s from
`students` (or `amotan`) with the payment filters in the `ON` clause, so
students with no payment rows still appear, with ₱0.

## Sync (offline-first)

`src/sync/syncEngine.ts` and `src/sync/syncManager.ts`.

- A sync runs on launch, when the phone comes back online, when the app
  returns to the foreground, two seconds after any local change, and every
  three minutes while open. Only one runs at a time.
- **Push**: upload every row with `synced = 0` (parents before children), then
  mark it synced only if it was not edited again meanwhile.
- **Pull**: download rows whose server-assigned `server_updated_at` is newer
  than the last pull (with a one-minute overlap), children fetched first and
  applied parents first so no payment arrives before its student. A pulled row
  never overwrites a local edit that has not been uploaded yet.
- **Conflicts**: the latest edit (`updated_at`) wins, enforced by a trigger on
  the server.
- Duplicate student names are blocked when adding, but two phones can still
  both add the same name while offline; delete one of the two if it happens.

Being signed in is remembered on the phone, separately from the Supabase
session, so an expired token never locks anyone out while offline. Only the
sync needs a valid session.

Without Supabase settings the app runs local-only: no login, no sync.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → New query → paste `supabase/schema.sql` → Run.
3. Authentication → Sign In / Providers: turn off "Allow new users to sign up".
4. Authentication → Users → Add user: one for the mayor and one for the
   secretary (email + password, auto-confirm).
5. Allow those two accounts, in the SQL Editor:
   ```sql
   insert into public.members (user_id)
   select id from auth.users
   where email in ('mayor@example.com', 'secretary@example.com')
   on conflict do nothing;
   ```
6. Copy `.env.example` to `.env.local` and fill in the project URL and the
   **publishable** key (Project Settings → API Keys). Never use the secret /
   service_role key in the app.
7. Restart `npx expo start`.

Only accounts listed in `members` can read or write anything (row level
security), even though the publishable key ships inside the app.

For EAS builds, `.env.local` is not uploaded; set the same two variables with
`npx eas-cli@latest env:create`.

## Project structure

```text
src/
├── app/
│   ├── _layout.tsx           root stack, login gate, auto-sync
│   ├── login.tsx
│   ├── (tabs)/               Students, Amotan, Account
│   ├── student/[id].tsx      a student's checklist
│   ├── amotan/[id].tsx       who paid / who has not
│   ├── record-payment.tsx
│   ├── add-student.tsx, edit-student.tsx
│   └── add-amotan.tsx, edit-amotan.tsx
├── auth/AuthProvider.tsx
├── components/               cards, forms, ChecklistRow, DateField, SyncStatusBar
├── constants/routes.ts
├── database/                 SQLite connection, migrations, repositories
├── lib/supabase.ts
├── sync/                     sync engine, scheduler, events
├── types/amotan.ts
└── utils/                    validation, formatting, helpers
supabase/schema.sql           server tables, triggers, row level security
```

## Commands

```bash
npm install
npx expo start
npm run lint
npm run typecheck
```
