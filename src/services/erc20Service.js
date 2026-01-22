import { useContractRead, useContractWrite } from 'wagmi'

export const ERC20_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
]

export function useERC20Balance(tokenAddress, owner) {
  return useContractRead({
    abi: ERC20_ABI,
    address: tokenAddress,
    functionName: 'balanceOf',
    args: [owner],
    watch: true,
    enabled: Boolean(tokenAddress && owner)
  })
}

export function useERC20Allowance(tokenAddress, owner, spender) {
  return useContractRead({
    abi: ERC20_ABI,
    address: tokenAddress,
    functionName: 'allowance',
    args: [owner, spender],
    watch: true,
    enabled: Boolean(tokenAddress && owner && spender)
  })
}

export function useERC20Decimals(tokenAddress) {
  return useContractRead({
    abi: ERC20_ABI,
    address: tokenAddress,
    functionName: 'decimals',
    watch: true,
    enabled: Boolean(tokenAddress)
  })
}

export function useERC20Symbol(tokenAddress) {
  return useContractRead({
    abi: ERC20_ABI,
    address: tokenAddress,
    functionName: 'symbol',
    watch: true,
    enabled: Boolean(tokenAddress)
  })
}

export function useERC20Approve(tokenAddress) {
  return useContractWrite({
    abi: ERC20_ABI,
    address: tokenAddress,
    functionName: 'approve'
  })
}
