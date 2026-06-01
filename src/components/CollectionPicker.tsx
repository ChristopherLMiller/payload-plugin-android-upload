'use client'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { UploadTarget } from '../types.js'

type CollectionPickerProps = {
  apiRoute: string
  basePath: string
  collections: UploadTarget[]
  filesToken?: string
}

export const CollectionPicker: React.FC<CollectionPickerProps> = ({
  apiRoute,
  basePath,
  collections,
  filesToken,
}) => {
  const query = filesToken ? `?filesToken=${encodeURIComponent(filesToken)}` : ''

  return (
    <div className="mobile-upload-picker">
      <h1>Upload to Payload</h1>
      <p>Select a collection to create a new document with your shared media.</p>
      <ul className="mobile-upload-picker__list">
        {collections.map((collection) => (
          <li key={collection.slug}>
            <a href={`${basePath}/${collection.slug}${query}`}>
              <strong>{collection.labels.singular}</strong>
              <span>
                {collection.isUploadCollection
                  ? 'Upload collection'
                  : `${collection.uploadFields.length} upload field(s)`}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mobile-upload-picker__hint">
        Setup endpoint:{' '}
        <code>{formatAdminURL({ apiRoute, path: '/mobile-upload/config' })}</code>
      </p>
    </div>
  )
}
