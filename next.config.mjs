/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co", pathname: "/image/**" },
      { protocol: "https", hostname: "mosaic.scdn.co", pathname: "/**" },
      // Playlist covers (user-uploaded and generated mosaics) come from
      // regional CDN hosts like image-cdn-ak.spotifycdn.com
      { protocol: "https", hostname: "*.spotifycdn.com", pathname: "/image/**" },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
