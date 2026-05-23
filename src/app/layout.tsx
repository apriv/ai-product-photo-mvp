import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AccessGate from "@/components/AccessGate";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "电商商品图助手",
  description:
    "基于 AI 的图片处理工具，帮助电商卖家快速生成高质量的商品主图和详情图。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AccessGate>{children}</AccessGate>
      </body>
    </html>
  );
}
