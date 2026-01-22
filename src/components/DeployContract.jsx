import { useMemo, useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { formatGwei, parseGwei } from 'viem'
import artifact from '../contracts/AlveyNFT.artifact.json'
import { getContractAddress, setContractAddress as persistContractAddress } from '../services/contractAddress'
import './DeployContract.css'

const DEFAULT_GAS_LIMIT = '12000000'
const DEFAULT_GAS_PRICE_GWEI = '2'
const DEFAULT_PAYMENT_TOKEN = '0xfd4680e25e05b3435c7f698668d1ce80d2a9f444'
const DEFAULT_MAX_MINTS = '10'

export function DeployContract() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [gasLimit, setGasLimit] = useState(DEFAULT_GAS_LIMIT)
  const [gasPrice, setGasPrice] = useState(DEFAULT_GAS_PRICE_GWEI)
  const [paymentToken, setPaymentToken] = useState(DEFAULT_PAYMENT_TOKEN)
  const [maxMints, setMaxMints] = useState(DEFAULT_MAX_MINTS)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployError, setDeployError] = useState('')
  const [contractAddress, setContractAddress] = useState('')
  const activeAddress = getContractAddress()

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
        args: [paymentToken, BigInt(maxMints || DEFAULT_MAX_MINTS)],
        gas: gasLimitValue,
        gasPrice: gasPriceValue
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.contractAddress) {
        setContractAddress(receipt.contractAddress)
        persistContractAddress(receipt.contractAddress)
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
          <h3>一键部署合约</h3>
          <p>保持默认参数可避免部署失败。</p>
        </div>
      </div>
      <div className="deploy-form">
        <label>
          <span>支付代币地址 (PI)</span>
          <input
            type="text"
            value={paymentToken}
            onChange={(event) => setPaymentToken(event.target.value)}
          />
        </label>
        <label>
          <span>每钱包最多铸造</span>
          <input
            type="number"
            value={maxMints}
            onChange={(event) => setMaxMints(event.target.value)}
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
        {isDeploying ? '部署中...' : '部署 AlveyNFT'}
      </button>
      {deployError && <div className="message error-message">{deployError}</div>}
      {contractAddress && (
        <div className="message success-message">
          合约地址：{contractAddress}
        </div>
      )}
      <div className="deploy-hint">
        <span>默认 gas 价格: {formatGwei(parseGwei(DEFAULT_GAS_PRICE_GWEI))} gwei</span>
      </div>
      <div className="deploy-hint">
        <span>默认 8 个等级，总供应 1000，价格最低 50,000 PI。</span>
      </div>
      <div className="deploy-hint">
        <span>当前合约地址: {activeAddress || '未设置'}</span>
      </div>
    </section>
  )
}
