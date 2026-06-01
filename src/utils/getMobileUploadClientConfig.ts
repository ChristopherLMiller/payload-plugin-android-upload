import type { PayloadRequest } from 'payload'
import { formatAdminURL } from 'payload/shared'

import type { MobileUploadClientConfig, PayloadPluginAndroidUploadConfig } from '../types.js'
import { getUploadTargets } from './getUploadTargets.js'

const joinOriginAndPath = (origin: string, path: string): string => {
  const normalizedOrigin = origin.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${normalizedOrigin}${normalizedPath}`
}

const getOriginFromRequest = (req: PayloadRequest): string => {
  const { serverURL } = req.payload.config

  if (serverURL) {
    return serverURL.replace(/\/$/, '')
  }

  if (req.url) {
    try {
      const { origin } = new URL(req.url)
      return origin
    } catch {
      // fall through
    }
  }

  const host = req.headers?.get('host')

  if (host) {
    return `http://${host}`
  }

  return ''
}

export const getMobileUploadClientConfig = async ({
  pluginOptions,
  req,
}: {
  pluginOptions: PayloadPluginAndroidUploadConfig
  req: PayloadRequest
}): Promise<MobileUploadClientConfig> => {
  const {
    config: {
      routes: { api: apiRoute },
    },
  } = req.payload

  const origin = getOriginFromRequest(req)

  const basePath = pluginOptions.basePath ?? '/mobile-upload'
  const shareTargetPath = pluginOptions.shareTargetPath ?? `${basePath}/share`

  const collections = await getUploadTargets({
    collections: req.payload.collections,
    pluginOptions,
    req,
  })

  const uploadPath = formatAdminURL({
    apiRoute,
    path: '/mobile-upload/{collectionSlug}',
    relative: true,
  })

  return {
    collections,
    shareTarget: {
      enctype: 'multipart/form-data',
      method: 'POST',
      url: joinOriginAndPath(origin, shareTargetPath),
    },
    upload: {
      method: 'POST',
      urlTemplate: joinOriginAndPath(origin, uploadPath),
    },
  }
}
