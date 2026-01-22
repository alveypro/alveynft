const fs = require('fs');
const path = require('path');
const solc = require('solc');

const contractPath = path.resolve(__dirname, '../src/contracts/AlveyNFT.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'AlveyNFT.sol': { content: source }
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

const contract = output.contracts['AlveyNFT.sol'].AlveyNFT;
const artifact = {
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`
};

const outPath = path.resolve(__dirname, '../src/contracts/AlveyNFT.artifact.json');
fs.writeFileSync(outPath, JSON.stringify(artifact, null, 2));
console.log('Wrote', outPath);
