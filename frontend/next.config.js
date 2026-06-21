/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Allow connections from container environments */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL;
    console.log("Next.js rewrites: BACKEND_API_URL is configured as:", backendUrl);
    
    // Default fallback to local development port if not running in production
    const fallback = process.env.NODE_ENV === 'production' 
      ? 'https://choicetrace-backend-348569833323.us-central1.run.app/api' // Fallback to live backend in production to prevent self-looping
      : 'http://localhost:8080/api';

    const targetUrl = backendUrl && backendUrl.startsWith('http') ? backendUrl : fallback;
    console.log("Next.js rewrites: Using destination target:", targetUrl);

    return [
      {
        source: '/api/:path*',
        destination: `${targetUrl}/:path*`,
      },
    ]
  }
}

module.exports = nextConfig
