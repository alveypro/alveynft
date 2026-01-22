import { useMemo, useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { formatGwei, parseGwei } from 'viem'
import artifact from '../contracts/AlveyMarketplace.artifact.json'
import { getContractAddress } from '../services/contractAddress'
import { getMarketAddress, setMarketAddress as persistMarketAddress } from '../services/marketAddress'
import './DeployContract.css'

const DEFAULT_GAS_LIMIT = '12000000'
const DEFAULT_GAS_PRICE_GWEI = '2'
const DEFAULT_PAYMENT_TOKEN = '0xfd4680e25e05b3435c7f698668d1ce80d2a9f444'
const DEFAULT_FEE_BPS = '250'
const DEFAULT_FEE_RECIPIENT = '0xe9C462352a3Ea3fC2585269A4A1aF40F3700ebCB'

export function DeployMarket() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [gasLimit, setGasLimit] = useState(DEFAULT_GAS_LIMIT)
  const [gasPrice, setGasPrice] = useState(DEFAULT_GAS_PRICE_GWEI)
  const [nftAddress, setNftAddress] = useState(getContractAddress())
  const [paymentToken, setPaymentToken] = useState(DEFAULT_PAYMENT_TOKEN)
  const [feeRecipient, setFeeRecipient] = useState(DEFAULT_FEE_RECIPIENT)
  const [feeBps, setFeeBps] = useState(DEFAULT_FEE_BPS)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployError, setDeployError] = useState('')
  const [contractAddress, setContractAddress] = useState('')
  const activeAddress = getMarketAddress()

  const gasLimitValue = useMemo(() => {
    const parsed = Number(gasLimit)
    return Number.isFinite(parsed) ? BigInt(parsed) : undefined
  }, [gasLimit])

  const gasPriceValue = useMemo(() => {
    try {
      return parseGwei(gasPrice || DEFAULT_GAS_PRICE_GWEI)
    } catch {
      return undefined
    }
  }, [gasPrice])

  const handleDeploy = async () => {
    if (!walletClient || !publicClient || !address) return

    try {
      setDeployError('')
      setContractAddress('')
      setIsDeploying(true)

      const hash = await walletClient.deployContract({
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        args: [nftAddress, paymentToken, feeRecipient, BigInt(feeBps || DEFAULT_FEE_BPS)],
        gas: gasLimitValue,
        gasPrice: gasPriceValue
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.contractAddress) {
        setContractAddress(receipt.contractAddress)
        persistMarketAddress(receipt.contractAddress)
      } else {
        setDeployError('合约地址未返回，请在区块浏览器里确认')
      }
    } catch (error) {
      setDeployError(error?.message || '部署失败')
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <section className="deploy-card">
      <div className="deploy-header">
        <div>
          <h3>部署市场合约</h3>
          <p>固定价 + 竞价拍卖，手续费 2.5%。</p>
        </div>
      </div>
      <div className="deploy-form">
        <label>
          <span>NFT 合约地址</span>
          <input
            type="text"
            value={nftAddress}
            onChange={(event) => setNftAddress(event.target.value)}
          />
        </label>
        <label>
          <span>支付代币地址 (PI)</span>
          <input
            type="text"
            value={paymentToken}
            onChange={(event) => setPaymentToken(event.target.value)}
          />
        </label>
        <label>
          <span>手续费接收地址</span>
          <input
            type="text"
            value={feeRecipient}
            onChange={(event) => setFeeRecipient(event.target.value)}
          />
        </label>
        <label>
          <span>手续费 BPS (2.5% = 250)</span>
          <input
            type="number"
            value={feeBps}
            onChange={(event) => setFeeBps(event.target.value)}
          />
        </label>
        <label>
          <span>Gas Limit</span>
          <input
            type="number"
            value={gasLimit}
            onChange={(event) => setGasLimit(event.target.value)}
          />
        </label>
        <label>
          <span>Gas Price (gwei)</span>
          <input
            type="number"
            value={gasPrice}
            onChange={(event) => setGasPrice(event.target.value)}
          />
        </label>
      </div>
      <button
        className="mint-button deploy-button"
        onClick={handleDeploy}
        disabled={!address || isDeploying}
      >
        {isDeploying ? '部署中...' : '部署市场合约'}
      </button>
      {deployError && <div className="message error-message">{deployError}</div>}
      {contractAddress && (
        <div className="message success-message">市场合约地址：{contractAddress}</div>
      )}
      <div className="deploy-hint">
        <span>默认 gas 价格: {formatGwei(parseGwei(DEFAULT_GAS_PRICE_GWEI))} gwei</span>
      </div>
      <div className="deploy-hint">
        <span>当前市场地址: {activeAddress || '未设置'}</span>
      </div>
    </section>
  )
}
