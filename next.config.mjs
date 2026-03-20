/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co", pathname: "/image/**" },
      { protocol: "https", hostname: "mosaic.scdn.co", pathname: "/**" },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
