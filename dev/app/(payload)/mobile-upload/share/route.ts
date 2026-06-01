import config from '@payload-config'
import { addDataAndFileToRequest, createPayloadRequest } from 'payload'
import { getFilesFromRequest } from 'payload-plugin-android-upload/files'
import { storeSharedFiles } from 'payload-plugin-android-upload/share'

export const POST = async (request: Request) => {
  const req = await createPayloadRequest({
    config,
    request,
  })

  if (!req.user) {
    return Response.redirect(new URL('/admin/login?redirect=/mobile-upload', request.url), 303)
  }

  await addDataAndFileToRequest(req)

  const files = getFilesFromRequest(req)

  if (files.length === 0) {
    return Response.redirect(new URL('/mobile-upload', request.url), 303)
  }

  const filesToken = storeSharedFiles(files)

  return Response.redirect(
    new URL(`/mobile-upload?filesToken=${encodeURIComponent(filesToken)}`, request.url),
    303,
  )
}
