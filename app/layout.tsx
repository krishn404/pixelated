import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

import { Fjalla_One as Font_Fjalla_One, Inconsolata as Font_Inconsolata } from 'next/font/google'

// Initialize fonts
const _fjallaOne = Font_Fjalla_One({ subsets: ['latin'], weight: ["400"] })
const _inconsolata = Font_Inconsolata({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })

export const metadata: Metadata = {
  title: "Pixelator – Image Pixelation Utility",
  description: "Simple, fast image pixelation tool with live preview and download",
  generator: "pixalated.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-mono antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
