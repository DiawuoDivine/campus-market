import { env } from '../config/env'

export function validateIndexNumber(indexNumber: string): boolean {
  const regex = new RegExp(env.INDEX_NUMBER_REGEX)
  return regex.test(indexNumber.toUpperCase())
}

export function normalizeIndexNumber(indexNumber: string): string {
  return indexNumber.toUpperCase().trim()
}
