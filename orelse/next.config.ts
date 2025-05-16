// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  // You might have other configurations here already, like reactStrictMode
  // reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https', // Google user profile images are served over HTTPS
        hostname: 'lh3.googleusercontent.com',
        port: '', // Default port for HTTPS (443), so leave empty
        pathname: '/**', // Allow any path under this hostname
      },
      // You can add other patterns here if needed in the future
    ],
  },
};

export default nextConfig;