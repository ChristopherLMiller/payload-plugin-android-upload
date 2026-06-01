import type { PayloadHandler } from 'payload'
import { APIError, headersWithCors } from 'payload'

import type { PayloadPluginAndroidUploadConfig } from '../types.js'
import { getMobileUploadClientConfig } from '../utils/getMobileUploadClientConfig.js'

export const createListCollectionsHandler =
  (pluginOptions: PayloadPluginAndroidUploadConfig): PayloadHandler =>
  async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    const { collections } = await getMobileUploadClientConfig({
      pluginOptions,
      req,
    })

    return Response.json(
      { collections },
      {
        headers: headersWithCors({
          headers: new Headers(),
          req,
        }),
      },
    )
  }
