import { useEffect, useMemo, useState } from 'react'
import { useContractAddress, useContractStatus } from '../services/contractAddress'
import { useNFTTokenTier, useNFTTokenUri } from '../services/nftService'
import { fetchIpfsJson, toGatewayUrl } from '../services/ipfsService'
import { DEFAULT_NFT_IMAGE } from '../services/defaults'
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
  const [metadata, setMetadata] = useState(null)
  const [metadataError, setMetadataError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchMetadata = async () => {
    if (!tokenUri) return
    try {
      setIsLoading(true)
      setMetadataError('')
      const json = await fetchIpfsJson(tokenUri)
      if (!json) {
        setMetadataError('元数据加载失败，请稍后重试')
        return
      }
      setMetadata(json)
    } catch {
      setMetadataError('元数据加载失败，请稍后重试')
      setMetadata(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setMetadata(null)
    setMetadataError('')
    if (tokenUri) {
      fetchMetadata()
    }
  }, [tokenUri])

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
          {tokenUri && (
            <div className="explore-actions">
              <button onClick={fetchMetadata} disabled={isLoading}>
                {isLoading ? '加载中...' : '加载元数据'}
              </button>
              <a href={toGatewayUrl(tokenUri)} target="_blank" rel="noreferrer">
                打开元数据
              </a>
            </div>
          )}
          {metadataError && <div className="explore-error">{metadataError}</div>}
          {metadata && (
            <div className="explore-preview">
              <img
                src={metadata.image ? toGatewayUrl(metadata.image) : DEFAULT_NFT_IMAGE}
                alt={metadata.name || 'NFT'}
              />
              <div className="explore-meta">
                <div>{metadata.name}</div>
                <div className="explore-desc">{metadata.description}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
