/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile leaflet for Next.js compatibility
  transpilePackages: ['leaflet', 'react-leaflet'],
};

export default nextConfig;
