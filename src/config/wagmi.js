import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

const alveyChain = {
  id: 3797,
  name: 'AlveyChain',
  network: 'alveychain',
  nativeCurrency: {
    decimals: 18,
    name: 'ALV',
    symbol: 'ALV',
  },
  rpcUrls: {
    public: { http: ['https://rpc.alveychain.com'] },
    default: { http: ['https://rpc.alveychain.com'] },
  },
  blockExplorers: {
    default: { name: 'AlveyScan', url: 'https://alveyscan.com' },
  },
}

export const config = createConfig({
  chains: [alveyChain],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [alveyChain.id]: http(),
  },
})