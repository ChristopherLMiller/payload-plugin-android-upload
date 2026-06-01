import config from '@payload-config'
import { ShareUploadPage } from 'payload-plugin-android-upload/rsc'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { createPayloadRequest } from 'payload'

type Args = {
  searchParams: Promise<{
    filesToken?: string
  }>
}

const getPayloadRequest = async (path: string) => {
  const headersList = await getHeaders()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') ?? 'http'

  return createPayloadRequest({
    config,
    request: new Request(`${protocol}://${host}${path}`, {
      headers: headersList,
    }),
  })
}

export default async function MobileUploadIndexPage({ searchParams }: Args) {
  const { filesToken } = await searchParams
  const req = await getPayloadRequest('/mobile-upload')

  if (!req.user) {
    redirect('/admin/login?redirect=/mobile-upload')
  }

  return <ShareUploadPage filesToken={filesToken} pluginOptions={{}} req={req} />
}
