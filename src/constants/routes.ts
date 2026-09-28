/**
 * Every route in the app.
 *
 * Screens navigate with these constants instead of typing route strings, so a
 * route only has to be renamed in one place. The literals are kept as-is
 * because Expo Router's typed routes check them.
 */
export const routes = {
  /** Tabs. The dashboard is the landing tab. */
  dashboard: '/',
  students: '/students',
  amotanList: '/amotan',
  account: '/account',

  addStudent: '/add-student',
  /** Pass `params: { id }`. */
  editStudent: '/edit-student',
  /** Dynamic route: pass `params: { id }`. The student's checklist. */
  studentDetails: '/student/[id]',

  addAmotan: '/add-amotan',
  /** Pass `params: { id }`. */
  editAmotan: '/edit-amotan',
  /** Dynamic route: pass `params: { id }`. Who paid and who has not. */
  amotanDetails: '/amotan/[id]',

  /** Pass `params: { studentId, amotanId }`. */
  recordPayment: '/record-payment',
} as const;
