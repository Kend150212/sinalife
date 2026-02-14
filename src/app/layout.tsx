import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrintPro USA | Custom Printing Services",
  description:
    "Premium custom printing services for businesses and individuals. Business cards, flyers, banners, and more. Fast turnaround, competitive pricing.",
  keywords: ["printing", "custom printing", "business cards", "flyers", "banners", "signs", "promotional products"],
  openGraph: {
    title: "PrintPro USA | Custom Printing Services",
    description: "Premium custom printing services. Business cards, flyers, banners, and more.",
    type: "website",
    siteName: "PrintPro USA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable}`} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', margin: 0 }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

