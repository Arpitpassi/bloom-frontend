import { format } from 'date-fns'

export const formatDateTime = (isoDate: string): string => {
  try {
    return format(new Date(isoDate), 'MMM d, yyyy, h:mm a')
  } catch {
    return isoDate
  }
}

export const localToZulu = (localDateTime: string): string => {
  try {
    return new Date(localDateTime).toISOString()
  } catch {
    return localDateTime
  }
}

export const isValidArweaveAddress = (address: string): boolean => {
  return /^[a-zA-Z0-9\-_]{43}$/.test(address)
}