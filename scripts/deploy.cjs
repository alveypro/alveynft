const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const AlveyNFT = await ethers.getContractFactory("AlveyNFT");
  const alveyNFT = await AlveyNFT.deploy();
  await alveyNFT.waitForDeployment();

  const contractAddress = await alveyNFT.getAddress();
  console.log("AlveyNFT deployed to:", contractAddress);

  // 更新.env文件中的合约地址
  const envPath = path.resolve(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(
    /^VITE_CONTRACT_ADDRESS=.*/m,
    `VITE_CONTRACT_ADDRESS=${contractAddress}`
  );
  fs.writeFileSync(envPath, envContent);

  console.log('Contract address has been updated in .env file');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});