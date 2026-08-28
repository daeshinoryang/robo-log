import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const socialImage = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'ROBO-LOG: 물류센터 로봇 관제실',
  description: '이진법과 비둘기집 원리로 물류 로봇 문제를 해결하는 반응형 교육 시뮬레이터',
  openGraph: {
    title: 'ROBO-LOG: 물류센터 로봇 관제실',
    description: '이진법 × 비둘기집 원리 교육 시뮬레이터',
    images: [{ url: socialImage, width: 1200, height: 630, alt: 'ROBO-LOG 물류센터 로봇 관제실' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ROBO-LOG: 물류센터 로봇 관제실',
    description: '이진법 × 비둘기집 원리 교육 시뮬레이터',
    images: [socialImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

