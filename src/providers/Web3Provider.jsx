import React from 'react'
import { WagmiConfig, useNetwork } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '../config/rainbowkit'
import { alveyChainConfig } from '../config/networks'
import { useEffect } from 'react'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000
    }
  }
})

class Web3ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Web3 Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
  <div className="error-container">
    <h3>Web3连接错误</h3>
    <p>请检查：</p>
    <ul>
      <li>MetaMask扩展是否已安装并解锁</li>
      <li>是否已切换到AlveyChain网络</li>
      <li>控制台是否有错误信息（按F12打开开发者工具）</li>
    </ul>
    <button onClick={() => window.location.reload()}>刷新页面</button>
  </div>
)
    }
    return this.props.children
  }
}

export function Web3Provider({ children }) {
  const ChainWatcher = () => {
    const { chain } = useNetwork()

    useEffect(() => {
      const checkChain = async () => {
        if (chain?.id !== alveyChainConfig.id) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${alveyChainConfig.id.toString(16)}`,
                chainName: alveyChainConfig.network,
                nativeCurrency: alveyChainConfig.nativeCurrency,
                rpcUrls: [alveyChainConfig.rpcUrls.default.http[0]],
                blockExplorerUrls: [alveyChainConfig.blockExplorers.default.url]
              }]
            })
          } catch (error) {
            console.error('Failed to switch network:', error)
          }
        }
      }

      if (window.ethereum) {
        checkChain()
      }
    }, [chain])

    return null
  }

  return (
    <Web3ErrorBoundary>
      <WagmiConfig config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            chains={[alveyChainConfig]}
            showRecentTransactions={true}
            coolMode
          >
            <ChainWatcher />
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiConfig>
    </Web3ErrorBoundary>
  )
}
