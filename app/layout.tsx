import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

import { Fjalla_One, Inconsolata } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const fjallaOne = Fjalla_One({
  subsets: ["latin"],
  weight: ["400"],
})

const inconsolata = Inconsolata({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "Pix – turn images into pixalated image",
  description: "Simple, fast image pixelation tool with live preview and download",
  generator: "pix.krixnx.xyz",

  icons: {
    icon: "/PIX.png",
    apple: "/PIX.png",
  },

  openGraph: {
    title: "Pix – turn images into pixalated image",
    description: "Simple, fast image pixelation tool with live preview and download",
    url: "https://pix.krixnx.xyz",
    siteName: "Pixelator",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Pixelator – Image Pixelation Utility",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Pix – turn images into pixalated image",
    description: "Simple, fast image pixelation tool with live preview and download",
    images: ["/og-image.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-mono antialiased ${fjallaOne.className} ${inconsolata.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
