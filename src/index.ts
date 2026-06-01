import type { Config } from 'payload'

import { createClientConfigHandler } from './endpoints/clientConfig.js'
import { createListCollectionsHandler } from './endpoints/listCollections.js'
import { createUploadDocumentHandler } from './endpoints/uploadDocument.js'
import type { PayloadPluginAndroidUploadConfig } from './types.js'

export type {
  MobileUploadClientConfig,
  MobileUploadShareTarget,
  PayloadPluginAndroidUploadConfig,
  UploadFieldTarget,
  UploadTarget,
} from './types.js'

export const payloadPluginAndroidUpload =
  (pluginOptions: PayloadPluginAndroidUploadConfig = {}) =>
  (config: Config): Config => {
    if (pluginOptions.disabled) {
      return config
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    config.endpoints.push(
      {
        handler: createClientConfigHandler(pluginOptions),
        method: 'get',
        path: '/mobile-upload/config',
      },
      {
        handler: createListCollectionsHandler(pluginOptions),
        method: 'get',
        path: '/mobile-upload/collections',
      },
      {
        handler: createUploadDocumentHandler(pluginOptions),
        method: 'post',
        path: '/mobile-upload/:collectionSlug',
      },
    )

    return config
  }
