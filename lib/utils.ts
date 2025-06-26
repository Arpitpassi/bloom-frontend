export function isValidArweaveAddress(address: string): boolean {
  return /^[a-zA-Z0-9\-_]{43}$/.test(address)
}

export function localToZulu(localDateTime: string): string {
  const date = new Date(localDateTime)
  return date.toISOString()
}