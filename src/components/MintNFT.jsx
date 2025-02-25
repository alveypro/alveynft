import { useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { useNFTMint, useNFTMintPrice, useNFTMintedCount } from '../services/nftService'
import './MintNFT.css'

export function MintNFT() {
  const { address } = useAccount()
  const { data: mintPrice } = useNFTMintPrice()
  const { data: mintedCount } = useNFTMintedCount(address)
  const { write: mint, isLoading, isSuccess, isError, error } = useNFTMint()

  const handleMint = async () => {
    if (!address) return

    // 这里使用一个示例的tokenURI，实际应用中应该使用IPFS或其他去中心化存储
    const tokenURI = `https://example.com/nft/${Date.now()}`
    
    mint({
      args: [tokenURI],
      value: mintPrice
    })
  }

  return (
    <div className="mint-container">
      <h3 className="mint-title">铸造NFT</h3>
      <div className="mint-info">
        <div className="info-item">
          <span className="info-label">铸造价格:</span>
          <span className="info-value">{mintPrice ? `${Number(mintPrice) / 10**18} ALV` : '加载中...'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">已铸造数量:</span>
          <span className="info-value">{mintedCount ?? '0'}/3</span>
        </div>
      </div>
      <button
        className={`mint-button ${isLoading ? 'loading' : ''}`}
        onClick={handleMint}
        disabled={!address || isLoading || Number(mintedCount) >= 3}
      >
        {isLoading ? '铸造中...' : '铸造NFT'}
      </button>
      {isSuccess && <div className="message success-message">铸造成功！</div>}
      {isError && <div className="message error-message">{error?.message || '铸造失败'}</div>}
    </div>
  )
}