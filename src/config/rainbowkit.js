import { configureChains, createConfig } from 'wagmi'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { publicProvider } from 'wagmi/providers/public'
import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { alveyChainConfig } from './networks'

const rpcUrls = alveyChainConfig.rpcUrls.default.http
const providers = rpcUrls.map((url) =>
  jsonRpcProvider({
    rpc: () => ({ http: url })
  })
)

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [alveyChainConfig],
  [...providers, publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'AlveyChain NFT Platform',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  chains
})

export const wagmiConfig = createConfig({
  connectors,
  autoConnect: true,
  publicClient,
  webSocketPublicClient
})
