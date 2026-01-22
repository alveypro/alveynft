import { useMemo, useState } from 'react'
import { parseUnits } from 'viem'
import {
  useNFTOwner,
  useNFTPaymentToken,
  useNFTRevealed,
  useNFTSalePhase,
  useNFTSetAllowlist,
  useNFTSetBaseURI,
  useNFTSetHiddenURI,
  useNFTSetMaxMints,
  useNFTSetRevealed,
  useNFTSetRoyalty,
  useNFTSetSalePhase,
  useNFTSetTierPrice,
  useNFTSetTierSupply,
  useNFTWithdraw,
  useNFTOwnerMint,
  useNFTTransferOwnership
} from '../services/nftService'
import { useERC20Decimals } from '../services/erc20Service'
import { useContractAddress, useContractStatus } from '../services/contractAddress'
import { useAccount } from 'wagmi'
import './AdminPanel.css'

const TIER_COUNT = 8

function parseAddresses(input) {
  return input
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

export function AdminPanel() {
  const { address } = useAccount()
  const { address: contractAddress } = useContractAddress()
  const { hasCode: contractReady } = useContractStatus(contractAddress)
  const { data: owner } = useNFTOwner(contractAddress, contractReady)
  const { data: salePhase } = useNFTSalePhase(contractAddress, contractReady)
  const { data: revealed } = useNFTRevealed(contractAddress, contractReady)
  const { data: paymentToken } = useNFTPaymentToken(contractAddress, contractReady)
  const { data: tokenDecimals } = useERC20Decimals(paymentToken)
  const { write: setSalePhase } = useNFTSetSalePhase(contractAddress)
  const { write: setAllowlist } = useNFTSetAllowlist(contractAddress)
  const { write: setBaseURI } = useNFTSetBaseURI(contractAddress)
  const { write: setHiddenURI } = useNFTSetHiddenURI(contractAddress)
  const { write: setRevealed } = useNFTSetRevealed(contractAddress)
  const { write: setTierPrice } = useNFTSetTierPrice(contractAddress)
  const { write: setTierSupply } = useNFTSetTierSupply(contractAddress)
  const { write: setMaxMints } = useNFTSetMaxMints(contractAddress)
  const { write: setRoyalty } = useNFTSetRoyalty(contractAddress)
  const { write: withdraw } = useNFTWithdraw(contractAddress)
  const { write: ownerMint } = useNFTOwnerMint(contractAddress)
  const { write: transferOwnership } = useNFTTransferOwnership(contractAddress)

  const isOwner = useMemo(
    () => Boolean(address && owner && address.toLowerCase() === owner.toLowerCase()),
    [address, owner]
  )
  const decimalsNumber = Number(tokenDecimals ?? 18)

  const [phaseInput, setPhaseInput] = useState('0')
  const [allowlistInput, setAllowlistInput] = useState('')
  const [allowlistMode, setAllowlistMode] = useState('add')
  const [baseURI, setBaseURIValue] = useState('')
  const [hiddenURI, setHiddenURIValue] = useState('')
  const [tierInput, setTierInput] = useState('0')
  const [tierPrice, setTierPriceValue] = useState('')
  const [tierSupply, setTierSupplyValue] = useState('')
  const [maxMints, setMaxMintsValue] = useState('10')
  const [royaltyReceiver, setRoyaltyReceiver] = useState('')
  const [royaltyBps, setRoyaltyBps] = useState('500')
  const [withdrawTo, setWithdrawTo] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [airdropTo, setAirdropTo] = useState('')
  const [airdropTier, setAirdropTier] = useState('0')
  const [airdropUri, setAirdropUri] = useState('')
  const [newOwner, setNewOwner] = useState('')

  if (!contractAddress) {
    return null
  }

  if (!contractReady) {
    return (
      <section className="admin-card">
        <h3>管理面板</h3>
        <p>未检测到合约代码，请确认已部署并切换到 AlveyChain。</p>
      </section>
    )
  }

  if (!isOwner) {
    return (
      <section className="admin-card">
        <h3>管理面板</h3>
        <p>仅合约所有者可操作管理功能。</p>
      </section>
    )
  }

  return (
    <section className="admin-card">
      <h3>管理面板</h3>

      <div className="admin-grid">
        <div className="admin-block">
          <h4>销售阶段</h4>
          <select value={phaseInput} onChange={(event) => setPhaseInput(event.target.value)}>
            <option value="0">Paused</option>
            <option value="1">Allowlist</option>
            <option value="2">Public</option>
          </select>
          <button onClick={() => setSalePhase?.({ args: [Number(phaseInput)] })}>
            更新阶段 (当前: {Number(salePhase ?? 0)})
          </button>
        </div>

        <div className="admin-block">
          <h4>白名单管理</h4>
          <textarea
            rows="4"
            value={allowlistInput}
            onChange={(event) => setAllowlistInput(event.target.value)}
            placeholder="每行一个地址"
          />
          <div className="admin-inline">
            <select value={allowlistMode} onChange={(event) => setAllowlistMode(event.target.value)}>
              <option value="add">加入白名单</option>
              <option value="remove">移出白名单</option>
            </select>
            <button
              onClick={() =>
                setAllowlist?.({
                  args: [parseAddresses(allowlistInput), allowlistMode === 'add']
                })
              }
            >
              应用白名单
            </button>
          </div>
        </div>

        <div className="admin-block">
          <h4>URI 与 Reveal</h4>
          <input
            type="text"
            placeholder="Base URI"
            value={baseURI}
            onChange={(event) => setBaseURIValue(event.target.value)}
          />
          <button onClick={() => setBaseURI?.({ args: [baseURI] })}>设置 Base URI</button>
          <input
            type="text"
            placeholder="Hidden URI"
            value={hiddenURI}
            onChange={(event) => setHiddenURIValue(event.target.value)}
          />
          <button onClick={() => setHiddenURI?.({ args: [hiddenURI] })}>设置 Hidden URI</button>
          <button onClick={() => setRevealed?.({ args: [!revealed] })}>
            {revealed ? '关闭 Reveal' : '开启 Reveal'}
          </button>
        </div>

        <div className="admin-block">
          <h4>等级价格与库存</h4>
          <select value={tierInput} onChange={(event) => setTierInput(event.target.value)}>
            {Array.from({ length: TIER_COUNT }, (_, index) => (
              <option value={index} key={index}>
                Tier {index + 1}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="价格 (PI)"
            value={tierPrice}
            onChange={(event) => setTierPriceValue(event.target.value)}
          />
          <button
            onClick={() =>
              setTierPrice?.({
                args: [Number(tierInput), parseUnits(tierPrice || '0', decimalsNumber)]
              })
            }
          >
            更新价格
          </button>
          <input
            type="number"
            placeholder="库存"
            value={tierSupply}
            onChange={(event) => setTierSupplyValue(event.target.value)}
          />
          <button
            onClick={() =>
              setTierSupply?.({ args: [Number(tierInput), BigInt(tierSupply || '0')] })
            }
          >
            更新库存
          </button>
        </div>

        <div className="admin-block">
          <h4>铸造限制</h4>
          <input
            type="number"
            placeholder="每钱包最多铸造"
            value={maxMints}
            onChange={(event) => setMaxMintsValue(event.target.value)}
          />
          <button onClick={() => setMaxMints?.({ args: [BigInt(maxMints || '0')] })}>
            更新限制
          </button>
        </div>

        <div className="admin-block">
          <h4>版税</h4>
          <input
            type="text"
            placeholder="接收地址"
            value={royaltyReceiver}
            onChange={(event) => setRoyaltyReceiver(event.target.value)}
          />
          <input
            type="number"
            placeholder="bps (100=1%)"
            value={royaltyBps}
            onChange={(event) => setRoyaltyBps(event.target.value)}
          />
          <button
            onClick={() =>
              setRoyalty?.({ args: [royaltyReceiver, Number(royaltyBps || 0)] })
            }
          >
            更新版税
          </button>
        </div>

        <div className="admin-block">
          <h4>资金提取</h4>
          <input
            type="text"
            placeholder="收款地址"
            value={withdrawTo}
            onChange={(event) => setWithdrawTo(event.target.value)}
          />
          <input
            type="text"
            placeholder="金额 (PI)"
            value={withdrawAmount}
            onChange={(event) => setWithdrawAmount(event.target.value)}
          />
          <button
            onClick={() =>
              withdraw?.({
                args: [withdrawTo, parseUnits(withdrawAmount || '0', decimalsNumber)]
              })
            }
          >
            提取 PI
          </button>
        </div>

        <div className="admin-block">
          <h4>空投</h4>
          <input
            type="text"
            placeholder="接收地址"
            value={airdropTo}
            onChange={(event) => setAirdropTo(event.target.value)}
          />
          <select value={airdropTier} onChange={(event) => setAirdropTier(event.target.value)}>
            {Array.from({ length: TIER_COUNT }, (_, index) => (
              <option value={index} key={index}>
                Tier {index + 1}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Token URI"
            value={airdropUri}
            onChange={(event) => setAirdropUri(event.target.value)}
          />
          <button
            onClick={() =>
              ownerMint?.({ args: [airdropTo, Number(airdropTier), airdropUri] })
            }
          >
            发送空投
          </button>
        </div>

        <div className="admin-block">
          <h4>转移所有权</h4>
          <input
            type="text"
            placeholder="新 Owner 地址"
            value={newOwner}
            onChange={(event) => setNewOwner(event.target.value)}
          />
          <button onClick={() => transferOwnership?.({ args: [newOwner] })}>
            转移所有权
          </button>
        </div>
      </div>
    </section>
  )
}
