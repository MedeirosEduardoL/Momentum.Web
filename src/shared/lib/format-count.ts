export function formatCount(quantity: number, noun: string) {
  return quantity === 1 ? `1 ${noun}` : `${quantity} ${noun}s`;
}
