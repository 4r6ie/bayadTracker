export function isValidId(id: number): boolean {
    return Number.isInteger(id) && id > 0;
}