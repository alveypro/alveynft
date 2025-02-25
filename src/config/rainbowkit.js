import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { alveyChainConfig } from './networks'

export const wagmiConfig = getDefaultConfig({
  appName: 'AlveyChain NFT Platform',
  projectId: process.env.VITE_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [alveyChainConfig],
  ssr: true
})