require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/hxlqvBRmME0ji1uulFWBrc72fCMUovy_",
      accounts: ["47f80bcf8a6eb9ea70b594b2d2c8971c108f5f584f15c8c49de55ef7a5e7451d"],
    },
  },
};
