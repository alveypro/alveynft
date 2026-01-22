import { useContractRead, useContractWrite } from 'wagmi'

export const MARKET_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "nft_", "type": "address" }, { "internalType": "address", "name": "paymentToken_", "type": "address" }, { "internalType": "address", "name": "feeRecipient_", "type": "address" }, { "internalType": "uint96", "name": "feeBps_", "type": "uint96" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "nft",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paymentToken",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeRecipient",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeBps",
    "outputs": [{ "internalType": "uint96", "name": "", "type": "uint96" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "listingCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "listings",
    "outputs": [
      { "internalType": "address", "name": "seller", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "bool", "name": "active", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "uint256", "name": "price", "type": "uint256" }],
    "name": "createListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "listingId", "type": "uint256" }],
    "name": "cancelListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "listingId", "type": "uint256" }],
    "name": "buyListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "auctionCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "auctions",
    "outputs": [
      { "internalType": "address", "name": "seller", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "reservePrice", "type": "uint256" },
      { "internalType": "uint256", "name": "highestBid", "type": "uint256" },
      { "internalType": "address", "name": "highestBidder", "type": "address" },
      { "internalType": "uint64", "name": "endTime", "type": "uint64" },
      { "internalType": "bool", "name": "settled", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "uint256", "name": "reservePrice", "type": "uint256" }, { "internalType": "uint64", "name": "duration", "type": "uint64" }],
    "name": "createAuction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "auctionId", "type": "uint256" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "bid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "auctionId", "type": "uint256" }],
    "name": "cancelAuction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "auctionId", "type": "uint256" }],
    "name": "settleAuction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

export function useMarketPaymentToken(marketAddress, enabled = true) {
  return useContractRead({
    abi: MARKET_ABI,
    address: marketAddress,
    functionName: 'paymentToken',
    watch: true,
    enabled: Boolean(marketAddress) && enabled
  })
}

export function useMarketListingCount(marketAddress, enabled = true) {
  return useContractRead({
    abi: MARKET_ABI,
    address: marketAddress,
    functionName: 'listingCount',
    watch: true,
    enabled: Boolean(marketAddress) && enabled
  })
}

export function useMarketAuctionCount(marketAddress, enabled = true) {
  return useContractRead({
    abi: MARKET_ABI,
    address: marketAddress,
    functionName: 'auctionCount',
    watch: true,
    enabled: Boolean(marketAddress) && enabled
  })
}

export function useMarketCreateListing(marketAddress) {
  return useContractWrite({
    abi: MARKET_ABI,
    address: marketAddress,
    functionName: 'createListing'
  })
}

export function useMarketCancelListing(marketAddress) {
  return useContractWrite({
    abi: MARKET_ABI,
    address: marketAddress,
    functionName: 'cancelListing'
  })
}

export function useMarketBuyListing(marketAddress) {
  return useContractWrite({
    abi: MARKET_ABI,
    address: marketAddress,
    functionName: 'buyListing'
  })
}

export function useMarketCreateAuction(marketAddress) {
  return useContractWrite({
    abi: MARKET_ABI,
    address: marketAddress,
    functionName: 'createAuction'
  })
}

export function useMarketBid(marketAddress) {
  return useContractWrite({
    abi: MARKET_ABI,
    address: marketAddress,
    functionName: 'bid'
  })
}

export function useMarketCancelAuction(marketAddress) {
  return useContractWrite({
    abi: MARKET_ABI,
    address: marketAddress,
    functionName: 'cancelAuction'
  })
}

export function useMarketSettleAuction(marketAddress) {
  return useContractWrite({
    abi: MARKET_ABI,
    address: marketAddress,
    functionName: 'settleAuction'
  })
}
