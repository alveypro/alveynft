const STORAGE_KEY = 'alvey.mintHistory'

export function getMintHistory() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addMintHistory(entry) {
  const history = getMintHistory()
  const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  const next = [{ id, ...entry }, ...history].slice(0, 50)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return id
}

export function updateMintHistory(id, updates) {
  const history = getMintHistory()
  const next = history.map((item) => (item.id === id ? { ...item, ...updates } : item))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function clearMintHistory() {
  localStorage.removeItem(STORAGE_KEY)
}
