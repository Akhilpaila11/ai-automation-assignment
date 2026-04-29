import { useEffect, useState } from 'react'
import { getAccounts, createAccount, getDealershipsForAccount } from '../api/accounts'
import { createDealership, uploadDealershipLogo, uploadDealershipPanel } from '../api/dealerships'

const API = 'http://localhost:8000'

function DealershipRow({ d, onUpdated }) {
  const [uploading, setUploading] = useState(null)

  const handleUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(type)
    try {
      const fn = type === 'logo' ? uploadDealershipLogo : uploadDealershipPanel
      const { data } = await fn(d.id, file)
      onUpdated(data)
    } catch {
      alert('Upload failed')
    }
    setUploading(null)
    e.target.value = ''
  }

  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 8, padding: 16,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 10, background: 'white'
    }}>
      <div style={{ flex: 1 }}>
        <strong>{d.name}</strong>
        {d.brand && <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>{d.brand}</span>}
        <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {d.logo_url
              ? <img src={`${API}/${d.logo_url}`} alt="logo" style={{ height: 32, borderRadius: 4, border: '1px solid #e5e7eb' }} />
              : <span style={{ fontSize: 12, color: '#9ca3af' }}>No logo</span>
            }
            <label style={{
              fontSize: 12, padding: '3px 10px', background: '#f3f4f6',
              borderRadius: 4, cursor: 'pointer', margin: 0, fontWeight: 500
            }}>
              {uploading === 'logo' ? 'Uploading...' : (d.logo_url ? 'Change Logo' : '+ Logo')}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e, 'logo')} />
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {d.panel_url
              ? <img src={`${API}/${d.panel_url}`} alt="panel" style={{ height: 32, borderRadius: 4, border: '1px solid #e5e7eb' }} />
              : <span style={{ fontSize: 12, color: '#9ca3af' }}>No panel</span>
            }
            <label style={{
              fontSize: 12, padding: '3px 10px', background: '#f3f4f6',
              borderRadius: 4, cursor: 'pointer', margin: 0, fontWeight: 500
            }}>
              {uploading === 'panel' ? 'Uploading...' : (d.panel_url ? 'Change Panel' : '+ Panel')}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e, 'panel')} />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [accounts, setAccounts]             = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [dealerships, setDealerships]       = useState([])
  const [newAccountName, setNewAccountName] = useState('')
  const [newDealerName, setNewDealerName]   = useState('')
  const [newDealerBrand, setNewDealerBrand] = useState('')

  useEffect(() => {
    getAccounts().then(r => setAccounts(r.data))
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      getDealershipsForAccount(selectedAccount.id).then(r => setDealerships(r.data))
    }
  }, [selectedAccount])

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    const { data } = await createAccount(newAccountName)
    setAccounts(prev => [...prev, data])
    setNewAccountName('')
    setSelectedAccount(data)
  }

  const handleCreateDealership = async (e) => {
    e.preventDefault()
    const { data } = await createDealership({
      name: newDealerName,
      brand: newDealerBrand || null,
      account_id: selectedAccount.id
    })
    setDealerships(prev => [...prev, data])
    setNewDealerName('')
    setNewDealerBrand('')
  }

  const handleDealershipUpdated = (updated) => {
    setDealerships(prev => prev.map(d => d.id === updated.id ? updated : d))
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Setup — Accounts & Dealerships</h1>
        <p>Create brand accounts and add dealerships. Upload a logo and panel per dealership — these are used automatically during creative generation.</p>
      </div>

      <div className="card">
        <h3>Create Brand Account</h3>
        <form onSubmit={handleCreateAccount} style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="e.g. Tata, Kia, Volkswagen"
            value={newAccountName}
            onChange={e => setNewAccountName(e.target.value)}
            required
            style={{ marginBottom: 0 }}
          />
          <button type="submit" style={{ whiteSpace: 'nowrap' }}>Add Account</button>
        </form>
      </div>

      {accounts.length > 0 && (
        <div className="card">
          <h3>Select Brand Account</h3>
          <select
            value={selectedAccount?.id || ''}
            onChange={e => {
              const acc = accounts.find(a => a.id === e.target.value)
              setSelectedAccount(acc || null)
            }}
          >
            <option value="">-- choose account --</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedAccount && (
        <div className="card">
          <h3>Dealerships under <em>{selectedAccount.name}</em></h3>

          <form onSubmit={handleCreateDealership} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input
              placeholder="Dealership name"
              value={newDealerName}
              onChange={e => setNewDealerName(e.target.value)}
              required
              style={{ marginBottom: 0 }}
            />
            <input
              placeholder="Brand (optional)"
              value={newDealerBrand}
              onChange={e => setNewDealerBrand(e.target.value)}
              style={{ marginBottom: 0 }}
            />
            <button type="submit" style={{ whiteSpace: 'nowrap' }}>Add</button>
          </form>

          {dealerships.length === 0
            ? <p style={{ color: '#9ca3af', fontSize: 14 }}>No dealerships yet.</p>
            : dealerships.map(d => (
              <DealershipRow key={d.id} d={d} onUpdated={handleDealershipUpdated} />
            ))
          }
        </div>
      )}
    </div>
  )
}
