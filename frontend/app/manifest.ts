import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hackathon',
    short_name: 'Hackathon',
    description: 'Join hackathons, form a team, and submit your project.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafb',
    theme_color: '#6366f1',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
