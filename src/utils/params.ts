/**
 * Route params can arrive as an array when a key repeats in the URL; the
 * screens only ever want the first value.
 */
export function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}
