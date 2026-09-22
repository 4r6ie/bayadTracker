# BayadTracker

A simple mobile-only CRUD app for recording people who have paid money.
Local-first: payments are stored in SQLite on the device — no backend,
no cloud, works fully offline.

Built with Expo, React Native, TypeScript, Expo Router, and `expo-sqlite`.

## Screens

- **Home / Payments** (`src/app/index.tsx`) — a pinned header holding the "Total
  Paid" summary card, a search field, date filter chips (All / Today / Week /
  Month) and a sort toggle (Newest / Oldest); below it the payments are grouped
  into one sticky section per day ("Today", "Yesterday", then a formatted date).
  Tapping a row opens details; swiping right reveals Delete and swiping left
  reveals Edit. Pull down to refresh. "+" is a floating action button so it stays
  reachable with a thumb and never scrolls away.
  Empty states: "No payments yet. Tap + to record your first payment." when
  nothing is saved, and "No matching payments." with a Clear filters button when
  the search or filter excludes everything. Loading state: a pulsing skeleton
  that mirrors the summary card and rows, so the layout does not jump.
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
this payment? [Cancel] [Delete]" — whether it is triggered from the details
screen or from a swipe on the list.

Search and the date filter run in memory over the loaded rows (`src/utils/paymentList.ts`),
which is what keeps typing instant and offline. The total, by contrast, is always
read from SQLite, so it is never affected by the active filter.

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
│   ├── PaymentSummaryCard.tsx
│   └── PaymentsLoadingSkeleton.tsx
├── database/
│   ├── database.ts
│   └── paymentRepository.ts
├── types/
│   └── payment.ts
└── utils/
    ├── feedback.ts
    ├── paymentList.ts
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
- `expo-haptics` — the light tap on row presses and on "+".
- `react-native-reanimated` — required by `ReanimatedSwipeable`, the swipe
  actions on the list rows. It was already being pulled in transitively by
  `expo-router` (via `react-native-drawer-layout`), but is declared here so the
  import in `PaymentCard.tsx` does not depend on hoisting.

The swipe actions use `react-native-gesture-handler/ReanimatedSwipeable`, not
the `Swipeable` export from the package root, which is marked
`@deprecated use Reanimated version of Swipeable instead`. Gestures only work
inside a `GestureHandlerRootView`, and expo-router only mounts one for its
`@react-navigation/stack` fork — which the native-stack `Stack` here does not
use — so `src/app/_layout.tsx` mounts it explicitly at the root.

## Commands

```bash
npm install
npx expo start
npm run lint
npm run typecheck
```
