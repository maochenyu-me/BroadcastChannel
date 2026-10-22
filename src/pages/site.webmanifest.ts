import type { APIRoute } from 'astro'
import { getChannelInfo } from '../lib/telegram'

const MANIFEST_THEME_COLOR = '#ffffff'
const FALLBACK_MANIFEST_NAME = 'BroadcastChannel'

export const GET: APIRoute = async () => {
  const channel = await getChannelInfo()
  const siteName = channel.title || FALLBACK_MANIFEST_NAME

  const manifest = {
    id: '/',
    name: siteName,
    short_name: siteName,
    start_url: '/',
    scope: '/',
    icons: [
      {
        src: 'favicon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'favicon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    theme_color: MANIFEST_THEME_COLOR,
    background_color: MANIFEST_THEME_COLOR,
    display: 'standalone',
  }

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
