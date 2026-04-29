import client from './client'

export const uploadAsset = (file, assetType) => {
  const form = new FormData()
  form.append('file', file)
  form.append('asset_type', assetType)
  return client.post('/assets/upload', form)
}

export const getAssets = () => client.get('/assets')
export const deleteAsset = (id) => client.delete(`/assets/${id}`)
