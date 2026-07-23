import type { Metadata } from "next";
import { Outfit, Inter, Bebas_Neue, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "@/components/SessionProvider";
import FooterNav from "@/components/FooterNav";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "SHARKS SCORE APP | 少年サッカー試合記録・速報",
  description: "SHARKSの試合スコアをリアルタイムで記録・共有するための共有アプリです。",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning className={`${inter.variable} ${outfit.variable} ${bebasNeue.variable} ${notoSansJp.variable}`}>
      <body className="antialiased font-sans text-gray-900 min-h-screen">
        <NextAuthSessionProvider>
          <div className="app-screen flex flex-col pb-20">
            {children}
            <FooterNav />
          </div>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
