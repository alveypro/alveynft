import { useEffect, useState } from 'react'
import { useContractAddress } from '../services/contractAddress'
import { getTokenExplorerUrl } from '../services/explorer'
import { clearMintHistory, getMintHistory } from '../services/mintHistory'
import './MintHistory.css'

export function MintHistory() {
  const [history, setHistory] = useState([])
  const [copyStatus, setCopyStatus] = useState('')
  const { address: contractAddress } = useContractAddress()

  useEffect(() => {
    setHistory(getMintHistory())
  }, [])

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

  if (!history.length) {
    return (
      <section className="history-card">
        <h3>铸造记录</h3>
        <p>暂无铸造记录。</p>
      </section>
    )
  }

  return (
    <section className="history-card">
      <div className="history-header">
        <h3>铸造记录</h3>
        <button
          className="history-clear"
          onClick={() => {
            clearMintHistory()
            setHistory([])
          }}
        >
          清空记录
        </button>
      </div>
      <div className="history-list">
        {history.map((item) => (
          <div className="history-item" key={item.id}>
            <div>
              <div className="history-title">{item.name}</div>
              <div className="history-meta">
                Tier {item.tier}
                {item.tokenId !== undefined && item.tokenId !== null && (
                  <>
                    <span className="history-token">Token #{item.tokenId}</span>
                    <button
                      type="button"
                      className="history-copy"
                      onClick={() => handleCopy(item.tokenId)}
                    >
                      复制
                    </button>
                    {contractAddress && (
                      <a
                        className="history-link"
                        href={getTokenExplorerUrl(contractAddress, item.tokenId)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        浏览器查看
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className={`history-status ${item.status}`}>{item.status}</div>
          </div>
        ))}
      </div>
      {copyStatus && <div className="history-copy-status">{copyStatus}</div>}
    </section>
  )
}
