import type { Metadata } from "next";
import { Outfit, Inter, Bebas_Neue } from "next/font/google";
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
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} ${bebasNeue.variable} antialiased font-sans bg-white text-gray-900 min-h-screen`}>
        <NextAuthSessionProvider>
          <div className="min-h-screen flex flex-col bg-white pb-20">
            {children}
            <FooterNav />
          </div>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
