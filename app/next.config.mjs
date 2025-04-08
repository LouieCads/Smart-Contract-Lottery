/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ant-design", "antd", "rc-util", "rc-pagination", "rc-picker"],
  output: "export",
}

export default nextConfig
