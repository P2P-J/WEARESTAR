import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "밤하늘의 별 · 오늘의 일기장",
  description: "매일 자정, 새 일기장이 열린다. 단 열 사람만 한 줄을 남길 수 있다.",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  openGraph: {
    title: "밤하늘의 별",
    description: "매일 자정, 새 일기장이 열린다. 단 열 사람만 한 줄을 남길 수 있다.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0d3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&family=Noto+Serif+KR:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="bg-stars" aria-hidden />
        <div className="layer">{children}</div>
      </body>
    </html>
  );
}
