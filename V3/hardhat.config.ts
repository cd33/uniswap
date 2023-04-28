import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const ALCHEMY_MAINNET = process.env.ALCHEMY_MAINNET || "";

const DEFAULT_COMPILER_SETTINGS = {
  version: "0.7.6",
  settings: {
    evmVersion: "istanbul",
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
};

const config: HardhatUserConfig = {
  // solidity: "0.7.6",
  solidity: {
    compilers: [DEFAULT_COMPILER_SETTINGS],
  },
  networks: {
    hardhat: {
      forking: {
        url: ALCHEMY_MAINNET,
        blockNumber: 17144228,
      },
    },
  },
};

export default config;
