import { useMemo, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { AdminPanel } from './components/AdminPanel'
import { ExploreNFT } from './components/ExploreNFT'
import { MintHistory } from './components/MintHistory'
import { MintNFT } from './components/MintNFT'
import { MyCollection } from './components/MyCollection'
import { TierShowcase } from './components/TierShowcase'
import { WalletTokens } from './components/WalletTokens'
import { useContractAddress, useContractStatus } from './services/contractAddress'
import { useNFTOwner } from './services/nftService'
import './App.css'
import './styles/mobile.css'

function App() {
  const [activeTab, setActiveTab] = useState('mint')
  const [showAdmin, setShowAdmin] = useState(false)
  const { address } = useAccount()
  const { address: contractAddress } = useContractAddress()
  const { hasCode: contractReady } = useContractStatus(contractAddress)
  const { data: owner } = useNFTOwner(contractAddress, contractReady)
  const fallbackOwner =
    import.meta.env.VITE_OWNER_ADDRESS ||
    '0xd0dC6Ff0eA6a27a0a4Ba0002F019d0E1b9666c28'
  const isOwner = useMemo(
    () =>
      Boolean(
        address &&
          ((owner && address.toLowerCase() === owner.toLowerCase()) ||
            (fallbackOwner && address.toLowerCase() === fallbackOwner.toLowerCase()))
      ),
    [address, owner, fallbackOwner]
  )

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">AlveyChain NFT</h1>
        <div className="connect-button-wrapper">
          <ConnectButton />
        </div>
      </header>
      <main className="app-main">
        <div className="welcome-section">
          <div className="welcome-kicker">AlveyChain Official / 官方发行</div>
          <h2 className="welcome-title">稀缺铸造 · 高级权益</h2>
          <p className="welcome-text">
            Mint the rarest tiers, unlock premium privileges. / 铸造稀缺等级，解锁高阶权益
          </p>
          <div className="keyword-row">
            <span>Scarcity / 稀缺</span>
            <span>Utility / 权益</span>
            <span>On-chain / 链上</span>
            <span>Prestige / 品牌</span>
          </div>
        </div>
        <div className="section-tabs">
          <button
            className={activeTab === 'mint' ? 'active' : ''}
            onClick={() => setActiveTab('mint')}
          >
            Mint / 铸造
          </button>
          <button
            className={activeTab === 'collection' ? 'active' : ''}
            onClick={() => setActiveTab('collection')}
          >
            My NFTs / 我的藏品
          </button>
          <button
            className={activeTab === 'explore' ? 'active' : ''}
            onClick={() => setActiveTab('explore')}
          >
            Explore / 查询
          </button>
        </div>
        {activeTab === 'mint' && (
          <>
            <TierShowcase />
            <MintNFT />
          </>
        )}
        {activeTab === 'collection' && (
          <>
            <WalletTokens />
            <MyCollection />
            <MintHistory />
          </>
        )}
        {activeTab === 'explore' && <ExploreNFT />}
        {isOwner && (
          <div className="admin-toggle">
            <button onClick={() => setShowAdmin((prev) => !prev)}>
              {showAdmin ? 'Hide Owner Settings' : 'Owner Settings'}
            </button>
          </div>
        )}
        {isOwner && showAdmin && <AdminPanel />}
      </main>
      <footer className="app-footer">
        <p className="footer-text">© 2024 AlveyChain NFT Platform</p>
      </footer>
    </div>
  )
}

export default App
