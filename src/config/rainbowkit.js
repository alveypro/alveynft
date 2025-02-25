import { createConfig } from 'wagmi'
import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { alveyChainConfig } from './networks'

const { connectors } = getDefaultWallets({
  appName: 'AlveyChain NFT Platform',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  chains: [alveyChainConfig]
})

export const wagmiConfig = createConfig({
  connectors,
  ssr: true
})