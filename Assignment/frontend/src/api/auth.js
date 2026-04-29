import client from './client'

export const login = (email, password) => {
  // FastAPI OAuth2 expects form data, not JSON
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  return client.post('/auth/login', form)
}

export const register = (email, password) =>
  client.post('/auth/register', { email, password })

export const getMe = () => client.get('/auth/me')
