import { useEffect, useState } from 'react'

const STORAGE_KEY = 'alvey.marketAddress'

export function getMarketAddress() {
  return import.meta.env.VITE_MARKET_ADDRESS || localStorage.getItem(STORAGE_KEY) || ''
}

export function setMarketAddress(address) {
  if (!address) return
  localStorage.setItem(STORAGE_KEY, address)
  window.dispatchEvent(new Event('alvey:marketAddress'))
}

export function useMarketAddress() {
  const [address, setAddress] = useState(getMarketAddress())

  useEffect(() => {
    const handleUpdate = () => setAddress(getMarketAddress())
    window.addEventListener('alvey:marketAddress', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('alvey:marketAddress', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  return { address, setAddress: setMarketAddress }
}
