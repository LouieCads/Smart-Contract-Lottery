// components/Header.js
"use client"

import React, { useState } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
// import { useConnect, useAccount, useDisconnect } from "wagmi"
// import { injected } from "wagmi/connectors"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"

export default function Header() {
  // const { connect, isPending } = useConnect() // Connection
  // const { address, isConnected } = useAccount() // Wallet Details
  // const { disconnect } = useDisconnect() // Disconnect
  // const [showDisconnectModal, setShowDisconnectModal] = useState(false)

  // const handleConnect = async () => {
  //   if (isConnected) {
  //     setShowDisconnectModal(true)
  //   } else {
  //     connect({ connector: injected() })
  //   }
  // }

  // const handleDisconnect = async () => {
  //   disconnect()
  //   setShowDisconnectModal(false)
  // }

  // const closeModal = async () => {
  //   setShowDisconnectModal(false)
  // }

  return (
    <div className="flex items-center justify-between px-15 py-5 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
      <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Decentralize Lottery
      </p>
      <ConnectButton
        label="Connect"
        accountStatus="address"
        chainStatus="icon"
        showBalance={false}
      />
      {/* <Button onClick={handleConnect} disabled={isPending} className="cursor-pointer">
        {isPending
          ? "Connecting..."
          : isConnected
            ? `${address?.substring(0, 6)}...${address?.substring(address.length - 4)}` 
            : "Connect Wallet"}
      </Button>

      {showDisconnectModal && (
        <Dialog open={true} onOpenChange={closeModal}>
          <DialogContent className=" flex items-center gap-15">
            <DialogHeader>
              <DialogTitle>Connected</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              {address?.substring(0, 6)}...${address?.substring(address.length - 4)}
            </DialogDescription>
            <DialogFooter>
              <Button className="hover:bg-[#E57373] cursor-pointer" variant="destructive" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )} */}
    </div>
  )
}
