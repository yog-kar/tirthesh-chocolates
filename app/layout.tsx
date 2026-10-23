import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/cart/CartProvider";
import FloatingCart from "@/components/cart/FloatingCart";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tirthesh Chocolates | Crafted to Be Remembered",
  description:
    "Explore our chocolate collections, discover our story, and find something worth sharing.",
  keywords: [
    "Tirthesh Chocolates",
    "chocolate",
    "premium chocolates",
    "Jayanand Foods",
    "papad",
    "bulk chocolate orders",
    "wholesale food products",
  ],
  openGraph: {
    title: "Tirthesh Chocolates | Crafted to Be Remembered",
    description:
      "Explore our chocolate collections, discover our story, and find something worth sharing.",
    siteName: "Tirthesh Chocolates",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#261813",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
  <CartProvider>
    {children}
    <FloatingCart />
  </CartProvider>
</ClerkProvider>
      </body>
    </html>
  );
}