import { Geist_Mono, Inter, Outfit } from "next/font/google"

import "./globals.css"
import { AppFloatingDock } from "@/components/app-floating-dock"
import Navbar from "@/components/navbar/navbar"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const outfitHeading = Outfit({subsets:['latin'],variable:'--font-heading'});

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
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable, outfitHeading.variable)}
    >
      <body className="flex min-h-svh flex-col pb-28 ">
        <ThemeProvider>
          <Navbar />   
          {children}
          <AppFloatingDock />
        </ThemeProvider>
      </body>
    </html>
  )
}
