/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'upload.wikimedia.org',
      'images.unsplash.com',
      'raw.githubusercontent.com'
    ],
    unoptimized: true,
  },
  output: 'export',
  distDir: 'out',
} 