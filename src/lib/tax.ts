export const TAX_RATE = 0.1;

export function calculateTax(subtotal: number): number {
  return Math.floor(subtotal * TAX_RATE);
}

export function calculateTotalWithTax(subtotal: number): number {
  return subtotal + calculateTax(subtotal);
}
