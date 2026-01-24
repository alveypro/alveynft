import { useEffect, useMemo, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { decodeEventLog, formatUnits, parseAbiItem } from 'viem'
import {
  useNFTMint,
  useNFTMintedCount,
  useNFTMaxMints,
  useNFTPaymentToken,
  useNFTSalePhase,
  useNFTAllowlisted,
  useNFTTierPrice,
  useNFTTierSupply,
  useNFTTierMinted,
  useNFTTotalSupply,
  useNFTTotalMinted
} from '../services/nftService'
import { useContractAddress, useContractStatus } from '../services/contractAddress'
import { useERC20Allowance, useERC20Approve, useERC20Balance, useERC20Decimals, useERC20Symbol } from '../services/erc20Service'
import { createTokenUri } from '../services/ipfsService'
import { addMintHistory, updateMintHistory } from '../services/mintHistory'
import { getTokenExplorerUrl } from '../services/explorer'
import './MintNFT.css'

const TIERS = Array.from({ length: 8 }, (_, index) => ({
  id: index,
  label: `Tier ${index + 1}`
}))

export function MintNFT() {
  const { address } = useAccount()
  const { address: contractAddress } = useContractAddress()
  const { hasCode: contractReady } = useContractStatus(contractAddress)
  const { data: mintedCount } = useNFTMintedCount(contractAddress, address, contractReady)
  const { data: maxMints } = useNFTMaxMints(contractAddress, contractReady)
  const { data: paymentToken } = useNFTPaymentToken(contractAddress, contractReady)
  const { data: salePhase } = useNFTSalePhase(contractAddress, contractReady)
  const { data: isAllowlisted } = useNFTAllowlisted(contractAddress, address, contractReady)
  const [selectedTier, setSelectedTier] = useState(0)
  const { data: tierPrice } = useNFTTierPrice(contractAddress, selectedTier, contractReady)
  const { data: tierSupply } = useNFTTierSupply(contractAddress, selectedTier, contractReady)
  const { data: tierMinted } = useNFTTierMinted(contractAddress, selectedTier, contractReady)
  const { data: totalSupply } = useNFTTotalSupply(contractAddress, contractReady)
  const { data: totalMinted } = useNFTTotalMinted(contractAddress, contractReady)
  const { data: tokenDecimals } = useERC20Decimals(paymentToken)
  const { data: tokenSymbol } = useERC20Symbol(paymentToken)
  const { data: tokenBalance } = useERC20Balance(paymentToken, address)
  const { data: allowance } = useERC20Allowance(paymentToken, address, contractAddress)
  const { write: approveToken, isLoading: isApproving } = useERC20Approve(paymentToken)
  const publicClient = usePublicClient()
  const { writeAsync: mintAsync, isLoading, isSuccess, isError, error } = useNFTMint(contractAddress)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [useGateway, setUseGateway] = useState(true)
  const [embedTierBadge, setEmbedTierBadge] = useState(true)
  const [metadataStatus, setMetadataStatus] = useState('')
  const [metadataError, setMetadataError] = useState('')
  const [pendingHistoryId, setPendingHistoryId] = useState('')
  const [lastTokenId, setLastTokenId] = useState(null)
  const [copyStatus, setCopyStatus] = useState('')

  const transferEvent = useMemo(
    () =>
      parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
    []
  )
  const transferTopic = useMemo(
    () => '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    []
  )

  const mintedCountNumber = useMemo(() => Number(mintedCount ?? 0), [mintedCount])
  const maxMintsNumber = useMemo(() => Number(maxMints ?? 3), [maxMints])
  const decimalsNumber = useMemo(() => Number(tokenDecimals ?? 18), [tokenDecimals])
  const priceLabel = tierPrice
    ? `${formatUnits(tierPrice, decimalsNumber)} ${tokenSymbol ?? 'PI'}`
    : '加载中...'
  const balanceLabel = tokenBalance
    ? `${formatUnits(tokenBalance, decimalsNumber)} ${tokenSymbol ?? 'PI'}`
    : '加载中...'
  const needsApproval = Boolean(tierPrice && allowance !== undefined && allowance < tierPrice)
  const tierSupplyNumber = useMemo(() => Number(tierSupply ?? 0), [tierSupply])
  const tierMintedNumber = useMemo(() => Number(tierMinted ?? 0), [tierMinted])
  const totalSupplyNumber = useMemo(() => Number(totalSupply ?? 0), [totalSupply])
  const totalMintedNumber = useMemo(() => Number(totalMinted ?? 0), [totalMinted])
  const tierRemaining = Math.max(tierSupplyNumber - tierMintedNumber, 0)
  const totalRemaining = Math.max(totalSupplyNumber - totalMintedNumber, 0)
  const salePhaseNumber = Number(salePhase ?? 0)
  const salePhaseLabel =
    salePhaseNumber === 1 ? 'Allowlist' : salePhaseNumber === 2 ? 'Public' : 'Paused'
  const allowlistRequired = salePhaseNumber === 1
  const canMint =
    Boolean(address) &&
    Boolean(contractAddress) &&
    Boolean(contractReady) &&
    Boolean(tierPrice) &&
    mintedCountNumber < maxMintsNumber &&
    tierRemaining > 0 &&
    totalRemaining > 0 &&
    salePhaseNumber !== 0 &&
    (!allowlistRequired || Boolean(isAllowlisted))

  const loadImageFromBlob = (blob) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      img.onerror = (err) => {
        URL.revokeObjectURL(url)
        reject(err)
      }
      img.src = url
    })

  const loadImageFromUrl = async (url) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error('加载图片失败')
    const blob = await response.blob()
    return loadImageFromBlob(blob)
  }

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
    })

  const renderBadge = async (sourceImage, badgeText) => {
    const canvas = document.createElement('canvas')
    const width = sourceImage.naturalWidth || 1024
    const height = sourceImage.naturalHeight || 1024
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法生成图片')

    const safePadding = Math.max(24, Math.floor(width * 0.08))
    ctx.fillStyle = '#0b0f14'
    ctx.fillRect(0, 0, width, height)
    const maxW = width - safePadding * 2
    const maxH = height - safePadding * 2
    const scale = Math.min(maxW / sourceImage.naturalWidth, maxH / sourceImage.naturalHeight)
    const drawW = Math.floor(sourceImage.naturalWidth * scale)
    const drawH = Math.floor(sourceImage.naturalHeight * scale)
    const drawX = Math.floor((width - drawW) / 2)
    const drawY = Math.floor((height - drawH) / 2)
    ctx.drawImage(sourceImage, drawX, drawY, drawW, drawH)

    const padding = Math.max(16, Math.floor(width * 0.02))
    const badgeHeight = Math.max(40, Math.floor(height * 0.08))
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = Math.max(2, Math.floor(width * 0.002))
    const badgeWidth = Math.max(160, Math.floor(width * 0.28))
    const x = safePadding
    const y = safePadding
    const radius = Math.max(16, Math.floor(badgeHeight / 2))
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + badgeWidth - radius, y)
    ctx.quadraticCurveTo(x + badgeWidth, y, x + badgeWidth, y + radius)
    ctx.lineTo(x + badgeWidth, y + badgeHeight - radius)
    ctx.quadraticCurveTo(x + badgeWidth, y + badgeHeight, x + badgeWidth - radius, y + badgeHeight)
    ctx.lineTo(x + radius, y + badgeHeight)
    ctx.quadraticCurveTo(x, y + badgeHeight, x, y + badgeHeight - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = `600 ${Math.max(18, Math.floor(badgeHeight * 0.5))}px Arial`
    ctx.textBaseline = 'middle'
    ctx.fillText(badgeText, x + padding, y + badgeHeight / 2)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  }

  const buildTierImageFile = async () => {
    const badgeText = `Tier ${selectedTier + 1}`
    try {
      if (imageFile) {
        const dataUrl = await readFileAsDataUrl(imageFile)
        const img = new Image()
        img.src = dataUrl
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
        const blob = await renderBadge(img, badgeText)
        if (blob) return new File([blob], `tier-${selectedTier + 1}.png`, { type: 'image/png' })
      }
      if (imageUrl) {
        const img = await loadImageFromUrl(imageUrl)
        const blob = await renderBadge(img, badgeText)
        if (blob) return new File([blob], `tier-${selectedTier + 1}.png`, { type: 'image/png' })
      }
    } catch {
      return null
    }
    return null
  }

  const handleMint = async () => {
    if (!canMint) return

    try {
      setCopyStatus('')
      setMetadataStatus('正在生成并上传元数据...')
      setMetadataError('')
      let finalImageFile = imageFile
      let finalImageUrl = imageUrl
      if (embedTierBadge) {
        setMetadataStatus('正在生成带 Tier 徽标的图片...')
        const tierFile = await buildTierImageFile()
        if (tierFile) {
          finalImageFile = tierFile
          finalImageUrl = ''
        }
      }
      const tokenURI = await createTokenUri({
        name,
        description,
        imageUrl: finalImageUrl,
        imageFile: finalImageFile,
        attributes: [
          { trait_type: 'Tier', value: `Tier ${selectedTier + 1}` },
          { trait_type: 'Price', value: priceLabel }
        ],
        useGateway
      })
      setMetadataStatus('正在提交铸造交易...')
      const historyId = addMintHistory({
        name: name || `Tier ${selectedTier + 1}`,
        tier: selectedTier + 1,
        tokenURI,
        createdAt: Date.now(),
        status: 'submitted'
      })
      setPendingHistoryId(historyId)

      const tx = await mintAsync?.({
        args: [selectedTier, tokenURI]
      })

      const hash =
        typeof tx === 'string'
          ? tx
          : typeof tx?.hash === 'string'
            ? tx.hash
            : typeof tx?.hash?.hash === 'string'
              ? tx.hash.hash
              : undefined

      if (hash && publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        const transferLog = receipt.logs.find(
          (log) =>
            log.address?.toLowerCase() === contractAddress?.toLowerCase() &&
            log.topics?.[0]?.toLowerCase() === transferTopic.toLowerCase()
        )
        if (transferLog) {
          const decoded = decodeEventLog({
            abi: [transferEvent],
            data: transferLog.data,
            topics: transferLog.topics
          })
          if (decoded?.args?.tokenId !== undefined) {
            const tokenId = Number(decoded.args.tokenId)
            setLastTokenId(tokenId)
            updateMintHistory(historyId, { tokenId })
            return
          }
        }

        const mintedAfter = await publicClient.readContract({
          ...NFT_CONFIG,
          address: contractAddress,
          functionName: 'totalMinted'
        })
        const fallbackId = Number(mintedAfter) - 1
        if (fallbackId >= 0) {
          setLastTokenId(fallbackId)
          updateMintHistory(historyId, { tokenId: fallbackId })
        }
      }
    } catch (uploadError) {
      setMetadataStatus('')
      setMetadataError(uploadError?.message || '元数据上传失败')
      console.error(uploadError)
    }
  }

  useEffect(() => {
    if (!pendingHistoryId) return
    if (isSuccess) {
      updateMintHistory(pendingHistoryId, { status: 'confirmed' })
      setPendingHistoryId('')
    }
    if (isError) {
      updateMintHistory(pendingHistoryId, { status: 'failed', error: error?.message })
      setPendingHistoryId('')
    }
  }, [isSuccess, isError, pendingHistoryId, error])

  const handleCopy = async (value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(String(value))
      setCopyStatus('已复制 Token ID')
      setTimeout(() => setCopyStatus(''), 2000)
    } catch {
      setCopyStatus('复制失败，请手动复制')
    }
  }

  return (
    <div className="mint-container">
      <h3 className="mint-title">铸造NFT</h3>
      <div className="tier-grid">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            className={`tier-button ${selectedTier === tier.id ? 'active' : ''}`}
            onClick={() => setSelectedTier(tier.id)}
            type="button"
          >
            {tier.label}
          </button>
        ))}
      </div>
      <div className="mint-form">
        <label className="form-field">
          <span>名称</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="AlveyChain Genesis"
          />
        </label>
        <label className="form-field">
          <span>描述</span>
          <textarea
            rows="3"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="写一段关于你的NFT的故事"
          />
        </label>
        <label className="form-field">
          <span>图片链接（可选）</span>
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="form-field">
          <span>上传图片（可选）</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label className="form-checkbox">
          <input
            type="checkbox"
            checked={embedTierBadge}
            onChange={(event) => setEmbedTierBadge(event.target.checked)}
          />
          铸造时把 Tier 徽标直接写进图片（钱包可见）
        </label>
        <label className="form-checkbox">
          <input
            type="checkbox"
            checked={useGateway}
            onChange={(event) => setUseGateway(event.target.checked)}
          />
          钱包兼容模式（使用 HTTPS Token URI，更容易被钱包识别）
        </label>
        <p className="form-hint">
          推荐设置 `VITE_PINATA_JWT` 自动上传到 IPFS，失败时会自动用本地元数据继续铸造。
        </p>
      </div>
      <div className="mint-info">
        <div className="info-item">
          <span className="info-label">销售阶段:</span>
          <span className="info-value">{contractReady ? salePhaseLabel : '加载中...'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">铸造价格 ({tokenSymbol ?? 'PI'}):</span>
          <span className="info-value">{priceLabel}</span>
        </div>
        <div className="info-item">
          <span className="info-label">{tokenSymbol ?? 'PI'} 余额:</span>
          <span className="info-value">{balanceLabel}</span>
        </div>
        <div className="info-item">
          <span className="info-label">该等级剩余:</span>
          <span className="info-value">{contractReady ? tierRemaining : '加载中...'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">全局剩余:</span>
          <span className="info-value">{contractReady ? totalRemaining : '加载中...'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">已铸造数量:</span>
          <span className="info-value">
            {contractReady ? `${mintedCountNumber}/${maxMintsNumber}` : '加载中...'}
          </span>
        </div>
      </div>
      {needsApproval && (
        <button
          className={`mint-button ${isApproving ? 'loading' : ''}`}
          onClick={() => approveToken?.({ args: [contractAddress, tierPrice] })}
          disabled={!canMint || isApproving}
        >
          {isApproving ? '授权中...' : '授权 PI'}
        </button>
      )}
      <button
        className={`mint-button ${isLoading ? 'loading' : ''}`}
        onClick={handleMint}
        disabled={!canMint || isLoading || needsApproval}
      >
        {isLoading ? '铸造中...' : '铸造NFT'}
      </button>
      {!contractAddress && (
        <div className="message error-message">请先部署合约或设置合约地址</div>
      )}
      {contractAddress && !paymentToken && (
        <div className="message error-message">未检测到支付代币地址，请重新部署合约</div>
      )}
      {contractAddress && !contractReady && (
        <div className="message error-message">未检测到合约代码，请确认网络或重新部署</div>
      )}
      {contractAddress && totalRemaining === 0 && (
        <div className="message error-message">全系列已售罄</div>
      )}
      {contractAddress && totalRemaining > 0 && tierRemaining === 0 && (
        <div className="message error-message">该等级已售罄，请选择其他等级</div>
      )}
      {contractAddress && salePhaseNumber === 0 && (
        <div className="message error-message">当前为暂停状态，请等待开启</div>
      )}
      {contractAddress && allowlistRequired && !isAllowlisted && (
        <div className="message error-message">当前为白名单阶段，你不在白名单</div>
      )}
      {metadataStatus && <div className="message info-message">{metadataStatus}</div>}
      {metadataError && <div className="message error-message">{metadataError}</div>}
      {isSuccess && <div className="message success-message">铸造成功！</div>}
      {isError && <div className="message error-message">{error?.message || '铸造失败'}</div>}
      {lastTokenId !== null && (
        <div className="message success-message">
          你的 Token ID: #{lastTokenId}
          <button
            type="button"
            className="inline-button"
            onClick={() => handleCopy(lastTokenId)}
          >
            复制
          </button>
          {contractAddress && (
            <a
              className="inline-link"
              href={getTokenExplorerUrl(contractAddress, lastTokenId)}
              target="_blank"
              rel="noreferrer"
            >
              区块浏览器查看
            </a>
          )}
        </div>
      )}
      {copyStatus && <div className="message info-message">{copyStatus}</div>}
    </div>
  )
}
