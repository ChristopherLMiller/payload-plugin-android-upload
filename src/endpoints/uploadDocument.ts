import type { CollectionSlug, PayloadHandler, PayloadRequest } from 'payload'
import { APIError, addDataAndFileToRequest, docAccessOperation, headersWithCors } from 'payload'
import type { File as PayloadFile } from 'payload'

import type { PayloadPluginAndroidUploadConfig } from '../types.js'
import { getFilesFromRequest } from '../utils/getFilesFromRequest.js'
import { getUploadTargetBySlug } from '../utils/getUploadTargets.js'

const resolveUploadCollectionSlug = (
  relationTo: CollectionSlug | CollectionSlug[],
): CollectionSlug => {
  if (Array.isArray(relationTo)) {
    return relationTo[0]
  }

  return relationTo
}

const uploadFilesToCollection = async ({
  collectionSlug,
  data,
  files,
  req,
}: {
  collectionSlug: string
  data?: Record<string, unknown>
  files: PayloadFile[]
  req: PayloadRequest
}) => {
  const docs = []
  const errors: { fileName: string; message: string }[] = []

  for (const file of files) {
    try {
      const doc = await req.payload.create({
        collection: collectionSlug,
        data: {
          alt: file.name,
          ...(data ?? {}),
        },
        file,
        overrideAccess: false,
        req,
        user: req.user,
      })
      docs.push(doc)
    } catch (error) {
      errors.push({
        fileName: file.name,
        message: error instanceof Error ? error.message : 'Upload failed',
      })
    }
  }

  return { docs, errors }
}

export const createUploadDocumentHandler =
  (pluginOptions: PayloadPluginAndroidUploadConfig): PayloadHandler =>
  async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    const collectionSlug = req.routeParams?.collectionSlug

    if (!collectionSlug || typeof collectionSlug !== 'string') {
      throw new APIError('Collection slug is required', 400)
    }

    const target = await getUploadTargetBySlug({
      collectionSlug,
      collections: req.payload.collections,
      pluginOptions,
      req,
    })

    if (!target) {
      throw new APIError('Collection is not available for mobile upload', 404)
    }

    const collection = req.payload.collections[collectionSlug]

    if (!collection) {
      throw new APIError('Collection not found', 404)
    }

    await addDataAndFileToRequest(req)

    const permissions = await docAccessOperation({
      collection,
      data: req.data ?? {},
      req,
    })

    if (!permissions.create) {
      throw new APIError('Forbidden', 403)
    }

    const files = getFilesFromRequest(req) as PayloadFile[]

    if (target.isUploadCollection) {
      if (files.length === 0) {
        throw new APIError('At least one file is required', 400)
      }

      const { docs, errors } = await uploadFilesToCollection({
        collectionSlug,
        data: req.data,
        files,
        req,
      })

      return Response.json(
        { docs, errors },
        {
          headers: headersWithCors({
            headers: new Headers(),
            req,
          }),
        },
      )
    }

    const uploadFieldName =
      typeof req.data?.uploadField === 'string'
        ? req.data.uploadField
        : typeof req.query?.uploadField === 'string'
          ? req.query.uploadField
          : target.uploadFields.length === 1
            ? target.uploadFields[0].name
            : undefined

    if (!uploadFieldName) {
      throw new APIError(
        'uploadField is required when the collection has multiple upload fields',
        400,
      )
    }

    const uploadField = target.uploadFields.find((field) => field.name === uploadFieldName)

    if (!uploadField) {
      throw new APIError('Invalid uploadField', 400)
    }

    if (files.length === 0) {
      throw new APIError('At least one file is required', 400)
    }

    if (!uploadField.hasMany && files.length > 1) {
      throw new APIError('Only one file is allowed for this upload field', 400)
    }

    const uploadCollectionSlug = resolveUploadCollectionSlug(uploadField.relationTo)
    const { docs: uploadedMedia, errors: uploadErrors } = await uploadFilesToCollection({
      collectionSlug: uploadCollectionSlug,
      files,
      req,
    })

    if (uploadedMedia.length === 0) {
      throw new APIError('Failed to upload files', 400, uploadErrors)
    }

    const documentData = {
      ...(req.data ?? {}),
    }

    delete documentData.uploadField

    documentData[uploadFieldName] = uploadField.hasMany
      ? uploadedMedia.map((doc) => doc.id)
      : uploadedMedia[0].id

    const doc = await req.payload.create({
      collection: collectionSlug,
      data: documentData,
      overrideAccess: false,
      req,
      user: req.user,
    })

    return Response.json(
      {
        doc,
        uploadErrors,
        uploadedMedia,
      },
      {
        headers: headersWithCors({
          headers: new Headers(),
          req,
        }),
      },
    )
  }
