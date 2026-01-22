import { useMemo } from 'react'
import { formatUnits } from 'viem'
import { useContractAddress, useContractStatus } from '../services/contractAddress'
import { useContractRead, useContractReads } from 'wagmi'
import { NFT_CONFIG } from '../services/nftService'
import { useERC20Decimals, useERC20Symbol } from '../services/erc20Service'
import './TierShowcase.css'

const TIERS = Array.from({ length: 8 }, (_, index) => index)

export function TierShowcase() {
  const { address: contractAddress } = useContractAddress()
  const { hasCode: contractReady } = useContractStatus(contractAddress)

  const tierCalls = useMemo(() => {
    if (!contractAddress) return []
    return TIERS.flatMap((tier) => [
      { ...NFT_CONFIG, address: contractAddress, functionName: 'tierPrices', args: [tier] },
      { ...NFT_CONFIG, address: contractAddress, functionName: 'tierSupply', args: [tier] },
      { ...NFT_CONFIG, address: contractAddress, functionName: 'tierMinted', args: [tier] }
    ])
  }, [contractAddress])

  const { data: tierData } = useContractReads({
    contracts: tierCalls,
    enabled: Boolean(contractReady && tierCalls.length)
  })

  const { data: paymentTokenAddress } = useContractRead({
    ...NFT_CONFIG,
    address: contractAddress,
    functionName: 'paymentToken',
    enabled: Boolean(contractReady && contractAddress)
  })
  const { data: tokenDecimals } = useERC20Decimals(paymentTokenAddress)
  const { data: tokenSymbol } = useERC20Symbol(paymentTokenAddress)

  const decimalsNumber = Number(tokenDecimals ?? 18)
  const displaySymbol = tokenSymbol ?? 'PI'

  if (!contractAddress) return null

  return (
    <section className="tier-card">
      <div className="tier-header">
        <h3>等级价格与稀缺度</h3>
        <p>越高等级越稀缺、价格越高，全部使用 {displaySymbol} 支付。</p>
      </div>
      {!contractReady && <p className="tier-muted">加载合约中...</p>}
      <div className="tier-grid">
        {TIERS.map((tier, index) => {
          const base = index * 3
          const price = tierData?.[base]?.result
          const supply = tierData?.[base + 1]?.result
          const minted = tierData?.[base + 2]?.result
          const supplyNumber = Number(supply ?? 0)
          const mintedNumber = Number(minted ?? 0)
          const remaining = Math.max(supplyNumber - mintedNumber, 0)
          const priceLabel =
            price !== undefined ? `${formatUnits(price, decimalsNumber)} ${displaySymbol}` : '--'

          return (
            <div className="tier-tile" key={tier}>
              <div className="tier-label">Tier {tier + 1}</div>
              <div className="tier-price">{priceLabel}</div>
              <div className="tier-progress">
                <div
                  className="tier-progress-fill"
                  style={{
                    width: supplyNumber ? `${(mintedNumber / supplyNumber) * 100}%` : '0%'
                  }}
                />
              </div>
              <div className="tier-meta">
                <span>剩余 {remaining}</span>
                <span>已售 {mintedNumber}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
