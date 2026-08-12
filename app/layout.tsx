import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AccountBar } from "@/app/components/AccountNav/AccountBar";
import { Footer } from "@/app/components/Footer";
import { NoScriptAlert } from "@/app/components/NoScriptAlert";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "創作展2026",
  description: "東京都立小石川中等教育学校 創作展2026 トップページ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NoScriptAlert />
        <AccountBar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
