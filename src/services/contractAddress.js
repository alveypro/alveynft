import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'

const STORAGE_KEY = 'alvey.contractAddress'

export function getContractAddress() {
  return import.meta.env.VITE_CONTRACT_ADDRESS || localStorage.getItem(STORAGE_KEY) || ''
}

export function setContractAddress(address) {
  if (!address) return
  localStorage.setItem(STORAGE_KEY, address)
  window.dispatchEvent(new Event('alvey:contractAddress'))
}

export function useContractAddress() {
  const [address, setAddress] = useState(getContractAddress())

  useEffect(() => {
    const handleUpdate = () => setAddress(getContractAddress())
    window.addEventListener('alvey:contractAddress', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('alvey:contractAddress', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  return { address, setAddress: setContractAddress }
}

export function useContractStatus(address) {
  const publicClient = usePublicClient()
  const [hasCode, setHasCode] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true
    const checkCode = async () => {
      if (!publicClient || !address) {
        setHasCode(false)
        return
      }

      try {
        setIsChecking(true)
        const bytecode = await publicClient.getBytecode({ address })
        if (!isActive) return
        setHasCode(Boolean(bytecode && bytecode !== '0x'))
        setError('')
      } catch (err) {
        if (!isActive) return
        setHasCode(false)
        setError(err?.message || '读取合约失败')
      } finally {
        if (isActive) {
          setIsChecking(false)
        }
      }
    }

    checkCode()
    return () => {
      isActive = false
    }
  }, [address, publicClient])

  return { hasCode, isChecking, error }
}
