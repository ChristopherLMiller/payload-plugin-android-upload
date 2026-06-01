import type { File } from 'payload'
import { randomUUID } from 'crypto'

type StoredShare = {
  createdAt: number
  files: File[]
}

const TTL_MS = 15 * 60 * 1000
const store = new Map<string, StoredShare>()

const cleanupExpired = () => {
  const now = Date.now()

  for (const [token, entry] of store.entries()) {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(token)
    }
  }
}

export const storeSharedFiles = (files: File[]): string => {
  cleanupExpired()
  const token = randomUUID()
  store.set(token, {
    createdAt: Date.now(),
    files,
  })
  return token
}

export const consumeSharedFiles = (token: string): File[] | null => {
  cleanupExpired()
  const entry = store.get(token)

  if (!entry) {
    return null
  }

  store.delete(token)
  return entry.files
}

export const peekSharedFiles = (token: string): File[] | null => {
  cleanupExpired()
  return store.get(token)?.files ?? null
}
