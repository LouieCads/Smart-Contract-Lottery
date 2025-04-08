const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { expect, assert } = require("chai")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", () => {
      let raffle,
        vrfCoordinatorV2_5Mock,
        deployer,
        interval,
        entranceFee = ethers.parseEther("0.05")
      const chainId = network.config.chainId

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        signer = await ethers.getSigner(deployer)

        raffle = await ethers.getContractAt(
          "Raffle",
          (await deployments.get("Raffle")).address,
          signer,
        )
        interval = await raffle.getInterval()
        // console.log("Contract Address:", raffle.target)

        vrfCoordinatorV2_5Mock = await ethers.getContractAt(
          "VRFCoordinatorV2_5Mock",
          (await deployments.get("VRFCoordinatorV2_5Mock")).address,
          signer,
        )
      })

      describe("constructor", () => {
        it("initializes the raffle correctly", async () => {
          const raffleState = await raffle.getRaffleState()

          assert.equal(raffleState.toString(), "0")
          assert.equal(interval.toString(), networkConfig[chainId]["interval"])
        })
      })

      describe("enterRaffle", () => {
        it("reverts when you don't pay enough ETH", async () => {
          await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
            raffle,
            "Raffle__NotEnoughETH",
          )
        })
        it("records player when they enter", async () => {
          await raffle.enterRaffle({ value: entranceFee })
          const playerFromContract = await raffle.getPlayer(0)

          assert.equal(playerFromContract, deployer)
        })
        it("emits event on enter", async () => {
          await expect(raffle.enterRaffle({ value: entranceFee })).to.emit(raffle, "RaffleEnter")
        })
        it("reverts when Raffle State is calculating", async () => {
          await raffle.enterRaffle({ value: entranceFee })

          // We need to set up a scenario where the raffle is in CALCULATING state
          // This happens when performUpkeep is called
          // First, let's manipulate the blockchain to pass the time needed for checkUpkeep
          await network.provider.send("evm_increaseTime", [parseInt(interval) + 1])
          await network.provider.send("evm_mine", [])

          // Pretend to be a Chainlink Keeper to change the state to CALCULATING
          await raffle.performUpkeep("0x")

          const raffleState = await raffle.getRaffleState()
          await expect(raffle.enterRaffle({ value: entranceFee })).to.be.revertedWithCustomError(
            raffle,
            "Raffle__NotOpen",
          )
        })
      })

      describe("checkUpkeep", () => {
        it("returns false if people haven't sent any ETH", async () => {
          await network.provider.send("evm_increaseTime", [parseInt(interval) + 1])
          await network.provider.send("evm_mine", [])
          const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x")
          assert(!upkeepNeeded)
        })
        it("returns false if raffle isn't open", async () => {
          await raffle.enterRaffle({ value: entranceFee })
          await network.provider.send("evm_increaseTime", [parseInt(interval) + 1])
          await network.provider.send("evm_mine", [])
          await raffle.performUpkeep("0x")
          const raffleState = await raffle.getRaffleState()
          const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x")

          assert.equal(raffleState.toString(), "1")
          assert.equal(upkeepNeeded, false)
        })
        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: entranceFee })
          await network.provider.send("evm_increaseTime", [parseInt(interval) / 2])
          await network.provider.send("evm_mine", [])
          const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x")

          assert(!upkeepNeeded)
        })
        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await raffle.enterRaffle({ value: entranceFee })
          await network.provider.send("evm_increaseTime", [parseInt(interval) + 1])
          await network.provider.send("evm_mine", [])
          const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x")
          assert(upkeepNeeded)
        })
      })

      describe("performUpkeep", () => {
        it("can only run if checkUpkeep is true", async () => {
          await raffle.enterRaffle({ value: entranceFee })
          await network.provider.send("evm_increaseTime", [parseInt(interval) + 1])
          await network.provider.send("evm_mine", [])
          const tx = await raffle.performUpkeep("0x")
          assert(tx)
        })
        it("reverts when checkUpkeep is false", async () => {
          await expect(raffle.performUpkeep("0x")).to.be.revertedWithCustomError(
            raffle,
            "Raffle__UpKeepNotNeeded",
          )
        })
        it("updates the raffle state, emits the event, and calls the vrf coordinator", async () => {
          await raffle.enterRaffle({ value: entranceFee })
          await network.provider.send("evm_increaseTime", [parseInt(interval) + 1])
          await network.provider.send("evm_mine", [])
          const txResponse = await raffle.performUpkeep("0x")
          const txReceipt = await txResponse.wait(1)
          const requestId = txReceipt.logs[1].args[0]
          const raffleState = await raffle.getRaffleState()

          assert(Number(requestId.toString()) > 0)
          assert(raffleState.toString() == "1")
        })
      })

      describe("fulfillRandomWords", () => {
        beforeEach(async () => {
          await raffle.enterRaffle({ value: entranceFee })
          await network.provider.send("evm_increaseTime", [parseInt(interval) + 1])
          await network.provider.send("evm_mine", [])
        })
        it("can only be called after performUpkeep", async () => {
          await expect(
            vrfCoordinatorV2_5Mock.fulfillRandomWords(0, await raffle.getAddress()),
          ).to.be.revertedWithCustomError(vrfCoordinatorV2_5Mock, "InvalidRequest")
          await expect(
            vrfCoordinatorV2_5Mock.fulfillRandomWords(1, await raffle.getAddress()),
          ).to.be.revertedWithCustomError(vrfCoordinatorV2_5Mock, "InvalidRequest")
        })
        it("picks a winner, resets the lottery, and sends money", async () => {
          // Add additional participants
          const additionalEntrants = 3
          const startingAccountIndex = 1 // Deployer is 0
          const accounts = await ethers.getSigners()
          let winnerStartingBalance

          // Add additional players to the raffle
          for (let i = startingAccountIndex; i < startingAccountIndex + additionalEntrants; i++) {
            const accountConnectedRaffle = raffle.connect(accounts[i])
            await accountConnectedRaffle.enterRaffle({ value: entranceFee })
          }

          const startingTimeStamp = await raffle.getLatestTimestamp()

          // performUpkeep (mock being Chainlink Keepers)
          // fulfillRandomWords (mock being the Chainlink VRF)
          // We will have to wait for the fulfillRandomWords to be called

          // Set up a listener for the WinnerPicked event
          await new Promise(async (resolve, reject) => {
            // Setup listener before we fire the event
            raffle.once("WinnerPicked", async () => {
              // console.log("WinnerPicked event fired!")

              try {
                // Get the lottery data after winner is picked
                const recentWinner = await raffle.getRecentWinner()
                const raffleState = await raffle.getRaffleState()
                const endingTimeStamp = await raffle.getLatestTimestamp()
                const numPlayers = await raffle.getNumOfPlayers()
                const winnerEndingBalance = await ethers.provider.getBalance(recentWinner)

                await expect(raffle.getPlayer(0)).to.be.reverted
                // Assertions
                assert.equal(numPlayers.toString(), "0")
                assert.equal(raffleState.toString(), "0")
                assert(endingTimeStamp > startingTimeStamp)
                assert.equal(
                  winnerEndingBalance.toString(),
                  (winnerStartingBalance + entranceFee * BigInt(additionalEntrants + 1)).toString(),
                )

                resolve()
              } catch (e) {
                reject(e)
              }
            })

            try {
              // Fire the event by calling performUpkeep and fulfillRandomWords
              const tx = await raffle.performUpkeep("0x")
              const txReceipt = await tx.wait(1)
              winnerStartingBalance = await ethers.provider.getBalance(accounts[1].address)

              // VRF coordinator fulfills the random words request
              await vrfCoordinatorV2_5Mock.fulfillRandomWords(
                txReceipt.logs[1].args[0],
                await raffle.getAddress(),
              )
            } catch (e) {
              reject(e)
            }
          })
        })
        // it("", async () => {})
        // it("", async () => {})
      })
    })
