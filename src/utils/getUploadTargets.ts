import type { CollectionSlug, Field, PayloadRequest, SanitizedCollectionConfig } from 'payload'
import { executeAccess } from 'payload'
import { fieldHasSubFields, fieldIsArrayType, fieldIsBlockType } from 'payload/shared'

import type { PayloadPluginAndroidUploadConfig, UploadFieldTarget, UploadTarget } from '../types.js'

const getLabel = (label: unknown, fallback: string): string => {
  if (typeof label === 'string') {
    return label
  }

  return fallback
}

const collectUploadFields = (fields: Field[], prefix = ''): UploadFieldTarget[] => {
  const results: UploadFieldTarget[] = []

  for (const field of fields) {
    if (field.type === 'upload' && 'name' in field && typeof field.name === 'string') {
      results.push({
        hasMany: Boolean(field.hasMany),
        name: prefix ? `${prefix}.${field.name}` : field.name,
        relationTo: field.relationTo,
      })
      continue
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('fields' in tab) {
          const tabPrefix =
            'name' in tab && typeof tab.name === 'string'
              ? prefix
                ? `${prefix}.${tab.name}`
                : tab.name
              : prefix
          results.push(...collectUploadFields(tab.fields, tabPrefix))
        }
      }
      continue
    }

    if (!fieldHasSubFields(field) || fieldIsArrayType(field) || fieldIsBlockType(field)) {
      continue
    }

    if ('fields' in field) {
      const groupPrefix =
        'name' in field && typeof field.name === 'string'
          ? prefix
            ? `${prefix}.${field.name}`
            : field.name
          : prefix
      results.push(...collectUploadFields(field.fields, groupPrefix))
    }
  }

  return results
}

const hasUploadCapability = (collection: SanitizedCollectionConfig): boolean => {
  if (collection.upload) {
    return true
  }

  return collectUploadFields(collection.fields).length > 0
}

const shouldIncludeCollection = ({
  config,
  pluginOptions,
  whitelist,
}: {
  config: SanitizedCollectionConfig
  pluginOptions: PayloadPluginAndroidUploadConfig
  whitelist: CollectionSlug[] | undefined
}): boolean => {
  const isUploadCollection = Boolean(config.upload)

  if (!hasUploadCapability(config)) {
    return false
  }

  if (whitelist) {
    return whitelist.includes(config.slug)
  }

  if (isUploadCollection) {
    return true
  }

  return pluginOptions.includeDocumentCollections ?? false
}

const canCreateCollection = async ({
  collection,
  req,
}: {
  collection: { config: SanitizedCollectionConfig }
  req: PayloadRequest
}): Promise<boolean> => {
  const createAccess = collection.config.access?.create

  if (!createAccess) {
    return true
  }

  const result = await executeAccess({ req }, createAccess)

  return result !== false
}

export const getUploadTargets = async ({
  collections,
  pluginOptions,
  req,
}: {
  collections: Record<string, { config: SanitizedCollectionConfig }>
  pluginOptions: PayloadPluginAndroidUploadConfig
  req: PayloadRequest
}): Promise<UploadTarget[]> => {
  const whitelist = pluginOptions.collections
  const targets: UploadTarget[] = []

  for (const collection of Object.values(collections)) {
    const { config } = collection

    if (config.slug === 'payload-preferences' || config.slug === 'payload-migrations') {
      continue
    }

    if (!shouldIncludeCollection({ config, pluginOptions, whitelist })) {
      continue
    }

    if (!(await canCreateCollection({ collection, req }))) {
      continue
    }

    const uploadFields = config.upload
      ? [{ hasMany: false, name: 'file', relationTo: config.slug }]
      : collectUploadFields(config.fields)

    if (uploadFields.length === 0) {
      continue
    }

    targets.push({
      isUploadCollection: Boolean(config.upload),
      labels: {
        plural: getLabel(config.labels?.plural, config.slug),
        singular: getLabel(config.labels?.singular, config.slug),
      },
      slug: config.slug,
      uploadFields,
    })
  }

  return targets.sort((a, b) => a.slug.localeCompare(b.slug))
}

export const getUploadTargetBySlug = async ({
  collectionSlug,
  collections,
  pluginOptions,
  req,
}: {
  collectionSlug: string
  collections: Record<string, { config: SanitizedCollectionConfig }>
  pluginOptions: PayloadPluginAndroidUploadConfig
  req: PayloadRequest
}): Promise<UploadTarget | null> => {
  const targets = await getUploadTargets({ collections, pluginOptions, req })
  return targets.find((target) => target.slug === collectionSlug) ?? null
}
