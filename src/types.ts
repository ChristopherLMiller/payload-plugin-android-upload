import type { CollectionSlug } from 'payload'

export type UploadFieldTarget = {
  hasMany: boolean
  name: string
  relationTo: CollectionSlug | CollectionSlug[]
}

export type UploadTarget = {
  isUploadCollection: boolean
  labels: {
    plural: string
    singular: string
  }
  slug: CollectionSlug
  uploadFields: UploadFieldTarget[]
}

export type MobileUploadShareTarget = {
  enctype: 'multipart/form-data'
  method: 'POST'
  url: string
}

export type MobileUploadClientConfig = {
  collections: UploadTarget[]
  shareTarget: MobileUploadShareTarget
  upload: {
    method: 'POST'
    /** Absolute URL with `{collectionSlug}` placeholder */
    urlTemplate: string
  }
}

export type PayloadPluginAndroidUploadConfig = {
  /** Standalone UI base path. Default: '/mobile-upload' */
  basePath?: string
  /** Whitelist. If omitted, auto-detect upload collections only */
  collections?: CollectionSlug[]
  disabled?: boolean
  /**
   * When true, also include document collections that have upload fields (e.g. posts with featuredImage).
   * Default: false — only collections with `upload` config (e.g. media) are included.
   */
  includeDocumentCollections?: boolean
  /** Override share target path. Default: `{basePath}/share` */
  shareTargetPath?: string
}
