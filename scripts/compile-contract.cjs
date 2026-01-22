const fs = require('fs');
const path = require('path');
const solc = require('solc');

const nftPath = path.resolve(__dirname, '../src/contracts/AlveyNFT.sol');
const marketPath = path.resolve(__dirname, '../src/contracts/AlveyMarketplace.sol');
const nftSource = fs.readFileSync(nftPath, 'utf8');
const marketSource = fs.readFileSync(marketPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'AlveyNFT.sol': { content: nftSource },
    'AlveyMarketplace.sol': { content: marketSource }
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: 'paris',
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object']
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
if (output.errors?.length) {
  const errors = output.errors.filter((err) => err.severity === 'error');
  if (errors.length) {
    console.error(errors);
    process.exit(1);
  }
}

const nftContract = output.contracts['AlveyNFT.sol'].AlveyNFT;
const nftArtifact = {
  abi: nftContract.abi,
  bytecode: `0x${nftContract.evm.bytecode.object}`
};

const nftOutPath = path.resolve(__dirname, '../src/contracts/AlveyNFT.artifact.json');
fs.writeFileSync(nftOutPath, JSON.stringify(nftArtifact, null, 2));
console.log('Wrote', nftOutPath);

const marketContract = output.contracts['AlveyMarketplace.sol'].AlveyMarketplace;
const marketArtifact = {
  abi: marketContract.abi,
  bytecode: `0x${marketContract.evm.bytecode.object}`
};

const marketOutPath = path.resolve(__dirname, '../src/contracts/AlveyMarketplace.artifact.json');
fs.writeFileSync(marketOutPath, JSON.stringify(marketArtifact, null, 2));
console.log('Wrote', marketOutPath);
