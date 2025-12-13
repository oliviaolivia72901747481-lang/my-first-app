import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: "C:\\Users\\hn511\\Desktop\\hello-world"
  },
  // 配置重写规则，将请求重定向到 classroom 目录
  async rewrites() {
    return [
      {
        source: '/classroom/:path*',
        destination: '/classroom/:path*',
      },
      // 为教学功能创建友好的 URL
      {
        source: '/sign',
        destination: '/classroom/sign.html',
      },
      {
        source: '/vote',
        destination: '/classroom/vote.html',
      },
      {
        source: '/danmu',
        destination: '/classroom/danmu.html',
      },
      {
        source: '/buzzer',
        destination: '/classroom/buzzer.html',
      },
      {
        source: '/admin',
        destination: '/classroom/admin.html',
      },
      {
        source: '/sign-admin',
        destination: '/classroom/sign-admin.html',
      },
      {
        source: '/vote-admin',
        destination: '/classroom/vote-admin.html',
      },
      {
        source: '/danmu-admin',
        destination: '/classroom/danmu-admin.html',
      },
      {
        source: '/buzzer-admin',
        destination: '/classroom/buzzer-admin.html',
      },
      {
        source: '/lucky',
        destination: '/classroom/lucky.html',
      },
      {
        source: '/classroom',
        destination: '/classroom/index.html',
      },
    ];
  },
};

export default nextConfig;
