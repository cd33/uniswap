import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config"

const ALCHEMY_MAINNET = process.env.ALCHEMY_MAINNET || "";

const config: HardhatUserConfig = {
  solidity: "0.7.6",
  networks: {
    hardhat: {
      forking: {
        url: ALCHEMY_MAINNET,
      }
    }
  }
};

export default config;
