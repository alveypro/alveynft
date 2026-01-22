import { useMemo, useState } from 'react'
import { useContractAddress, useContractStatus } from '../services/contractAddress'
import { useNFTTokenTier, useNFTTokenUri } from '../services/nftService'
import './ExploreNFT.css'

export function ExploreNFT() {
  const { address: contractAddress } = useContractAddress()
  const { hasCode: contractReady } = useContractStatus(contractAddress)
  const [tokenIdInput, setTokenIdInput] = useState('')
  const tokenIdValue = useMemo(() => {
    const parsed = Number(tokenIdInput)
    return Number.isFinite(parsed) ? BigInt(parsed) : undefined
  }, [tokenIdInput])
  const { data: tokenUri } = useNFTTokenUri(contractAddress, tokenIdValue, contractReady)
  const { data: tokenTier } = useNFTTokenTier(contractAddress, tokenIdValue, contractReady)

  if (!contractAddress) {
    return null
  }

  if (!contractReady) {
    return (
      <section className="explore-card">
        <h3>藏品查询</h3>
        <p>未检测到合约代码，请确认已部署并切换到 AlveyChain。</p>
      </section>
    )
  }

  return (
    <section className="explore-card">
      <h3>藏品查询</h3>
      <div className="explore-form">
        <input
          type="number"
          placeholder="输入 Token ID"
          value={tokenIdInput}
          onChange={(event) => setTokenIdInput(event.target.value)}
        />
      </div>
      {tokenIdValue !== undefined && (
        <div className="explore-result">
          <div>
            <span>等级:</span> {tokenTier !== undefined ? `Tier ${Number(tokenTier) + 1}` : '-'}
          </div>
          <div className="explore-uri">
            <span>Token URI:</span>
            <span>{tokenUri ?? '-'}</span>
          </div>
        </div>
      )}
    </section>
  )
}
