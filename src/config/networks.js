export const alveyChainConfig = {
  id: 3797,
  name: 'AlveyChain',
  network: 'alveychain',
  nativeCurrency: {
    decimals: 18,
    name: 'ALV',
    symbol: 'ALV',
  },
  rpcUrls: {
    public: { http: [
      'https://elves-core1.alvey.io/',
      'https://elves-core2.alvey.io/',
      'https://elves-core3.alvey.io/'
    ] },
    default: { http: ['https://elves-core1.alvey.io/'] },
  },
  blockExplorers: {
    default: { name: 'AlveyScan', url: 'https://alveyscan.com' },
  },
  testnet: false,
}