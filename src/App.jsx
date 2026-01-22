import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ExploreNFT } from './components/ExploreNFT'
import { MintHistory } from './components/MintHistory'
import { MintNFT } from './components/MintNFT'
import { MyCollection } from './components/MyCollection'
import { TierShowcase } from './components/TierShowcase'
import { WalletTokens } from './components/WalletTokens'
import './App.css'
import './styles/mobile.css'

function App() {
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
        <TierShowcase />
        <MintNFT />
        <WalletTokens />
        <MyCollection />
        <MintHistory />
        <ExploreNFT />
      </main>
      <footer className="app-footer">
        <p className="footer-text">© 2024 AlveyChain NFT Platform</p>
      </footer>
    </div>
  )
}

export default App
