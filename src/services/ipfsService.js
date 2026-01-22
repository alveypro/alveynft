const NFT_STORAGE_UPLOAD_URL = 'https://api.nft.storage/upload'
const PINATA_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
const PINATA_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

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

async function uploadFileToPinata({ token, file }) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(PINATA_FILE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Pinata file upload failed')
  }

  const data = await response.json()
  return data?.IpfsHash
}

async function uploadJsonToPinata({ token, json }) {
  const response = await fetch(PINATA_JSON_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(json)
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Pinata JSON upload failed')
  }

  const data = await response.json()
  return data?.IpfsHash
}

export async function createTokenUri({
  name,
  description,
  imageUrl,
  imageFile,
  attributes
}) {
  const nftStorageToken = import.meta.env.VITE_NFT_STORAGE_TOKEN
  const pinataToken = import.meta.env.VITE_PINATA_JWT
  const fallbackImage = imageFile ? await readFileAsDataUrl(imageFile) : imageUrl

  if (!nftStorageToken && !pinataToken) {
    const metadata = buildMetadata({ name, description, image: fallbackImage, attributes })
    return encodeMetadataDataUri(metadata)
  }

  try {
    let resolvedImage = imageUrl
    if (imageFile) {
      if (pinataToken) {
        const cid = await uploadFileToPinata({ token: pinataToken, file: imageFile })
        resolvedImage = `ipfs://${cid}`
      } else if (nftStorageToken) {
        const cid = await uploadToNftStorage({
          token: nftStorageToken,
          body: imageFile
        })
        resolvedImage = `ipfs://${cid}`
      }
    }

    const metadata = buildMetadata({ name, description, image: resolvedImage, attributes })
    let metadataCid = ''
    if (pinataToken) {
      metadataCid = await uploadJsonToPinata({ token: pinataToken, json: metadata })
    } else if (nftStorageToken) {
      metadataCid = await uploadToNftStorage({
        token: nftStorageToken,
        body: JSON.stringify(metadata),
        contentType: 'application/json'
      })
    }

    return metadataCid ? `ipfs://${metadataCid}` : encodeMetadataDataUri(metadata)
  } catch {
    const metadata = buildMetadata({ name, description, image: fallbackImage, attributes })
    return encodeMetadataDataUri(metadata)
  }
}
