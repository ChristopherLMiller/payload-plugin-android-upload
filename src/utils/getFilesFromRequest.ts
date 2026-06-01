import type { PayloadRequest } from 'payload'
import type { File as PayloadFile } from 'payload'

export const getFilesFromRequest = (req: PayloadRequest): PayloadFile[] => {
  const files: PayloadFile[] = []
  const seen = new Set<unknown>()

  const addFile = (file: unknown) => {
    if (!file || seen.has(file)) {
      return
    }

    seen.add(file)
    files.push(file as PayloadFile)
  }

  if (req.files) {
    for (const value of Object.values(req.files)) {
      if (Array.isArray(value)) {
        for (const file of value) {
          addFile(file)
        }
      } else {
        addFile(value)
      }
    }
  }

  addFile(req.file)

  return files
}
