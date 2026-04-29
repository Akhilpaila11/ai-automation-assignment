import { useEffect, useState } from 'react'
import { getJobs, getJobOutputs, downloadZip, downloadSingle, deleteJob, deleteAllJobs } from '../api/jobs'

const API = 'http://localhost:8000'

const FORMAT_LABELS = {
  post_square:   'Square 1080×1080',
  post_portrait: 'Portrait 1080×1350',
  story:         'Story 1080×1920',
}

export default function JobHistory() {
  const [jobs, setJobs]               = useState([])
  const [expandedJob, setExpandedJob] = useState(null)
  const [outputs, setOutputs]         = useState({})
  const [downloading, setDownloading] = useState(null)
  const [deleting, setDeleting]       = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    const load = () => getJobs().then(r => setJobs(r.data))
    load()
    const interval = setInterval(load, 4000)
    return () => clearInterval(interval)
  }, [])

  const toggleOutputs = async (jobId) => {
    if (expandedJob === jobId) { setExpandedJob(null); return }
    if (!outputs[jobId]) {
      const { data } = await getJobOutputs(jobId)
      setOutputs(prev => ({ ...prev, [jobId]: data }))
    }
    setExpandedJob(jobId)
  }

  const handleDownloadZip = async (jobId) => {
    setDownloading(`zip-${jobId}`)
    try {
      await downloadZip(jobId)
    } catch {
      alert('Download failed. The file may no longer exist on the server.')
    }
    setDownloading(null)
  }

  const handleDownloadSingle = async (jobId, outputId, filename) => {
    setDownloading(`single-${outputId}`)
    try {
      await downloadSingle(jobId, outputId, filename)
    } catch {
      alert('Download failed. The file may no longer exist on the server.')
    }
    setDownloading(null)
  }

  const handleDeleteJob = async (jobId) => {
    setDeleting(jobId)
    try {
      await deleteJob(jobId)
      setJobs(prev => prev.filter(j => j.id !== jobId))
      if (expandedJob === jobId) setExpandedJob(null)
    } catch {
      alert('Failed to delete job.')
    }
    setDeleting(null)
  }

  const handleClearAll = async () => {
    setDeleting('all')
    try {
      await deleteAllJobs()
      setJobs([])
      setOutputs({})
      setExpandedJob(null)
    } catch {
      alert('Failed to clear history.')
    }
    setDeleting(null)
    setConfirmClear(false)
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Job History</h1>
          <p>All your creative generation jobs and their outputs.</p>
        </div>

        {jobs.length > 0 && (
          <div style={{ flexShrink: 0, marginTop: 6 }}>
            {confirmClear ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Delete all {jobs.length} jobs?</span>
                <button className="danger" style={{ padding: '6px 14px', fontSize: 13 }}
                  disabled={deleting === 'all'}
                  onClick={handleClearAll}>
                  {deleting === 'all' ? 'Clearing…' : 'Yes, clear all'}
                </button>
                <button className="secondary" style={{ padding: '6px 14px', fontSize: 13 }}
                  onClick={() => setConfirmClear(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="danger" style={{ padding: '7px 16px', fontSize: 13 }}
                onClick={() => setConfirmClear(true)}>
                Clear History
              </button>
            )}
          </div>
        )}
      </div>

      {jobs.length === 0 && (
        <div className="card">
          <p style={{ color: 'var(--text-2)' }}>No jobs yet. Go to <strong>New Job</strong> to generate your first creatives.</p>
        </div>
      )}

      {jobs.map(job => {
        const jobOutputs = outputs[job.id] || []

        return (
          <div key={job.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-3)' }}>{job.id}</p>
                <p style={{ fontSize: 13, marginTop: 3, color: 'var(--text-2)' }}>
                  {new Date(job.created_at).toLocaleString()}
                  <span style={{ margin: '0 6px', color: 'var(--text-3)' }}>·</span>
                  {FORMAT_LABELS[job.output_format] || job.output_format}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span className={`badge ${job.status}`}>{job.status}</span>

                {job.status === 'done' && (
                  <>
                    <button className="secondary" style={{ padding: '5px 12px', fontSize: 13 }}
                      onClick={() => toggleOutputs(job.id)}>
                      {expandedJob === job.id ? 'Hide' : 'Preview'}
                    </button>
                    <button style={{ padding: '5px 12px', fontSize: 13 }}
                      disabled={downloading === `zip-${job.id}`}
                      onClick={() => handleDownloadZip(job.id)}>
                      {downloading === `zip-${job.id}` ? '…' : '↓ ZIP'}
                    </button>
                  </>
                )}

                {job.status === 'processing' && (
                  <span style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>Generating…</span>
                )}

                <button className="danger" style={{ padding: '5px 10px', fontSize: 12 }}
                  disabled={deleting === job.id}
                  onClick={() => handleDeleteJob(job.id)}>
                  {deleting === job.id ? '…' : '✕'}
                </button>
              </div>
            </div>

            {expandedJob === job.id && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                {jobOutputs.length === 0
                  ? <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No outputs recorded.</p>
                  : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                      gap: 12
                    }}>
                      {jobOutputs.map(out => {
                        const filename = out.file_path.replace(/\\/g, '/').split('/').pop()
                        const previewUrl = `${API}/outputs/${filename}`
                        return (
                          <div key={out.id} style={{
                            border: '1px solid var(--border)', borderRadius: 10,
                            overflow: 'hidden', background: 'white'
                          }}>
                            <img
                              src={previewUrl}
                              alt={filename}
                              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                              onError={e => { e.target.style.background = '#f1f5f9'; e.target.style.display = 'none' }}
                            />
                            <div style={{ padding: '8px 10px' }}>
                              <p style={{
                                fontSize: 11, color: 'var(--text-2)', overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6
                              }}>
                                {filename}
                              </p>
                              <button
                                style={{ width: '100%', padding: '5px 0', fontSize: 12 }}
                                disabled={downloading === `single-${out.id}`}
                                onClick={() => handleDownloadSingle(job.id, out.id, filename)}
                              >
                                {downloading === `single-${out.id}` ? '…' : 'Download'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                }
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
