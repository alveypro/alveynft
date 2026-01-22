import { useContractWrite, useContractRead } from 'wagmi'

// NFT合约配置
export const NFT_CONFIG = {
  abi: [
    {
      "inputs": [],
      "name": "maxMintsPerWallet",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "paymentToken",
      "outputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [{ "internalType": "uint8", "name": "phase", "type": "uint8" }],
      "name": "setSalePhase",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address[]", "name": "accounts", "type": "address[]" },
        { "internalType": "bool", "name": "allowed", "type": "bool" }
      ],
      "name": "setAllowlist",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "string", "name": "baseURI_", "type": "string" }],
      "name": "setBaseURI",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "string", "name": "hiddenURI_", "type": "string" }],
      "name": "setHiddenURI",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "bool", "name": "revealed_", "type": "bool" }],
      "name": "setRevealed",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint8", "name": "tier", "type": "uint8" },
        { "internalType": "uint256", "name": "price", "type": "uint256" }
      ],
      "name": "setTierPrice",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint8", "name": "tier", "type": "uint8" },
        { "internalType": "uint256", "name": "supply", "type": "uint256" }
      ],
      "name": "setTierSupply",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "maxMints_", "type": "uint256" }],
      "name": "setMaxMintsPerWallet",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "receiver", "type": "address" },
        { "internalType": "uint96", "name": "bps", "type": "uint96" }
      ],
      "name": "setRoyalty",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "to", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }],
      "name": "burn",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [{
        "internalType": "address",
        "name": "",
        "type": "address"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "salePhase",
      "outputs": [{
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
      "name": "isAllowlisted",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "revealed",
      "outputs": [{
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalMinted",
      "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint8",
          "name": "tier",
          "type": "uint8"
        },
        {
          "internalType": "string",
          "name": "tokenURI",
          "type": "string"
        }
      ],
      "name": "mintWithTier",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "to", "type": "address" },
        { "internalType": "uint8", "name": "tier", "type": "uint8" },
        { "internalType": "string", "name": "tokenURI", "type": "string" }
      ],
      "name": "ownerMint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }],
      "name": "tierPrices",
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
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }],
      "name": "tierSupply",
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
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }],
      "name": "tierMinted",
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
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }],
      "name": "tokenTier",
      "outputs": [{
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }],
      "name": "tokenURI",
      "outputs": [{
        "internalType": "string",
        "name": "",
        "type": "string"
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
export function useNFTMaxMints(contractAddress, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'maxMintsPerWallet',
    watch: true,
    enabled: Boolean(contractAddress) && enabled
  })
}

export function useNFTPaymentToken(contractAddress, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'paymentToken',
    watch: true,
    enabled: Boolean(contractAddress) && enabled
  })
}

export function useNFTOwner(contractAddress, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'owner',
    watch: true,
    enabled: Boolean(contractAddress) && enabled
  })
}

export function useNFTSalePhase(contractAddress, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'salePhase',
    watch: true,
    enabled: Boolean(contractAddress) && enabled
  })
}

export function useNFTAllowlisted(contractAddress, account, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'isAllowlisted',
    args: [account],
    watch: true,
    enabled: Boolean(contractAddress && account) && enabled
  })
}

export function useNFTRevealed(contractAddress, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'revealed',
    watch: true,
    enabled: Boolean(contractAddress) && enabled
  })
}

export function useNFTTierPrice(contractAddress, tier, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'tierPrices',
    args: [tier],
    watch: true,
    enabled: Boolean(contractAddress) && enabled
  })
}

export function useNFTTierSupply(contractAddress, tier, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'tierSupply',
    args: [tier],
    watch: true,
    enabled: Boolean(contractAddress) && enabled
  })
}

export function useNFTTierMinted(contractAddress, tier, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'tierMinted',
    args: [tier],
    watch: true,
    enabled: Boolean(contractAddress) && enabled
  })
}

export function useNFTTotalSupply(contractAddress, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'totalSupply',
    watch: true,
    enabled: Boolean(contractAddress) && enabled
  })
}

export function useNFTTotalMinted(contractAddress, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'totalMinted',
    watch: true,
    enabled: Boolean(contractAddress) && enabled
  })
}

export function useNFTMintedCount(contractAddress, address, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'mintedWallets',
    args: [address],
    watch: true,
    enabled: Boolean(contractAddress && address) && enabled
  })
}

export function useNFTTokenUri(contractAddress, tokenId, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'tokenURI',
    args: [tokenId],
    enabled: Boolean(contractAddress && tokenId !== undefined && tokenId !== null) && enabled
  })
}

export function useNFTTokenTier(contractAddress, tokenId, enabled = true) {
  return useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'tokenTier',
    args: [tokenId],
    enabled: Boolean(contractAddress && tokenId !== undefined && tokenId !== null) && enabled
  })
}

// 合约写入hooks
export function useNFTMint(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'mintWithTier'
  })
}

export function useNFTOwnerMint(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'ownerMint'
  })
}

export function useNFTSetSalePhase(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'setSalePhase'
  })
}

export function useNFTSetAllowlist(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'setAllowlist'
  })
}

export function useNFTSetBaseURI(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'setBaseURI'
  })
}

export function useNFTSetHiddenURI(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'setHiddenURI'
  })
}

export function useNFTSetRevealed(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'setRevealed'
  })
}

export function useNFTSetTierPrice(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'setTierPrice'
  })
}

export function useNFTSetTierSupply(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'setTierSupply'
  })
}

export function useNFTSetMaxMints(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'setMaxMintsPerWallet'
  })
}

export function useNFTSetRoyalty(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'setRoyalty'
  })
}

export function useNFTWithdraw(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'withdraw'
  })
}

export function useNFTBurn(contractAddress) {
  return useContractWrite({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'burn'
  })
}
