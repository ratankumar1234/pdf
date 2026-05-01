require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");

const optimizerEnabled = process.env.DISABLE_OPTIMIZER !== "true";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: optimizerEnabled,
        runs: 200
      }
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    noColors: true,
    showTimeSpent: true
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: process.env.DISABLE_OPTIMIZER === "true"
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  }
};
