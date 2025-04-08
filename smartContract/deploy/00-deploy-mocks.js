const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

const BASE_FEE = ethers.parseEther("0.3"); // 0.25 LINK in wei (BigInt)
const GAS_PRICE_LINK = ethers.toBigInt(1e9); // 0.000000001 LINK per gas (BigInt)
const WEI_PER_UNIT_LINK = ethers.parseEther("0.1"); // 0.005 LINK in wei (BigInt)

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...");
    try {
      // If VRFCoordinatorV2_5Mock is from an external package, specify the contract field
      await deploy("VRFCoordinatorV2_5Mock", {
        contract: "VRFCoordinatorV2_5Mock",
        from: deployer,
        log: true,
        args: [BASE_FEE, GAS_PRICE_LINK, WEI_PER_UNIT_LINK],
      });

      log("----------------------------------------------------------");
    } catch (error) {
      console.error("❌ Deployment failed with error:", error.message);
      console.error("🔍 Stack trace:", error.stack);
    }
  }
};

module.exports.tags = ["all", "mocks"];
