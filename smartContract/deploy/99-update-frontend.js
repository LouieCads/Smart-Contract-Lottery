const { ethers, deployments, network } = require("hardhat")
const fs = require("fs")

const FRONTEND_ADDRESSES_FILE = "../app/src/app/constants/contractAddresses.json"
const FRONTEND_ABI_FILE = "../app/src/app/constants/abi.json"

module.exports = async ({ getNamedAccounts }) => {
  if (process.env.UPDATE_FRONTEND) {
    console.log("Updating frontend...")
    await updateContractAddresses(getNamedAccounts)
    await updateAbi(getNamedAccounts)
    console.log("Frontend written!")
  }
}

async function updateAbi(getNamedAccounts) {
  const deployer = (await getNamedAccounts()).deployer
  const signer = await ethers.getSigner(deployer)
  const raffle = await ethers.getContractAt(
    "Raffle",
    (await deployments.get("Raffle")).address,
    signer,
  )

  fs.writeFileSync(FRONTEND_ABI_FILE, raffle.interface.formatJson())
}

async function updateContractAddresses(getNamedAccounts) {
  const deployer = (await getNamedAccounts()).deployer
  const signer = await ethers.getSigner(deployer)
  const raffle = await ethers.getContractAt(
    "Raffle",
    (await deployments.get("Raffle")).address,
    signer,
  )

  const chainId = network.config.chainId.toString()

  const contractAddresses = JSON.parse(fs.readFileSync(FRONTEND_ADDRESSES_FILE, "utf8"))

  if (chainId in contractAddresses) {
    if (!contractAddresses[chainId].includes(raffle.target)) {
      contractAddresses[chainId].push(raffle.target)
    }
  } else {
    contractAddresses[chainId] = [raffle.target]
  }
  fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(contractAddresses))
}

module.exports.tags = ["all", "frontend"]
