import { ConnectButton } from '@rainbow-me/rainbowkit'
import { AdminPanel } from './components/AdminPanel'
import { DeployContract } from './components/DeployContract'
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
          <h2 className="welcome-title">欢迎来到AlveyChain NFT平台</h2>
          <p className="welcome-text">连接您的钱包开始探索NFT世界</p>
        </div>
        <DeployContract />
        <TierShowcase />
        <MintNFT />
        <WalletTokens />
        <MyCollection />
        <MintHistory />
        <ExploreNFT />
        <AdminPanel />
      </main>
      <footer className="app-footer">
        <p className="footer-text">© 2024 AlveyChain NFT Platform</p>
      </footer>
    </div>
  )
}

export default App
