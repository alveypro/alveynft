require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    alveychain: {
      url: "https://elves-core1.alvey.io",
      accounts: [process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000"],
      chainId: 3797,
    },
  },
  paths: {
    sources: "./src/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./src/artifacts"
  }
};