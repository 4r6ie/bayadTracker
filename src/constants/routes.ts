/**
 * Every route in the app.
 *
 * Screens navigate with these constants instead of typing route strings, so a
 * route only has to be renamed in one place. The literals are kept as-is
 * because Expo Router's typed routes check them.
 */
export const routes = {
  /** Home screen: the payments list. */
  payments: '/',
  addPayment: '/add-payment',
  /** Dynamic route: pass `params: { id }` when navigating. */
  paymentDetails: '/payment/[id]',
  editPayment: '/payment/edit',
} as const;
