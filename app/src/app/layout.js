// app/layout.js
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { App } from "./providers"
import { Toaster } from "react-hot-toast"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "Lottery",
  description: "Smart Contract Lottery",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <App>
          {children}
          <Toaster position="top-right" richColors />
        </App>
      </body>
    </html>
  )
}
