import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "AutoSocial — Admin Panel",
    template: "%s | AutoSocial",
  },
  description: "Social media page automation and publishing management",
  robots: { index: false, follow: false },
};

import { Suspense } from "react";
import { RouteProgressBar } from "@/components/ui/route-progress-bar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="bg-gray-950 text-white antialiased">
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "#1a1a2e",
              border: "1px solid rgba(139, 92, 246, 0.2)",
            },
          }}
        />
      </body>
    </html>
  );
}
