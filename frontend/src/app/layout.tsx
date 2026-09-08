import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/state/store";
import { ThemeProvider } from "@/state/theme-provider";
import { ToastProvider } from "@/components/ui/Toast";
import { BRAND } from "@/lib/brand";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — ${BRAND.tagline}`, template: `%s · ${BRAND.name}` },
  description:
    "LVIGS Mart is India's trusted online marketplace for mobiles, electronics, fashion, grocery, beauty, home essentials and more. Free delivery, easy returns, secure payments.",
  keywords: [
    "online shopping",
    "ecommerce india",
    "mobiles",
    "electronics",
    "fashion",
    "grocery",
    "LVIGS Mart",
  ],
  applicationName: BRAND.name,
  authors: [{ name: BRAND.name }],
  creator: BRAND.legalName,
  metadataBase: new URL("https://lvigs.in"),
  alternates: { canonical: "/" },
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description:
      "Shop across mobiles, electronics, fashion, grocery and more with free delivery across India.",
    url: "https://lvigs.in",
    siteName: BRAND.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.name,
    description: BRAND.tagline,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c184a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <ToastProvider>
            <StoreProvider>
              {children}
            </StoreProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}