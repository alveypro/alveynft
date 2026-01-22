import { useEffect, useState } from 'react'
import { clearMintHistory, getMintHistory } from '../services/mintHistory'
import './MintHistory.css'

export function MintHistory() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    setHistory(getMintHistory())
  }, [])

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
              <div className="history-meta">Tier {item.tier}</div>
            </div>
            <div className={`history-status ${item.status}`}>{item.status}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
