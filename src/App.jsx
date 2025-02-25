import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { MintNFT } from './components/MintNFT'
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
        <MintNFT />
      </main>
      <footer className="app-footer">
        <p className="footer-text">© 2024 AlveyChain NFT Platform</p>
      </footer>
    </div>
  )
}

export default App
