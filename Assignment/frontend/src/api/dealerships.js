import client from './client'

export const getDealerships = (accountId) =>
  client.get('/dealerships', { params: accountId ? { account_id: accountId } : {} })

export const createDealership = (data) => client.post('/dealerships', data)

export const uploadDealershipLogo = (dealershipId, file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post(`/dealerships/${dealershipId}/upload-logo`, form)
}

export const uploadDealershipPanel = (dealershipId, file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post(`/dealerships/${dealershipId}/upload-panel`, form)
}
