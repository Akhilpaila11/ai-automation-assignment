import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccounts, createAccount, getDealershipsForAccount } from '../api/accounts'
import { createDealership } from '../api/dealerships'
import { uploadAsset, getAssets, deleteAsset } from '../api/assets'
import { createJob, getJob } from '../api/jobs'

const API = 'http://localhost:8000'

const FORMAT_OPTIONS = [
  { value: 'post_square',    label: 'Instagram Post — Square (1080×1080)' },
  { value: 'post_portrait',  label: 'Instagram Post — Portrait (1080×1350)' },
  { value: 'story',          label: 'Instagram Story (1080×1920)' },
]

const TYPE_COLORS = { background: '#dbeafe', panel: '#fef9c3', logo: '#dcfce7' }
const TYPE_TEXT   = { background: '#1e40af', panel: '#854d0e', logo: '#166534' }

function QuickSetup({ onDone }) {
  const [accountName, setAccountName] = useState('')
  const [dealerName, setDealerName]   = useState('')
  const [account, setAccount]         = useState(null)
  const [saving, setSaving]           = useState(false)

  const createAcc = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { data } = await createAccount(accountName)
    setAccount(data)
    setSaving(false)
  }

  const createDealer = async (e) => {
    e.preventDefault()
    setSaving(true)
    await createDealership({ name: dealerName, account_id: account.id })
    onDone()
    setSaving(false)
  }

  return (
    <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
      <h3 style={{ color: '#92400e' }}>Quick Setup — No accounts found</h3>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
        Create a brand account and at least one dealership to continue.
        You can add more later from the <strong>Dashboard</strong>.
      </p>

      {!account ? (
        <form onSubmit={createAcc} style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Brand name (e.g. Volkswagen)" value={accountName}
            onChange={e => setAccountName(e.target.value)} required style={{ marginBottom: 0 }} />
          <button type="submit" disabled={saving} style={{ whiteSpace: 'nowrap' }}>
            {saving ? '...' : 'Create Account'}
          </button>
        </form>
      ) : (
        <>
          <p style={{ fontSize: 13, marginBottom: 8 }}>
            ✓ Account <strong>{account.name}</strong> created. Now add a dealership:
          </p>
          <form onSubmit={createDealer} style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Dealership name" value={dealerName}
              onChange={e => setDealerName(e.target.value)} required style={{ marginBottom: 0 }} />
            <button type="submit" disabled={saving} style={{ whiteSpace: 'nowrap' }}>
              {saving ? '...' : 'Add Dealership'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

function AssetCard({ asset, selected, onToggle, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e) => {
    e.stopPropagation()
    setDeleting(true)
    try {
      await deleteAsset(asset.id)
      onDelete(asset.id)
    } catch {
      alert('Delete failed')
    }
    setDeleting(false)
  }

  return (
    <div
      onClick={() => onToggle(asset.id)}
      style={{
        border: `2px solid ${selected ? '#4f46e5' : '#e5e7eb'}`,
        background: selected ? '#eef2ff' : 'white',
        borderRadius: 8, padding: 10, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
        transition: 'border-color 0.15s'
      }}
    >
      <img
        src={`${API}/${asset.file_path}`}
        alt={asset.original_name}
        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
        onError={e => { e.target.style.display = 'none' }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {asset.original_name}
        </p>
        <span style={{
          fontSize: 11, padding: '1px 8px', borderRadius: 99, fontWeight: 600,
          background: TYPE_COLORS[asset.asset_type] || '#f3f4f6',
          color: TYPE_TEXT[asset.asset_type] || '#374151',
          textTransform: 'capitalize'
        }}>
          {asset.asset_type}
        </span>
      </div>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="danger"
        style={{ padding: '4px 10px', fontSize: 12, flexShrink: 0 }}
      >
        {deleting ? '...' : 'Remove'}
      </button>
    </div>
  )
}

function JobProgress({ jobId, onDone }) {
  const [status, setStatus] = useState('processing')

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await getJob(jobId)
      setStatus(data.status)
      if (data.status === 'done' || data.status === 'failed') {
        clearInterval(interval)
        setTimeout(onDone, 1200)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [jobId])

  const icon   = status === 'done' ? '✓' : status === 'failed' ? '✗' : '⏳'
  const color  = status === 'done' ? '#16a34a' : status === 'failed' ? '#dc2626' : '#4f46e5'
  const label  = status === 'done' ? 'Creatives ready! Redirecting…'
               : status === 'failed' ? 'Generation failed. Please try again.'
               : 'Generating creatives…'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
    }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 320, width: '90%' }}>
        <div style={{ fontSize: 48, color }}>{icon}</div>
        <p style={{ fontSize: 16, fontWeight: 600, marginTop: 8, color }}>{label}</p>
        {status === 'processing' && (
          <div style={{
            height: 4, background: '#e5e7eb', borderRadius: 2, marginTop: 16, overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', width: '40%', background: '#4f46e5', borderRadius: 2,
              animation: 'slide 1.4s ease-in-out infinite'
            }} />
          </div>
        )}
      </div>
      <style>{`@keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }`}</style>
    </div>
  )
}

export default function CreateJob() {
  const navigate = useNavigate()
  const [accounts, setAccounts]                       = useState([])
  const [selectedAccount, setSelectedAccount]         = useState('')
  const [dealerships, setDealerships]                 = useState([])
  const [selectedDealerships, setSelectedDealerships] = useState([])
  const [assets, setAssets]                           = useState([])
  const [selectedAssets, setSelectedAssets]           = useState([])
  const [outputFormat, setOutputFormat]               = useState('post_square')
  const [useLogo, setUseLogo]                         = useState(true)
  const [uploading, setUploading]                     = useState(null)
  const [error, setError]                             = useState('')
  const [runningJobId, setRunningJobId]               = useState(null)
  const [loadingAccounts, setLoadingAccounts]         = useState(true)

  const loadAll = () => {
    setLoadingAccounts(true)
    Promise.all([
      getAccounts().then(r => setAccounts(r.data)),
      getAssets().then(r => setAssets(r.data)),
    ]).finally(() => setLoadingAccounts(false))
  }

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    if (selectedAccount) {
      getDealershipsForAccount(selectedAccount).then(r => setDealerships(r.data))
      setSelectedDealerships([])
    }
  }, [selectedAccount])

  const toggleDealership = (id) =>
    setSelectedDealerships(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleAsset = (id) =>
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleUpload = async (e, assetType) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(assetType)
    setError('')
    try {
      const { data } = await uploadAsset(file, assetType)
      setAssets(prev => [...prev, data])
      setSelectedAssets(prev => [...prev, data.id])
    } catch {
      setError('Upload failed — check file type and try again.')
    }
    setUploading(null)
    e.target.value = ''
  }

  const handleDeleteAsset = (id) => {
    setAssets(prev => prev.filter(a => a.id !== id))
    setSelectedAssets(prev => prev.filter(x => x !== id))
  }

  const handleSubmit = async () => {
    if (selectedDealerships.length === 0) return setError('Select at least one dealership.')
    const hasBackground = assets.filter(a => selectedAssets.includes(a.id) && a.asset_type === 'background').length > 0
    if (!hasBackground) return setError('Select at least one background image.')
    setError('')
    const { data } = await createJob(selectedDealerships, selectedAssets, outputFormat, useLogo)
    setRunningJobId(data.id)
  }

  if (loadingAccounts) return <div className="container"><p style={{ color: '#6b7280' }}>Loading…</p></div>

  return (
    <div className="container">
      {runningJobId && (
        <JobProgress
          jobId={runningJobId}
          onDone={() => { setRunningJobId(null); navigate('/jobs') }}
        />
      )}

      <div className="page-header">
        <h1>Create New Job</h1>
        <p>Select dealerships, upload assets, and generate Instagram-ready creatives in seconds.</p>
      </div>

      {accounts.length === 0 && <QuickSetup onDone={loadAll} />}

      {accounts.length > 0 && (
        <div className="card">
          <div className="step-label"><span className="step-num">1</span> Select Brand Account</div>
          <h3 style={{ marginBottom: 12 }}>Which brand is this job for?</h3>
          <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
            <option value="">-- choose account --</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      )}

      {selectedAccount && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div className="step-label"><span className="step-num">2</span> Bulk Dealership Selection</div>
              <h3 style={{ marginBottom: 0 }}>
                Select one or more dealerships
                {dealerships.length > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                    {selectedDealerships.length}/{dealerships.length} selected
                  </span>
                )}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                One creative is generated per dealership — select all to bulk generate.
              </p>
            </div>
            {dealerships.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="secondary" style={{ padding: '5px 12px', fontSize: 12 }}
                  onClick={() => setSelectedDealerships(dealerships.map(d => d.id))}>
                  Select All ({dealerships.length})
                </button>
                <button className="secondary" style={{ padding: '5px 12px', fontSize: 12 }}
                  onClick={() => setSelectedDealerships([])}>
                  Clear
                </button>
              </div>
            )}
          </div>

          {dealerships.length === 0 && (
            <div style={{ padding: '16px', background: '#fff7ed', borderRadius: 6, border: '1px solid #fed7aa' }}>
              <p style={{ fontSize: 13, color: '#92400e', marginBottom: 8 }}>
                This account has no dealerships yet.
              </p>
              <a href="/dashboard" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600 }}>
                Go to Dashboard to add dealerships →
              </a>
            </div>
          )}

          <div className="dealership-grid">
            {dealerships.map(d => (
              <div
                key={d.id}
                className={`dealership-card ${selectedDealerships.includes(d.id) ? 'selected' : ''}`}
                onClick={() => toggleDealership(d.id)}
              >
                {d.panel_url
                  ? <img src={`${API}/${d.panel_url}`} alt="panel"
                      style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }} />
                  : <div style={{ width: '100%', height: 60, background: '#f3f4f6', borderRadius: 4,
                      marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, color: '#9ca3af' }}>No panel</div>
                }
                <strong style={{ fontSize: 13 }}>{d.name}</strong>
                {d.brand && <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{d.brand}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="step-label"><span className="step-num">3</span> Upload Assets</div>
        <h3>Background, panel, and logo</h3>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>
          Background is required. Panel and logo override per-dealership defaults.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {['background', 'panel', 'logo'].map(type => (
            <label key={type} style={{
              flex: 1, minWidth: 160, display: 'block', cursor: 'pointer',
              border: '2px dashed #d1d5db', borderRadius: 8, padding: '14px 16px',
              textAlign: 'center', background: uploading === type ? '#f9fafb' : 'white',
              transition: 'border-color 0.15s'
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>
                {type === 'background' ? '🖼' : type === 'panel' ? '📋' : '🏷'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize', marginBottom: 4 }}>{type}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                {uploading === type ? 'Uploading…' : 'Click to upload PNG/JPG'}
              </div>
              <input type="file" accept="image/png,image/jpeg" style={{ display: 'none' }}
                onChange={e => handleUpload(e, type)} disabled={!!uploading} />
            </label>
          ))}
        </div>
      </div>

      {assets.length > 0 && (
        <div className="card">
          <div className="step-label"><span className="step-num">4</span> Asset Library</div>
          <h3 style={{ marginBottom: 4 }}>Select which assets to use</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>
            Click to select/deselect · {selectedAssets.length} selected
          </p>
          {assets.map(a => (
            <AssetCard
              key={a.id}
              asset={a}
              selected={selectedAssets.includes(a.id)}
              onToggle={toggleAsset}
              onDelete={handleDeleteAsset}
            />
          ))}
        </div>
      )}

      <div className="card">
        <div className="step-label"><span className="step-num">5</span> Output Settings</div>
        <h3>Format & options</h3>
        <label>Format</label>
        <select value={outputFormat} onChange={e => setOutputFormat(e.target.value)}>
          {FORMAT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <input type="checkbox" id="useLogo" checked={useLogo}
            onChange={e => setUseLogo(e.target.checked)} style={{ width: 'auto', margin: 0 }} />
          <label htmlFor="useLogo" style={{ margin: 0, fontWeight: 'normal', cursor: 'pointer', fontSize: 14 }}>
            Include logo on creatives
          </label>
        </div>
      </div>

      {error && <p className="error" style={{ marginBottom: 14 }}>{error}</p>}

      {selectedDealerships.length > 1 && (
        <div style={{
          background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8,
          padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#3730a3' }}>
              Bulk generation — {selectedDealerships.length} creatives will be produced
            </p>
            <p style={{ fontSize: 12, color: '#4f46e5', marginTop: 2 }}>
              One image per dealership · packaged into a single ZIP download
            </p>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedDealerships.length === 0}
        style={{ width: '100%', padding: 14, fontSize: 15 }}
      >
        {selectedDealerships.length > 1
          ? `Bulk Generate — ${selectedDealerships.length} Creatives`
          : selectedDealerships.length === 1
            ? 'Generate 1 Creative'
            : 'Generate Creatives'}
      </button>
    </div>
  )
}
