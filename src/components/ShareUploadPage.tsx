import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { docAccessOperation } from 'payload'
import type { PayloadRequest } from 'payload'
import React from 'react'

import { CollectionPicker } from '../components/CollectionPicker.js'
import { ShareUploadForm } from '../components/ShareUploadForm.js'
import type { PayloadPluginAndroidUploadConfig, UploadTarget } from '../types.js'
import { getUploadTargetBySlug, getUploadTargets } from '../utils/getUploadTargets.js'
import { consumeSharedFiles } from '../utils/shareFileStore.js'

import '../styles/mobile-upload.scss'

type ShareUploadPageProps = {
  basePath?: string
  collectionSlug?: string
  filesToken?: string
  pluginOptions: PayloadPluginAndroidUploadConfig
  req: PayloadRequest
  success?: boolean
}

const seedSharedFiles = async ({
  filesToken,
  req,
  target,
}: {
  filesToken: string
  req: PayloadRequest
  target: UploadTarget
}): Promise<Record<string, unknown>> => {
  const files = consumeSharedFiles(filesToken)

  if (!files?.length || target.isUploadCollection) {
    return {}
  }

  const uploadField = target.uploadFields[0]
  const relationTo = Array.isArray(uploadField.relationTo)
    ? uploadField.relationTo[0]
    : uploadField.relationTo

  const uploadedIds: (number | string)[] = []

  for (const file of files) {
    const doc = await req.payload.create({
      collection: relationTo,
      data: {
        alt: file.name,
      },
      file,
      overrideAccess: false,
      req,
      user: req.user,
    })
    uploadedIds.push(doc.id)
  }

  return {
    [uploadField.name]: uploadField.hasMany ? uploadedIds : uploadedIds[0],
  }
}

export async function ShareUploadPage({
  basePath = '/mobile-upload',
  collectionSlug,
  filesToken,
  pluginOptions,
  req,
  success,
}: ShareUploadPageProps) {
  if (!req.user) {
    return (
      <div className="mobile-upload-page">
        <h1>Authentication required</h1>
        <p>Sign in to Payload before uploading shared media.</p>
      </div>
    )
  }

  const {
    config: {
      routes: { api: apiRoute },
    },
  } = req.payload

  if (!collectionSlug) {
    const collections = await getUploadTargets({
      collections: req.payload.collections,
      pluginOptions,
      req,
    })

    return (
      <CollectionPicker
        apiRoute={apiRoute}
        basePath={basePath}
        collections={collections}
        filesToken={filesToken}
      />
    )
  }

  const target = await getUploadTargetBySlug({
    collectionSlug,
    collections: req.payload.collections,
    pluginOptions,
    req,
  })

  if (!target) {
    return (
      <div className="mobile-upload-page">
        <h1>Collection unavailable</h1>
        <p>This collection is not enabled for mobile upload or you do not have access.</p>
        <a href={basePath}>Back to collection picker</a>
      </div>
    )
  }

  const collection = req.payload.collections[collectionSlug]

  if (!collection) {
    return (
      <div className="mobile-upload-page">
        <h1>Collection not found</h1>
        <a href={basePath}>Back to collection picker</a>
      </div>
    )
  }

  const docPermissions = await docAccessOperation({
    collection,
    data: {},
    req,
  })

  if (!docPermissions.create) {
    return (
      <div className="mobile-upload-page">
        <h1>Permission denied</h1>
        <p>You do not have permission to create documents in this collection.</p>
        <a href={basePath}>Back to collection picker</a>
      </div>
    )
  }

  const initialData =
    filesToken && !target.isUploadCollection
      ? await seedSharedFiles({
          filesToken,
          req,
          target,
        })
      : {}

  const { state: formState } = await buildFormState({
    collectionSlug,
    data: initialData,
    docPermissions,
    docPreferences: { fields: {} },
    operation: 'create',
    renderAllFields: true,
    req,
    schemaPath: collectionSlug,
    skipClientConfigAuth: true,
    skipValidation: true,
  })

  return (
    <div className="mobile-upload-page">
      <header className="mobile-upload-page__header">
        <a href={basePath}>← Choose another collection</a>
        <h1>Create {target.labels.singular}</h1>
        {success ? <p className="mobile-upload-page__success">Document created successfully.</p> : null}
      </header>
      {filesToken && target.isUploadCollection ? (
        <p className="mobile-upload-page__notice">
          Shared files were received. Select your file(s) in the form below.
        </p>
      ) : null}
      <ShareUploadForm
        collectionSlug={collectionSlug}
        docPermissions={docPermissions}
        docPreferences={{ fields: {} }}
        initialState={formState}
        redirectPath={`${basePath}/${collectionSlug}?success=true`}
      />
    </div>
  )
}
