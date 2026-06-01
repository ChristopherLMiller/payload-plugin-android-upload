import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    defaultColumns: ['title', 'createdAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'featuredImage',
      relationTo: 'media',
      type: 'upload',
    },
    {
      name: 'gallery',
      hasMany: true,
      relationTo: 'media',
      type: 'upload',
    },
  ],
  labels: {
    plural: 'Posts',
    singular: 'Post',
  },
}
