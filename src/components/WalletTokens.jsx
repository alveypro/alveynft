import { useMemo, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useContractAddress, useContractStatus } from '../services/contractAddress'
import './WalletTokens.css'

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

function normalizeAddress(address) {
  return address ? address.toLowerCase() : ''
}

export function WalletTokens() {
  const publicClient = usePublicClient()
  const { address } = useAccount()
  const { address: contractAddress } = useContractAddress()
  const { hasCode: contractReady } = useContractStatus(contractAddress)
  const [fromBlock, setFromBlock] = useState('0')
  const [toBlock, setToBlock] = useState('latest')
  const [isScanning, setIsScanning] = useState(false)
  const [tokenIds, setTokenIds] = useState([])
  const [scanError, setScanError] = useState('')
  const [scanInfo, setScanInfo] = useState('')

  const targetAddress = useMemo(() => normalizeAddress(address), [address])

  const scanTransfers = async () => {
    if (!publicClient || !contractAddress || !targetAddress || !contractReady) return
    setIsScanning(true)
    setScanError('')
    setScanInfo('')

    try {
      const normalizedFrom = fromBlock.trim()
      const normalizedTo = toBlock.trim()
      const latestBlock = await publicClient.getBlockNumber()
      const parseBlock = (value) => {
        if (!value) return null
        if (value === 'latest') return 'latest'
        if (!/^\d+$/.test(value)) {
          throw new Error('区块号只能输入数字或 latest')
        }
        return BigInt(value)
      }

      const parsedFrom = parseBlock(normalizedFrom)
      const parsedTo = parseBlock(normalizedTo)

      const from =
        parsedFrom === null
          ? latestBlock > 200000n
            ? latestBlock - 200000n
            : 0n
          : parsedFrom
      const to = parsedTo === null || parsedTo === 'latest' ? 'latest' : parsedTo

      if (parsedFrom === null) {
        setScanInfo('未填写起始区块，默认扫描最近 200000 区块。')
      }

      const addressTopic = `0x${targetAddress.slice(2).padStart(64, '0')}`
      const chunkSize = 200000n
      let currentFrom = from
      let currentTo = to
      const owned = new Set()

      while (true) {
        let rangeTo = currentTo
        if (currentTo !== 'latest') {
          rangeTo = currentFrom + chunkSize
          if (rangeTo > currentTo) rangeTo = currentTo
        }

        const [received, sent] = await Promise.all([
          publicClient.getLogs({
            address: contractAddress,
            fromBlock: currentFrom,
            toBlock: rangeTo,
            topics: [TRANSFER_TOPIC, null, addressTopic]
          }),
          publicClient.getLogs({
            address: contractAddress,
            fromBlock: currentFrom,
            toBlock: rangeTo,
            topics: [TRANSFER_TOPIC, addressTopic]
          })
        ])

        received.forEach((log) => {
          if (!log?.topics || log.topics.length < 4 || !log.topics[3]) return
          const tokenId = BigInt(log.topics[3])
          owned.add(tokenId.toString())
        })
        sent.forEach((log) => {
          if (!log?.topics || log.topics.length < 4 || !log.topics[3]) return
          const tokenId = BigInt(log.topics[3])
          owned.delete(tokenId.toString())
        })

        if (currentTo === 'latest') {
          break
        }

        if (rangeTo === currentTo) {
          break
        }

        currentFrom = rangeTo + 1n
      }

      setTokenIds(Array.from(owned).map((id) => Number(id)).sort((a, b) => a - b))

      if (!owned.size) {
        setScanInfo('该区块范围内未发现 Token ID，可尝试填入合约部署区块。')
      }
    } catch (error) {
      setScanError(error?.message || '扫描失败，请确认区块号格式正确')
    } finally {
      setIsScanning(false)
    }
  }

  if (!contractAddress) return null

  return (
    <section className="wallet-card">
      <h3>自动识别我的 NFT</h3>
      <p>通过扫描 Transfer 事件获取你当前持有的 Token ID（无需后端）。</p>
      <div className="wallet-form">
        <input
          type="text"
          value={fromBlock}
          onChange={(event) => setFromBlock(event.target.value)}
          placeholder="起始区块（建议填合约部署区块）"
        />
        <input
          type="text"
          value={toBlock}
          onChange={(event) => setToBlock(event.target.value)}
          placeholder="结束区块（默认 latest）"
        />
        <button onClick={scanTransfers} disabled={!contractReady || isScanning}>
          {isScanning ? '扫描中...' : '扫描我的 NFT'}
        </button>
      </div>
      {scanInfo && <div className="message info-message">{scanInfo}</div>}
      {scanError && <div className="message error-message">{scanError}</div>}
      <div className="wallet-results">
        {tokenIds.length ? (
          tokenIds.map((id) => (
            <span key={id} className="wallet-chip">
              #{id}
            </span>
          ))
        ) : (
          <span>暂无结果</span>
        )}
      </div>
    </section>
  )
}
