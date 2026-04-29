import client from './client'

export const createJob = (dealershipIds, assetIds, outputFormat, useLogo) =>
  client.post('/jobs', {
    dealership_ids: dealershipIds,
    asset_ids: assetIds,
    output_format: outputFormat,
    use_logo: useLogo,
  })

export const getJobs       = ()        => client.get('/jobs')
export const deleteJob     = (id)      => client.delete(`/jobs/${id}`)
export const deleteAllJobs = ()        => client.delete('/jobs')
export const getJob        = (id)      => client.get(`/jobs/${id}`)
export const getJobOutputs = (jobId)   => client.get(`/jobs/${jobId}/outputs`)

export const downloadZip = async (jobId) => {
  const res = await client.get(`/jobs/${jobId}/download`, { responseType: 'blob' })
  triggerDownload(res.data, `job_${jobId}.zip`)
}

export const downloadSingle = async (jobId, outputId, filename) => {
  const res = await client.get(`/jobs/${jobId}/outputs/${outputId}/download`, { responseType: 'blob' })
  triggerDownload(res.data, filename || `${outputId}.jpg`)
}

function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(new Blob([blob]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
}
