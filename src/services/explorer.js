import { alveyChainConfig } from '../config/networks'

export const EXPLORER_BASE = alveyChainConfig?.blockExplorers?.default?.url || ''

export function getTxExplorerUrl(hash) {
  if (!EXPLORER_BASE || !hash) return ''
  return `${EXPLORER_BASE}/tx/${hash}`
}

export function getTokenExplorerUrl(contractAddress, tokenId) {
  if (!EXPLORER_BASE || !contractAddress || tokenId === undefined || tokenId === null) return ''
  return `${EXPLORER_BASE}/token/${contractAddress}?a=${tokenId}`
}
