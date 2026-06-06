import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KMTP — 한국 의료관광 신뢰 플랫폼",
  description:
    "가격잠금 견적부터 에스크로 결제, 검증된 후기까지 — 안심하고 받는 한국 의료관광",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
