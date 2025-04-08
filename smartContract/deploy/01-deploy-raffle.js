const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const FUND_AMOUNT = ethers.parseEther("10")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId
  let vrfCoordinatorV2_5Address, subscriptionId, vrfCoordinatorV2_5Mock, signer

  if (developmentChains.includes(network.name)) {
    log("Deploying...")
    const vrfCoordinatorV2_5MockDeployment = await deployments.get("VRFCoordinatorV2_5Mock")
    vrfCoordinatorV2_5Address = vrfCoordinatorV2_5MockDeployment.address
    // console.log("vrfCoordinatorV2_5 Mock:", vrfCoordinatorV2_5Address)

    signer = await ethers.getSigner(deployer)

    vrfCoordinatorV2_5Mock = await ethers.getContractAt(
      "VRFCoordinatorV2_5Mock",
      vrfCoordinatorV2_5Address,
      signer,
    )

    // Create a new subscription
    const transactionResponse = await vrfCoordinatorV2_5Mock.createSubscription()
    const transactionReceipt = await transactionResponse.wait()
    subscriptionId = transactionReceipt.logs[0].args[0]
    // console.log("Transaction Logs:", transactionReceipt.logs)

    // Fund the subscription
    // console.log("Subscription Id:  ", subscriptionId)
    await vrfCoordinatorV2_5Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
  } else {
    vrfCoordinatorV2_5Address = networkConfig[chainId]["vrfCoordinatorV2_5"]
    subscriptionId = networkConfig[chainId]["subscriptionId"]
  }

  const args = [
    vrfCoordinatorV2_5Address,
    networkConfig[chainId]["entranceFee"],
    networkConfig[chainId]["keyHash"],
    subscriptionId,
    networkConfig[chainId]["callbackGasLimit"],
    networkConfig[chainId]["interval"],
  ]

  const raffle = await deploy("Raffle", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })

  // If we are on a development chain, add the raffle contract as a consumer to the VRF mock
  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContractAt(
      "VRFCoordinatorV2_5Mock",
      vrfCoordinatorV2_5Address,
      signer,
    )
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address)

    log("Consumer is added")
  }

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying...")
    await verify(raffle.address, args)
  }
  log("---------------------------------------------------------------")
}

module.exports.tags = ["all", "raffle"]
