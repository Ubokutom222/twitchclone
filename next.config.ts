import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ek3c4hzapb.ufs.sh",
        pathname: "/f/**",
      },
    ],
  },
};

export default nextConfig;
