import type { Payload } from 'payload'

import config from '@payload-config'
import { createPayloadRequest, getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { createClientConfigHandler } from '../src/endpoints/clientConfig.js'
import { createListCollectionsHandler } from '../src/endpoints/listCollections.js'
import { createUploadDocumentHandler } from '../src/endpoints/uploadDocument.js'
import { getUploadTargets } from '../src/utils/getUploadTargets.js'
import { devUser } from './helpers/credentials.js'

let payload: Payload
let authToken: string

const createAuthedRequest = async (url: string, init?: RequestInit) => {
  return createPayloadRequest({
    config,
    request: new Request(url, {
      ...init,
      headers: {
        Authorization: `JWT ${authToken}`,
        ...(init?.headers || {}),
      },
    }),
  })
}

afterAll(async () => {
  if (payload) {
    await payload.destroy()
  }
})

beforeAll(async () => {
  payload = await getPayload({ config })

  const loginResult = await payload.login({
    collection: 'users',
    data: devUser,
  })

  authToken = loginResult.token as string
})

describe('Mobile upload plugin', () => {
  test('config endpoint requires authentication', async () => {
    const request = await createPayloadRequest({
      config,
      request: new Request('http://localhost:3000/api/mobile-upload/config'),
    })

    await expect(createClientConfigHandler({})(request)).rejects.toMatchObject({
      status: 401,
    })
  })

  test('config endpoint returns upload collections and share target url', async () => {
    const request = await createAuthedRequest('http://localhost:3000/api/mobile-upload/config', {
      headers: {
        Host: 'localhost:3000',
      },
    })

    const response = await createClientConfigHandler({})(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.collections.map((collection: { slug: string }) => collection.slug)).toEqual(['media'])
    expect(data.collections[0]).toMatchObject({
      isUploadCollection: true,
      slug: 'media',
    })
    expect(data.shareTarget).toEqual({
      enctype: 'multipart/form-data',
      method: 'POST',
      url: 'http://localhost:3000/mobile-upload/share',
    })
    expect(data.upload).toEqual({
      method: 'POST',
      urlTemplate: 'http://localhost:3000/api/mobile-upload/{collectionSlug}',
    })
  })

  test('collections endpoint requires authentication', async () => {
    const request = await createPayloadRequest({
      config,
      request: new Request('http://localhost:3000/api/mobile-upload/collections'),
    })

    await expect(createListCollectionsHandler({})(request)).rejects.toMatchObject({
      status: 401,
    })
  })

  test('collections endpoint returns upload collections by default', async () => {
    const request = await createAuthedRequest('http://localhost:3000/api/mobile-upload/collections')
    const response = await createListCollectionsHandler({})(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.collections.map((collection: { slug: string }) => collection.slug)).toEqual(['media'])
    expect(data.collections[0]).toMatchObject({
      isUploadCollection: true,
      uploadFields: [{ hasMany: false, name: 'file', relationTo: 'media' }],
    })
  })

  test('includeDocumentCollections adds collections with upload fields', async () => {
    const request = await createAuthedRequest('http://localhost:3000/api/mobile-upload/collections')
    const targets = await getUploadTargets({
      collections: payload.collections,
      pluginOptions: { includeDocumentCollections: true },
      req: request,
    })

    expect(targets.map((target) => target.slug)).toEqual(['media', 'posts'])
    expect(targets.find((target) => target.slug === 'posts')).toMatchObject({
      isUploadCollection: false,
      uploadFields: expect.arrayContaining([
        expect.objectContaining({ name: 'featuredImage' }),
        expect.objectContaining({ hasMany: true, name: 'gallery' }),
      ]),
    })
  })

  test('collections whitelist limits available targets', async () => {
    const request = await createAuthedRequest('http://localhost:3000/api/mobile-upload/collections')
    const targets = await getUploadTargets({
      collections: payload.collections,
      pluginOptions: { collections: ['media'] },
      req: request,
    })

    expect(targets.map((target) => target.slug)).toEqual(['media'])
  })

  test('upload endpoint creates media documents from multipart files', async () => {
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    )

    const formData = new FormData()
    formData.append(
      'file',
      new Blob([pngBuffer], { type: 'image/png' }),
      'test-upload.png',
    )
    formData.append(
      '_payload',
      JSON.stringify({
        alt: 'Test upload',
      }),
    )

    const request = await createAuthedRequest('http://localhost:3000/api/mobile-upload/media', {
      body: formData,
      method: 'POST',
    })

    request.routeParams = { collectionSlug: 'media' }

    const response = await createUploadDocumentHandler({})(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.docs).toHaveLength(1)
    expect(data.docs[0].alt).toBe('Test upload')
  })

  test('upload endpoint creates a post when includeDocumentCollections is enabled', async () => {
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    )

    const formData = new FormData()
    formData.append(
      'file',
      new Blob([pngBuffer], { type: 'image/png' }),
      'featured.png',
    )
    formData.append(
      '_payload',
      JSON.stringify({
        title: 'Shared post',
        uploadField: 'featuredImage',
      }),
    )

    const request = await createAuthedRequest('http://localhost:3000/api/mobile-upload/posts', {
      body: formData,
      method: 'POST',
    })

    request.routeParams = { collectionSlug: 'posts' }

    const response = await createUploadDocumentHandler({ includeDocumentCollections: true })(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.doc.title).toBe('Shared post')
    expect(data.uploadedMedia).toHaveLength(1)
    expect(data.doc.featuredImage).toBeTruthy()
  })
})
