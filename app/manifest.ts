import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ThreadLearn',
    short_name: 'ThreadLearn',
    description: 'A focused learning platform for programming and concurrency.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f4f7f4',
    theme_color: '#0f352d',
    icons: [
      {
        src: '/brand/threadlearn-mark.png',
        sizes: '256x256',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
