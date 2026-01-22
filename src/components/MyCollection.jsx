import { useMemo, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useContractAddress, useContractStatus } from '../services/contractAddress'
import { NFT_CONFIG, useNFTTransfer } from '../services/nftService'
import { fetchIpfsJson, toGatewayUrl } from '../services/ipfsService'
import { DEFAULT_NFT_IMAGE } from '../services/defaults'
import { getTokenExplorerUrl } from '../services/explorer'
import './MyCollection.css'

function decodeDataUri(uri) {
  const prefix = 'data:application/json;utf8,'
  if (!uri.startsWith(prefix)) return null
  try {
    const json = decodeURIComponent(uri.slice(prefix.length))
    return JSON.parse(json)
  } catch {
    return null
  }
}

async function fetchMetadata(uri) {
  if (!uri) return null
  const data = decodeDataUri(uri)
  if (data) return data
  return fetchIpfsJson(uri)
}

export function MyCollection() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { address: contractAddress } = useContractAddress()
  const { hasCode: contractReady } = useContractStatus(contractAddress)
  const { writeAsync: transferAsync, isLoading: isTransferring } = useNFTTransfer(contractAddress)
  const [startId, setStartId] = useState('0')
  const [endId, setEndId] = useState('20')
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [transferTargets, setTransferTargets] = useState({})
  const [transferStatus, setTransferStatus] = useState({})
  const [copyStatus, setCopyStatus] = useState('')

  const range = useMemo(() => {
    const start = Number(startId)
    const end = Number(endId)
    if (!Number.isFinite(start) || !Number.isFinite(end)) return []
    const normalizedStart = Math.max(0, Math.min(start, end))
    const normalizedEnd = Math.max(0, Math.max(start, end))
    return Array.from({ length: normalizedEnd - normalizedStart + 1 }, (_, idx) => normalizedStart + idx)
  }, [startId, endId])

  const handleFetch = async () => {
    if (!publicClient || !contractAddress || !contractReady) return
    setIsLoading(true)
    const next = []

    for (const tokenId of range) {
      try {
        const tokenURI = await publicClient.readContract({
          ...NFT_CONFIG,
          address: contractAddress,
          functionName: 'tokenURI',
          args: [BigInt(tokenId)]
        })
        const tokenTier = await publicClient.readContract({
          ...NFT_CONFIG,
          address: contractAddress,
          functionName: 'tokenTier',
          args: [BigInt(tokenId)]
        })
        const metadata = await fetchMetadata(tokenURI)
        next.push({
          tokenId,
          tokenTier: Number(tokenTier) + 1,
          name: metadata?.name ?? `Token #${tokenId}`,
          image: metadata?.image || metadata?.image_url ? toGatewayUrl(metadata?.image || metadata?.image_url) : DEFAULT_NFT_IMAGE,
          tokenURI
        })
      } catch {
        next.push({
          tokenId,
          tokenTier: null,
          name: `Token #${tokenId}`,
          image: DEFAULT_NFT_IMAGE,
          tokenURI: ''
        })
      }
    }

    setItems(next)
    setIsLoading(false)
  }

  const updateTarget = (tokenId, value) => {
    setTransferTargets((prev) => ({ ...prev, [tokenId]: value }))
  }

  const updateStatus = (tokenId, status) => {
    setTransferStatus((prev) => ({ ...prev, [tokenId]: status }))
  }

  const handleTransfer = async (tokenId) => {
    if (!address || !contractAddress || !transferAsync) return
    const target = transferTargets[tokenId]?.trim()
    if (!target) {
      updateStatus(tokenId, '请输入接收地址')
      return
    }

    try {
      updateStatus(tokenId, '转移中...')
      await transferAsync({
        args: [address, target, BigInt(tokenId)]
      })
      updateStatus(tokenId, '转移交易已提交')
    } catch (error) {
      updateStatus(tokenId, error?.shortMessage || error?.message || '转移失败')
    }
  }

  const handleCopy = async (tokenId) => {
    if (tokenId === undefined || tokenId === null) return
    try {
      await navigator.clipboard.writeText(String(tokenId))
      setCopyStatus(`Token #${tokenId} 已复制`)
      setTimeout(() => setCopyStatus(''), 2000)
    } catch {
      setCopyStatus('复制失败，请手动复制')
    }
  }

  if (!contractAddress) return null

  return (
    <section className="collection-card">
      <h3>我的藏品</h3>
      <p>输入 Token ID 区间，批量查看 NFT 元数据。</p>
      <div className="collection-form">
        <input
          type="number"
          value={startId}
          onChange={(event) => setStartId(event.target.value)}
          placeholder="起始 ID"
        />
        <input
          type="number"
          value={endId}
          onChange={(event) => setEndId(event.target.value)}
          placeholder="结束 ID"
        />
        <button onClick={handleFetch} disabled={isLoading || !contractReady}>
          {isLoading ? '读取中...' : '加载藏品'}
        </button>
      </div>
      <div className="collection-grid">
        {items.map((item) => (
          <div key={item.tokenId} className="collection-item">
            <div className="collection-image">
              <img src={item.image || DEFAULT_NFT_IMAGE} alt={item.name} />
            </div>
            <div className="collection-info">
              <div className="collection-title">{item.name}</div>
              <div className="collection-meta">
                Token #{item.tokenId}
                <button
                  type="button"
                  className="collection-copy"
                  onClick={() => handleCopy(item.tokenId)}
                >
                  复制
                </button>
                <a
                  className="collection-link"
                  href={getTokenExplorerUrl(contractAddress, item.tokenId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  浏览器查看
                </a>
              </div>
              {item.tokenTier && <div className="collection-meta">Tier {item.tokenTier}</div>}
              {item.tokenURI && (
                <a
                  className="collection-link"
                  href={toGatewayUrl(item.tokenURI)}
                  target="_blank"
                  rel="noreferrer"
                >
                  查看元数据
                </a>
              )}
              <div className="collection-transfer">
                <input
                  type="text"
                  value={transferTargets[item.tokenId] ?? ''}
                  onChange={(event) => updateTarget(item.tokenId, event.target.value)}
                  placeholder="接收地址 0x..."
                />
                <button
                  type="button"
                  onClick={() => handleTransfer(item.tokenId)}
                  disabled={!address || isTransferring || !contractReady}
                >
                  {isTransferring ? '处理中...' : '转移'}
                </button>
              </div>
            {transferStatus[item.tokenId] && (
              <div className="collection-status">{transferStatus[item.tokenId]}</div>
            )}
          </div>
        </div>
      ))}
      </div>
      {copyStatus && <div className="collection-status">{copyStatus}</div>}
    </section>
  )
}
