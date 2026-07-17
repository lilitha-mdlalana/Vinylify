import { Fraunces, Geist_Mono, Inter, Outfit } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils";

const outfitHeading = Outfit({subsets:['latin'],variable:'--font-heading'});

const frauncesDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz"],
});

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn("dark antialiased", fontMono.variable, "font-sans", inter.variable, outfitHeading.variable, frauncesDisplay.variable)}
    >
      <body className="flex min-h-svh flex-col">
        {children}
      </body>
    </html>
  )
}
