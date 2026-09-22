# BayadTracker

A simple mobile-only CRUD app for recording people who have paid money.
Local-first: payments are stored in SQLite on the device — no backend,
no cloud, works fully offline.

Built with Expo, React Native, TypeScript, Expo Router, and `expo-sqlite`.

## Screens

- **Home / Payments** (`src/app/index.tsx`) — all saved payments, tap to open
  details. Empty state: "No payments yet. Tap "Add Payment" to record your
  first payment." Loading state: spinner while the database loads.
- **Add Payment** (`src/app/add-payment.tsx`) — payer name, amount,
  description, payment date (YYYY-MM-DD), then Save Payment. Saves to SQLite,
  shows a success message, returns to the list, list refreshes.
- **Payment Details** (`src/app/payment/[id].tsx`) — payer name, amount,
  description, payment date, with Edit and Delete buttons.
- **Edit Payment** (`src/app/payment/edit.tsx`) — same form pre-filled.
  Validates, updates SQLite, refreshes `updatedAt`, returns to details.

Delete always asks first: "Delete Payment? Are you sure you want to delete
this payment? [Cancel] [Delete]".

## Project structure

```text
src/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── add-payment.tsx
│   └── payment/
│       ├── [id].tsx
│       └── edit.tsx
├── components/
│   └── PaymentCard.tsx
├── database/
│   ├── database.ts
│   └── paymentRepository.ts
├── types/
│   └── payment.ts
└── utils/
    └── validation.ts
```

Data flow: `UI → Repository → SQLite`. No SQL in screens.

## Repository functions

`initializeDatabase()`, `createPayment()`, `getPayments()`,
`getPaymentById()`, `updatePayment()`, `deletePayment()` — all in
`src/database/paymentRepository.ts`, all parameterized (`?` binding, never
string concatenation).

Table `payments`: `id`, `payer_name`, `amount`, `description`,
`payment_date`, `created_at`, `updated_at`.

## Commands

```bash
npm install
npx expo start
npm run lint
npm run typecheck
```
