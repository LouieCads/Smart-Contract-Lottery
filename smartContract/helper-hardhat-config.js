const { ethers } = require("hardhat");

const networkConfig = {
  11155111: {
    name: "sepolia",
    vrfCoordinatorV2_5: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B", // Updated to v2.5 coordinator address
    entranceFee: ethers.parseEther("0.01"),
    keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", // Updated to v2.5 coordinator address
    subscriptionId: "32699451903823230955203907517638843816028071403243155904192078460296153070616",
    callbackGasLimit: "500000",
    interval: "30",
  },
  31337: {
    name: "hardhat",
    entranceFee: ethers.parseEther("0.01"),
    keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", // Updated to v2.5 coordinator address
    callbackGasLimit: "500000",
    interval: "30",
  },
}

const developmentChains = ["hardhat", "localhost"];

module.exports = {
  networkConfig,
  developmentChains,
};
