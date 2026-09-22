# BayadTracker

A simple mobile-only CRUD app for recording people who have paid money.
Local-first: payments are stored in SQLite on the device — no backend,
no cloud, works fully offline.

Built with Expo, React Native, TypeScript, Expo Router, and `expo-sqlite`.

## Screens

- **Home / Payments** (`src/app/index.tsx`) — a "Total Paid" summary card (total
  amount + number of payments), then all saved payments, tap to open details.
  Empty state: "No payments yet. Tap "Add Payment" to record your first
  payment." Loading state: spinner while the database loads.
- **Add Payment** (`src/app/add-payment.tsx`) — payer name, amount,
  description, payment date, then Save Payment. The date is chosen with the
  platform's own date picker (no typing), so its field cannot hold a malformed
  value. Saves to SQLite, shows a success message, returns to the list, list
  and total refresh.
- **Payment Details** (`src/app/payment/[id].tsx`) — payer name, amount,
  description, payment date, with Edit and Delete buttons.
- **Edit Payment** (`src/app/payment/edit.tsx`) — loads the record, then renders
  the same `PaymentForm` pre-filled. Validates, updates SQLite, refreshes
  `updatedAt`, returns to details.

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
│   ├── PaymentCard.tsx
│   ├── PaymentForm.tsx
│   └── PaymentSummaryCard.tsx
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

`createPayment()`, `getPayments()`, `getPaymentById()`, `getPaymentSummary()`,
`updatePayment()`, `deletePayment()` live in
`src/database/paymentRepository.ts` and are all parameterized (`?` binding,
never string concatenation).

`getPaymentSummary()` returns `{ count, total }` from a single
`SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM payments`, so the header total is
never computed by summing the loaded list in the UI. The total is rounded to two
decimals because `amount` is a `REAL`.

`initializeDatabase()` lives in `src/database/database.ts` (it opens the shared
connection and creates the table) and is re-exported by the repository, so
screens import from the repository only.

`PaymentForm` wraps its `ScrollView` in a `KeyboardAvoidingView` (`padding` on
iOS, `undefined` on Android) so the keyboard never covers the save button. Both
the add and edit screens share it.

The payment date field opens the platform picker — a dialog on Android
(`DateTimePickerAndroid.open`, the API the library recommends) and an inline
calendar on iOS — and stores the result as `YYYY-MM-DD`. Because the picker can
only produce valid dates, the date is validated against `parseDateInput()` but
can no longer be typed incorrectly. Web keeps a plain text field, since
`@react-native-community/datetimepicker` has no web implementation.

Table `payments`: `id`, `payer_name`, `amount`, `description`,
`payment_date`, `created_at`, `updated_at`.

## Dependencies

Added on top of the Expo default template:

- `expo-sqlite` — local storage.
- `@react-native-community/datetimepicker` — native date picker for the payment
  date. Included in Expo Go, so no development build is needed. Install with
  `npx expo install @react-native-community/datetimepicker`; `expo install`
  also registers the package's config plugin in `app.json` so it survives
  Continuous Native Generation.

## Commands

```bash
npm install
npx expo start
npm run lint
npm run typecheck
```
