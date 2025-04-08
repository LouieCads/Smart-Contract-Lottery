// components/Header.js
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  useAccount,
  useWriteContract,
  useChainId,
  useReadContract,
  useWatchContractEvent,
} from "wagmi"
import { formatEther } from "viem"
import { contractAddresses, abi } from "../constants"
import toast from "react-hot-toast"

export default function LotteryEntrance() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId.toString()][0]

  const { data: entranceFee, isLoading: isFeeLoading } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "getEntranceFee",
  })

  const { data: numOfPlayers, isLoading: isNumOfPlayersLoading } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "getNumOfPlayers",
  })

  const { data: recentWinner, isLoading: isRecentWinnerLoading } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "getRecentWinner",
  })

  const { data, isLoading, isSuccess, isError, isPending, writeContract } = useWriteContract({
    onSuccess: () => {
      toast.success("Raffle entered successfully")
    },
    onError: () => {
      toast.error("Rejected entering the raffle")
    },
  })

  const handleEnterRaffle = () => {
    try {
      if (!contractAddress) {
        toast.error("Please switch to the correct network")
        return
      }

      if (!entranceFee) {
        toast.error("Entrance fee not available")
        return
      }

      writeContract({
        address: contractAddress,
        abi: abi,
        functionName: "enterRaffle",
        value: entranceFee,
        chainId: chainId,
      })
    } catch (error) {
      toast.error("Error entering raffle")
      console.error("Error entering raffle:", error)
    }
  }

  const handleSuccessToast = () => {
    toast.success("Raffle entered successfully")
  }
  const handleErrorToast = () => {
    toast.error("Rejected entering the raffle")
  }

  return (
    <div className="px-15 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Welcome to the Lottery</h1>
      {isConnected ? (
        <div className="space-y-4">
          <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg space-y-4">
            <p className="flex justify-between items-center text-gray-300">
              <span className="font-semibold">Entrance Fee:</span>
              {isFeeLoading ? (
                <span className="animate-pulse text-gray-400">Fetching fee...</span>
              ) : (
                <span className="text-blue-400">{formatEther(entranceFee || 0n)} ETH</span>
              )}
            </p>
            <p className="flex justify-between items-center text-gray-300">
              <span className="font-semibold">Number of Players:</span>
              {isNumOfPlayersLoading ? (
                <span className="animate-pulse text-gray-400">Fetching players...</span>
              ) : (
                <span className="text-purple-400">{numOfPlayers?.toString() || "0"}</span>
              )}
            </p>
            <p className="flex justify-between items-center text-gray-300">
              <span className="font-semibold">Recent Winner:</span>
              {isRecentWinnerLoading ? (
                <span className="animate-pulse text-gray-400">Fetching winner...</span>
              ) : (
                <span className="text-green-400">
                  {recentWinner
                    ? `${recentWinner.slice(0, 6)}...${recentWinner.slice(-4)}`
                    : "None"}
                </span>
              )}
            </p>
            <Button
              onClick={handleEnterRaffle}
              disabled={isLoading || !entranceFee || isFeeLoading || isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isPending ? (
                <div className="animate-spin spinner-border h-6 w-6 border-b-2 rounded-full border-white"></div>
              ) : (
                "Enter Raffle"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-center">Please connect your wallet</p>
      )}
      {isSuccess && handleSuccessToast()}
      {isError && handleErrorToast()}
    </div>
  )
}
