import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: '#ffffff',
    display: 'standalone',
    name: 'Payload Mobile Upload',
    share_target: {
      action: '/mobile-upload/share',
      enctype: 'multipart/form-data',
      method: 'POST',
      params: {
        files: [
          {
            accept: ['image/*', 'video/*', 'application/pdf', 'application/*'],
            name: 'files',
          },
        ],
      },
    },
    short_name: 'Payload Upload',
    start_url: '/mobile-upload',
    theme_color: '#111111',
  }
}
