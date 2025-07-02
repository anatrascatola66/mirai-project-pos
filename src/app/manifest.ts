import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mirai Project POS - Modern Point of Sale System',
    short_name: 'Mirai POS',
    description: 'Professional POS system with inventory management, PWA support, and modern design. Built for retail businesses by Mirai Project.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#8B5CF6',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'id',
    categories: ['business', 'productivity', 'shopping'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any'
      }
    ],
    screenshots: [
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'narrow'
      }
    ],
    shortcuts: [
      {
        name: 'Kasir',
        short_name: 'Kasir',
        description: 'Buka sistem kasir',
        url: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192'
          }
        ]
      },
      {
        name: 'Admin Panel',
        short_name: 'Admin',
        description: 'Buka panel admin',
        url: '/admin',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192'
          }
        ]
      }
    ],
    related_applications: [],
    prefer_related_applications: false,
    display_override: ['window-controls-overlay', 'standalone'],
    edge_side_panel: {
      preferred_width: 480
    }
  }
}
