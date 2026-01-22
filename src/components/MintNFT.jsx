import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
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
  const { write: mint, isLoading, isSuccess, isError, error } = useNFTMint(contractAddress)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [metadataStatus, setMetadataStatus] = useState('')
  const [metadataError, setMetadataError] = useState('')
  const [pendingHistoryId, setPendingHistoryId] = useState('')

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

  const handleMint = async () => {
    if (!canMint) return

    try {
      setMetadataStatus('正在生成并上传元数据...')
      setMetadataError('')
      const tokenURI = await createTokenUri({
        name,
        description,
        imageUrl,
        imageFile,
        attributes: [
          { trait_type: 'Tier', value: `Tier ${selectedTier + 1}` },
          { trait_type: 'Price', value: priceLabel }
        ]
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

      mint({
        args: [selectedTier, tokenURI]
      })
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
        <p className="form-hint">
          如设置了 `VITE_NFT_STORAGE_TOKEN` 会自动上传到 IPFS，失败时会自动用本地元数据继续铸造。
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
    </div>
  )
}
