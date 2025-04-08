const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { expect, assert } = require("chai")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Staging Test", async () => {
      let raffle,
        deployer,
        entranceFee = ethers.parseEther("0.05")

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        signer = await ethers.getSigner(deployer)

        raffle = await ethers.getContractAt(
          "Raffle",
          (await deployments.get("Raffle")).address,
          signer,
        )
        interval = await raffle.getInterval()
      })

      describe("fulfillRandomWords", () => {
        it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async () => {
          // Enter the raffle
          const startingTimeStamp = await raffle.getLatestTimestamp()
          const accounts = await ethers.getSigners()

          // Set up a listener before we enter a raffle
          // Just in case the blockchain moves REALLY fast
          await new Promise(async (resolve, reject) => {
            raffle.once("WinnerPicked", async () => {
              console.log("WinnerPicked event fired!")

              try {
                const recentWinner = await raffle.getRecentWinner()
                const raffleState = await raffle.getRaffleState()
                const winnerEndingBalance = await ethers.provider.getBalance(accounts[0].address)
                const endingTimeStamp = await raffle.getLatestTimestamp()

                await expect(raffle.getPlayer(0)).to.be.reverted
                assert.equal(recentWinner.toString(), accounts[0].address)
                assert.equal(raffleState, 0)
                const balanceDifference = winnerEndingBalance - winnerStartingBalance
                assert(
                  balanceDifference >= -ethers.parseEther("0.001") &&
                    balanceDifference <= ethers.parseEther("0.001"),
                  "Balance difference should be minimal",
                )
                assert(endingTimeStamp > startingTimeStamp)

                resolve()
              } catch (e) {
                console.log(e)
                reject(e)
              }
            })

            await raffle.enterRaffle({ value: entranceFee })
            const winnerStartingBalance = await ethers.provider.getBalance(accounts[0].address)
          })
        })
      })
    })
