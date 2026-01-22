const NFT_STORAGE_UPLOAD_URL = 'https://api.nft.storage/upload'

function buildMetadata({ name, description, image, attributes }) {
  return {
    name: name?.trim() || 'AlveyChain NFT',
    description: description?.trim() || 'Minted on AlveyChain',
    image: image || '',
    attributes: attributes || []
  }
}

function encodeMetadataDataUri(metadata) {
  const json = JSON.stringify(metadata)
  return `data:application/json;utf8,${encodeURIComponent(json)}`
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function uploadToNftStorage({ token, body, contentType }) {
  const response = await fetch(NFT_STORAGE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(contentType ? { 'Content-Type': contentType } : {})
    },
    body
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'NFT.storage upload failed')
  }

  const data = await response.json()
  return data?.value?.cid
}

export async function createTokenUri({
  name,
  description,
  imageUrl,
  imageFile,
  attributes
}) {
  const token = import.meta.env.VITE_NFT_STORAGE_TOKEN
  const fallbackImage = imageFile ? await readFileAsDataUrl(imageFile) : imageUrl

  if (!token) {
    const metadata = buildMetadata({ name, description, image: fallbackImage, attributes })
    return encodeMetadataDataUri(metadata)
  }

  try {
    let resolvedImage = imageUrl
    if (imageFile) {
      const cid = await uploadToNftStorage({
        token,
        body: imageFile
      })
      resolvedImage = `ipfs://${cid}`
    }

    const metadata = buildMetadata({ name, description, image: resolvedImage, attributes })
    const metadataCid = await uploadToNftStorage({
      token,
      body: JSON.stringify(metadata),
      contentType: 'application/json'
    })

    return `ipfs://${metadataCid}`
  } catch {
    const metadata = buildMetadata({ name, description, image: fallbackImage, attributes })
    return encodeMetadataDataUri(metadata)
  }
}
