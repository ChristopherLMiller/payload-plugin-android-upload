import config from '@payload-config'
import { ShareUploadPage } from 'payload-plugin-android-upload/rsc'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { createPayloadRequest } from 'payload'

type Args = {
  params: Promise<{
    collection: string
  }>
  searchParams: Promise<{
    filesToken?: string
    success?: string
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

export default async function MobileUploadCollectionPage({ params, searchParams }: Args) {
  const { collection } = await params
  const { filesToken, success } = await searchParams
  const path = `/mobile-upload/${collection}`
  const req = await getPayloadRequest(path)

  if (!req.user) {
    redirect(`/admin/login?redirect=${encodeURIComponent(path)}`)
  }

  return (
    <ShareUploadPage
      collectionSlug={collection}
      filesToken={filesToken}
      pluginOptions={{}}
      req={req}
      success={success === 'true'}
    />
  )
}
