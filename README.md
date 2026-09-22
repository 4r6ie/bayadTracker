# BayadTracker

A local-first payment tracker for Android and iOS. Payments are recorded on the
device with SQLite — there is no account, no server, and the app works fully
offline.

Built with [Expo](https://docs.expo.dev) SDK 57, React Native 0.86, and
Expo Router.

## Features

- **Dashboard** — total collected, total payments, today's payments, monthly
  total, and the five most recent payments.
- **Payments** — search (payer, description, notes), filter by status, sort by
  date or amount, pull to refresh, and a floating **Add Payment** button.
- **Details** — full record view (payer, description, amount, date, status,
  notes, created/updated timestamps) with Edit and Delete actions.
- **Create / Edit** — validated form with a native date picker and a save-error
  state if the database write fails.
- **Delete** — confirmation dialog before any record is removed, plus a
  "Delete All Payments" reset in Settings.
- **Settings** — app info, storage explanation, stored record count, and the
  danger zone.

Payment statuses: `PAID`, `PENDING`, `CANCELLED`.

## Project structure

```
src/
  app/                       # Expo Router routes (every file is a screen)
    _layout.tsx              # Root stack: tabs + payment form/detail screens
    (tabs)/
      _layout.tsx            # Bottom tabs
      index.tsx              # Dashboard
      payments.tsx           # Payments list (search / filter / sort)
      settings.tsx           # Settings
    payments/
      add.tsx                # Create payment
      [id].tsx               # Payment details (view + delete)
      edit.tsx               # Update payment
  components/                # Reusable UI (PaymentCard, PaymentForm, states, fields)
  constants/colors.ts        # Brand colors, spacing, radii
  database/                  # SQLite connection, migrations, repository (SQL only)
  services/                  # Public data API used by screens
  types/payment.ts           # Payment types, statuses, filters, sorts
  utils/                     # Currency, date, and form-validation helpers
```

### Data flow

```
Screen → PaymentService → paymentRepository (SQL) → expo-sqlite → bayadtracker.db
```

Screens never write SQL directly. `initializeDatabase()` opens the database once,
applies migrations, and caches the connection promise.

### Database

Table `payments` (schema version 1, tracked with `PRAGMA user_version`):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER | primary key, autoincrement |
| `payer_name` | TEXT | required |
| `description` | TEXT | required |
| `amount` | REAL | required, must be greater than 0 |
| `payment_date` | TEXT | `YYYY-MM-DD` |
| `status` | TEXT | `PAID` \| `PENDING` \| `CANCELLED` |
| `notes` | TEXT | nullable |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp, refreshed on every update |

## Commands

```bash
npm install          # install dependencies
npx expo start       # start the dev server (Expo Go or a development build)
npx expo start --android
npm run lint         # ESLint (expo lint)
npm run typecheck    # TypeScript (tsc --noEmit)
npx expo-doctor      # check dependency and config health
```

`expo-sqlite` and `@expo/ui` (the date picker) are both included in Expo Go, so
the app runs in Expo Go without a development build.

## Manual test checklist

**CRUD**

1. Add a payment with every field filled — it appears on the Dashboard and in
   Payments, with a success alert.
2. Open that payment from the list — every field matches what was entered.
3. Edit it (change payer, amount, status, and date) — all screens show the new
   values and the `Updated` timestamp advances.
4. Delete it from the details screen and confirm the dialog — it disappears from
   the Payments list and the Dashboard statistics.

**Validation (must show messages, never crash)**

- Empty payer / empty description → inline "required" messages.
- Amount `0`, `-5`, `abc`, or empty → "Enter a valid amount greater than 0."
- Missing payment date → "Payment date is required."
- Invalid payment ID (for example `/payments/999999`) → "Payment not found".
- Save while the database is unavailable → red error banner, form stays open.
- Cancel a delete confirmation → nothing is removed.

**Persistence and offline**

- Add a payment, fully close the app, reopen it → the payment is still there.
- Turn off Wi-Fi and mobile data, then add / edit / delete → everything keeps
  working because all data is stored locally.

## Roadmap (not implemented yet)

Categories, receipt generation, CSV/PDF export, database backup,
PIN/biometric app lock, and optional cloud sync.
