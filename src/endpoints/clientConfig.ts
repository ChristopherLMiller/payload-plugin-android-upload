import type { PayloadHandler } from 'payload'
import { APIError, headersWithCors } from 'payload'

import type { PayloadPluginAndroidUploadConfig } from '../types.js'
import { getMobileUploadClientConfig } from '../utils/getMobileUploadClientConfig.js'

export const createClientConfigHandler =
  (pluginOptions: PayloadPluginAndroidUploadConfig): PayloadHandler =>
  async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    const clientConfig = await getMobileUploadClientConfig({
      pluginOptions,
      req,
    })

    return Response.json(clientConfig, {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
    })
  }
