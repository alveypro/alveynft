import { useEffect, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { useContractAddress, useContractStatus } from '../services/contractAddress'
import { useMarketAddress } from '../services/marketAddress'
import {
  MARKET_ABI,
  useMarketAuctionCount,
  useMarketBid,
  useMarketBuyListing,
  useMarketCancelAuction,
  useMarketCancelListing,
  useMarketCreateAuction,
  useMarketCreateListing,
  useMarketListingCount,
  useMarketPaymentToken,
  useMarketSettleAuction
} from '../services/marketService'
import {
  useNFTIsApprovedForAll,
  useNFTSetApprovalForAll,
  NFT_CONFIG
} from '../services/nftService'
import {
  useERC20Allowance,
  useERC20Approve,
  useERC20Decimals,
  useERC20Symbol
} from '../services/erc20Service'
import { fetchIpfsJson, toGatewayUrl } from '../services/ipfsService'
import { DEFAULT_NFT_IMAGE } from '../services/defaults'
import './Marketplace.css'

export function Marketplace() {
  const publicClient = usePublicClient()
  const { address } = useAccount()
  const { address: nftAddress } = useContractAddress()
  const { address: marketAddress, setAddress: setMarketAddress } = useMarketAddress()
  const { hasCode: marketReady } = useContractStatus(marketAddress)
  const { data: listingCount } = useMarketListingCount(marketAddress, marketReady)
  const { data: auctionCount } = useMarketAuctionCount(marketAddress, marketReady)
  const { data: paymentToken } = useMarketPaymentToken(marketAddress, marketReady)
  const { data: tokenDecimals } = useERC20Decimals(paymentToken)
  const { data: tokenSymbol } = useERC20Symbol(paymentToken)
  const { data: isApprovedForAll } = useNFTIsApprovedForAll(nftAddress, address, marketAddress, marketReady)
  const { write: setApprovalForAll, isLoading: isApprovingNFT } = useNFTSetApprovalForAll(nftAddress)
  const { write: approveToken, isLoading: isApprovingToken } = useERC20Approve(paymentToken)
  const { data: tokenAllowance } = useERC20Allowance(paymentToken, address, marketAddress)
  const { write: createListing, isLoading: isCreatingListing } = useMarketCreateListing(marketAddress)
  const { write: cancelListing } = useMarketCancelListing(marketAddress)
  const { write: buyListing } = useMarketBuyListing(marketAddress)
  const { write: createAuction, isLoading: isCreatingAuction } = useMarketCreateAuction(marketAddress)
  const { write: bid } = useMarketBid(marketAddress)
  const { write: cancelAuction } = useMarketCancelAuction(marketAddress)
  const { write: settleAuction } = useMarketSettleAuction(marketAddress)

  const decimals = Number(tokenDecimals ?? 18)
  const symbol = tokenSymbol ?? 'PI'

  const [marketInput, setMarketInput] = useState(marketAddress || '')
  const [listings, setListings] = useState([])
  const [auctions, setAuctions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [listTokenId, setListTokenId] = useState('')
  const [listPrice, setListPrice] = useState('')
  const [auctionTokenId, setAuctionTokenId] = useState('')
  const [auctionReserve, setAuctionReserve] = useState('')
  const [auctionDuration, setAuctionDuration] = useState('24')
  const [bidValues, setBidValues] = useState({})
  const hasEnvMarket = Boolean(import.meta.env.VITE_MARKET_ADDRESS)

  useEffect(() => {
    setMarketInput(marketAddress || '')
  }, [marketAddress])

  const refreshListings = async () => {
    if (!publicClient || !marketAddress || !marketReady) return
    setIsLoading(true)
    const next = []
    const count = Number(listingCount ?? 0)
    const limit = Math.min(count, 100)
    for (let id = 1; id <= limit; id += 1) {
      try {
        const listing = await publicClient.readContract({
          abi: MARKET_ABI,
          address: marketAddress,
          functionName: 'listings',
          args: [BigInt(id)]
        })
        if (!listing?.[3]) continue
        const tokenId = Number(listing[1])
        let name = `Token #${tokenId}`
        let image = DEFAULT_NFT_IMAGE
        let tierLabel = '-'
        try {
          const tokenTier = await publicClient.readContract({
            ...NFT_CONFIG,
            address: nftAddress,
            functionName: 'tokenTier',
            args: [BigInt(tokenId)]
          })
          tierLabel = `Tier ${Number(tokenTier) + 1}`
          const tokenUri = await publicClient.readContract({
            ...NFT_CONFIG,
            address: nftAddress,
            functionName: 'tokenURI',
            args: [BigInt(tokenId)]
          })
          const metadata = await fetchIpfsJson(tokenUri)
          if (metadata?.name) name = metadata.name
          if (metadata?.image || metadata?.image_url) {
            image = toGatewayUrl(metadata.image || metadata.image_url)
          }
        } catch {
          // ignore metadata failures
        }
        next.push({
          id,
          seller: listing[0],
          tokenId,
          price: listing[2],
          name,
          image,
          tierLabel
        })
      } catch {
        // ignore
      }
    }
    setListings(next)
    setIsLoading(false)
  }

  const refreshAuctions = async () => {
    if (!publicClient || !marketAddress || !marketReady) return
    setIsLoading(true)
    const next = []
    const count = Number(auctionCount ?? 0)
    const limit = Math.min(count, 100)
    for (let id = 1; id <= limit; id += 1) {
      try {
        const auction = await publicClient.readContract({
          abi: MARKET_ABI,
          address: marketAddress,
          functionName: 'auctions',
          args: [BigInt(id)]
        })
        if (!auction || auction[6]) continue
        const tokenId = Number(auction[1])
        let name = `Token #${tokenId}`
        let image = DEFAULT_NFT_IMAGE
        let tierLabel = '-'
        try {
          const tokenTier = await publicClient.readContract({
            ...NFT_CONFIG,
            address: nftAddress,
            functionName: 'tokenTier',
            args: [BigInt(tokenId)]
          })
          tierLabel = `Tier ${Number(tokenTier) + 1}`
          const tokenUri = await publicClient.readContract({
            ...NFT_CONFIG,
            address: nftAddress,
            functionName: 'tokenURI',
            args: [BigInt(tokenId)]
          })
          const metadata = await fetchIpfsJson(tokenUri)
          if (metadata?.name) name = metadata.name
          if (metadata?.image || metadata?.image_url) {
            image = toGatewayUrl(metadata.image || metadata.image_url)
          }
        } catch {
          // ignore
        }
        next.push({
          id,
          seller: auction[0],
          tokenId,
          reservePrice: auction[2],
          highestBid: auction[3],
          highestBidder: auction[4],
          endTime: Number(auction[5]),
          name,
          image,
          tierLabel
        })
      } catch {
        // ignore
      }
    }
    setAuctions(next)
    setIsLoading(false)
  }

  useEffect(() => {
    if (marketReady) {
      refreshListings()
      refreshAuctions()
    }
  }, [marketReady, listingCount, auctionCount])

  const handleSaveMarket = () => {
    if (!marketInput) return
    setMarketAddress(marketInput.trim())
  }

  const handleList = () => {
    if (!listTokenId || !listPrice) return
    const price = parseUnits(listPrice, decimals)
    createListing?.({ args: [BigInt(listTokenId), price] })
  }

  const handleCreateAuction = () => {
    if (!auctionTokenId || !auctionReserve || !auctionDuration) return
    const reserve = parseUnits(auctionReserve, decimals)
    const durationSeconds = Number(auctionDuration) * 3600
    createAuction?.({ args: [BigInt(auctionTokenId), reserve, BigInt(durationSeconds)] })
  }

  const formatPrice = (value) => formatUnits(value ?? 0n, decimals)

  const approvalNeeded = isApprovedForAll === false

  return (
    <section className="market-card">
      <div className="market-header">
        <div>
          <h3>买卖区 / 竞价区</h3>
          <p>固定价上架与竞价拍卖，手续费 2.5% 自动分配。</p>
        </div>
        <button className="market-refresh" onClick={() => { refreshListings(); refreshAuctions(); }}>
          刷新
        </button>
      </div>

      <div className="market-address">
        {hasEnvMarket ? (
          <>
            <span>市场合约地址</span>
            <span className="market-address-value">{marketAddress || '未设置'}</span>
          </>
        ) : (
          <>
            <input
              type="text"
              value={marketInput}
              onChange={(event) => setMarketInput(event.target.value)}
              placeholder="市场合约地址 (0x...)"
            />
            <button onClick={handleSaveMarket}>保存</button>
          </>
        )}
        {marketAddress && (
          <span className={marketReady ? 'ready' : 'not-ready'}>
            {marketReady ? '已检测到市场合约' : '未检测到市场合约'}
          </span>
        )}
      </div>

      {marketReady && (
        <>
          <div className="market-actions">
            <div className="market-box">
              <h4>固定价上架</h4>
              <div className="market-form">
                <input
                  type="number"
                  placeholder="Token ID"
                  value={listTokenId}
                  onChange={(event) => setListTokenId(event.target.value)}
                />
                <input
                  type="number"
                  placeholder={`价格 (${symbol})`}
                  value={listPrice}
                  onChange={(event) => setListPrice(event.target.value)}
                />
                <button onClick={handleList} disabled={isCreatingListing}>
                  {isCreatingListing ? '上架中...' : '上架'}
                </button>
              </div>
              <div className="market-approve">
                <button
                  onClick={() => setApprovalForAll?.({ args: [marketAddress, true] })}
                  disabled={!approvalNeeded || isApprovingNFT}
                >
                  {approvalNeeded ? (isApprovingNFT ? '授权中...' : '授权市场合约转移NFT') : '已授权'}
                </button>
              </div>
            </div>

            <div className="market-box">
              <h4>竞价拍卖</h4>
              <div className="market-form">
                <input
                  type="number"
                  placeholder="Token ID"
                  value={auctionTokenId}
                  onChange={(event) => setAuctionTokenId(event.target.value)}
                />
                <input
                  type="number"
                  placeholder={`起拍价 (${symbol})`}
                  value={auctionReserve}
                  onChange={(event) => setAuctionReserve(event.target.value)}
                />
                <input
                  type="number"
                  placeholder="时长(小时)"
                  value={auctionDuration}
                  onChange={(event) => setAuctionDuration(event.target.value)}
                />
                <button onClick={handleCreateAuction} disabled={isCreatingAuction}>
                  {isCreatingAuction ? '创建中...' : '创建拍卖'}
                </button>
              </div>
              <div className="market-approve">
                <button
                  onClick={() => setApprovalForAll?.({ args: [marketAddress, true] })}
                  disabled={!approvalNeeded || isApprovingNFT}
                >
                  {approvalNeeded ? (isApprovingNFT ? '授权中...' : '授权市场合约转移NFT') : '已授权'}
                </button>
              </div>
            </div>
          </div>

          <div className="market-grid">
            <div>
              <h4>当前上架</h4>
              {listings.length ? (
                <div className="market-list">
                  {listings.map((item) => {
                    const needsAllowance =
                      tokenAllowance !== undefined && tokenAllowance < item.price
                    return (
                      <div key={item.id} className="market-item">
                        <div className="market-image">
                          <img src={item.image} alt={item.name} />
                        </div>
                        <div className="market-info">
                          <div className="market-title">{item.name}</div>
                          <div className="market-meta">
                            Token #{item.tokenId} · {item.tierLabel}
                          </div>
                          <div className="market-price">{formatPrice(item.price)} {symbol}</div>
                        </div>
                        <div className="market-actions-inline">
                          {address && address.toLowerCase() === item.seller.toLowerCase() ? (
                            <button onClick={() => cancelListing?.({ args: [BigInt(item.id)] })}>
                              取消
                            </button>
                          ) : (
                            <>
                              {needsAllowance && (
                                <button
                                  onClick={() => approveToken?.({ args: [marketAddress, item.price] })}
                                  disabled={isApprovingToken}
                                >
                                  {isApprovingToken ? '授权中...' : '授权购买'}
                                </button>
                              )}
                              <button onClick={() => buyListing?.({ args: [BigInt(item.id)] })}>
                                购买
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p>暂无上架。</p>
              )}
            </div>
            <div>
              <h4>竞价拍卖</h4>
              {auctions.length ? (
                <div className="market-list">
                  {auctions.map((item) => {
                    const bidValue = bidValues[item.id] || ''
                    const bidAmount = bidValue ? parseUnits(bidValue, decimals) : 0n
                    const needsAllowance =
                      tokenAllowance !== undefined && tokenAllowance < bidAmount
                    return (
                      <div key={item.id} className="market-item">
                        <div className="market-image">
                          <img src={item.image} alt={item.name} />
                        </div>
                        <div className="market-info">
                          <div className="market-title">{item.name}</div>
                          <div className="market-meta">
                            Token #{item.tokenId} · {item.tierLabel}
                          </div>
                          <div className="market-price">
                            最高出价 {formatPrice(item.highestBid)} {symbol}
                          </div>
                          <div className="market-meta">
                            结束时间 {new Date(item.endTime * 1000).toLocaleString()}
                          </div>
                        </div>
                        <div className="market-actions-inline">
                          {address && address.toLowerCase() === item.seller.toLowerCase() ? (
                            <>
                              <button onClick={() => cancelAuction?.({ args: [BigInt(item.id)] })}>
                                取消
                              </button>
                              <button onClick={() => settleAuction?.({ args: [BigInt(item.id)] })}>
                                结算
                              </button>
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                placeholder={`出价(${symbol})`}
                                value={bidValue}
                                onChange={(event) =>
                                  setBidValues((prev) => ({ ...prev, [item.id]: event.target.value }))
                                }
                              />
                              {needsAllowance && (
                                <button
                                  onClick={() => approveToken?.({ args: [marketAddress, bidAmount] })}
                                  disabled={isApprovingToken}
                                >
                                  {isApprovingToken ? '授权中...' : '授权出价'}
                                </button>
                              )}
                              <button
                                onClick={() => bid?.({ args: [BigInt(item.id), bidAmount] })}
                                disabled={!bidValue}
                              >
                                出价
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p>暂无拍卖。</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
