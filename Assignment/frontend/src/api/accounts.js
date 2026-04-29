import client from './client'

export const getAccounts = () => client.get('/accounts')
export const createAccount = (name) => client.post('/accounts', { name })
export const getDealershipsForAccount = (accountId) =>
  client.get(`/accounts/${accountId}/dealerships`)
