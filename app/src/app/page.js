"use client"

import Image from "next/image"
import Link from "next/link"
import Header from "./components/Header"
import LotteryEntrance from "./components/LotteryEntrance"

import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Header />
      <LotteryEntrance />
    </main>
  )
}
