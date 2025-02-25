import { useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function ConnectButton() {
  const { connect, status, error } = useConnect()

  return (
    <div className="connect-button-container">
      <button
        onClick={() => connect({ connector: injected() })}
        disabled={status === 'connecting'}
        className="connect-button"
      >
        {status === 'connecting' ? '连接中...' : '连接钱包'}
      </button>
      {error && <div className="error-message">{error.message}</div>}
    </div>
  )
}