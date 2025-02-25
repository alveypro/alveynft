import { getContract } from 'viem'
import { useContractWrite, useContractRead } from 'wagmi'

// NFT合约配置
export const NFT_CONFIG = {
  address: process.env.VITE_CONTRACT_ADDRESS,
  abi: [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "tokenURI",
          "type": "string"
        }
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "mintPrice",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "name": "mintedWallets",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    }
  ]
}

// 合约读取hooks
export function useNFTMintPrice() {
  return useContractRead({
    ...NFT_CONFIG,
    functionName: 'mintPrice',
    watch: true
  })
}

export function useNFTMintedCount(address) {
  return useContractRead({
    ...NFT_CONFIG,
    functionName: 'mintedWallets',
    args: [address],
    watch: true,
    enabled: Boolean(address)
  })
}

// 合约写入hooks
export function useNFTMint() {
  return useContractWrite({
    ...NFT_CONFIG,
    functionName: 'mint'
  })
}