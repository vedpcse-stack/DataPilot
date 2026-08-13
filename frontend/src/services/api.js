import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 120000,
})

function friendlyError(err) {
  const message =
    err?.response?.data?.error ||
    err?.response?.data?.detail ||
    (err?.code === 'ECONNABORTED'
      ? 'The request took too long. Please try again.'
      : 'Something went wrong talking to the server. Please try again.')
  const wrapped = new Error(message)
  wrapped.status = err?.response?.status
  return wrapped
}

export async function analyzeDataset(file, onUploadProgress) {
  const form = new FormData()
  form.append('file', file)
  try {
    const { data } = await client.post('/dataset/analyze/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    return data
  } catch (err) {
    throw friendlyError(err)
  }
}

export async function analyzeTarget({ datasetId, featureColumns, targetColumn }) {
  try {
    const { data } = await client.post('/dataset/target-analysis/', {
      dataset_id: datasetId,
      feature_columns: featureColumns,
      target_column: targetColumn,
    })
    return data
  } catch (err) {
    throw friendlyError(err)
  }
}

export async function fetchAvailableModels(task) {
  try {
    const { data } = await client.get('/model/available/', { params: { task } })
    return data.models
  } catch (err) {
    throw friendlyError(err)
  }
}

export async function trainModel({
  datasetId,
  featureColumns,
  targetColumn,
  task,
  modelKey,
  testSize,
  randomState,
}) {
  try {
    const { data } = await client.post('/model/train/', {
      dataset_id: datasetId,
      feature_columns: featureColumns,
      target_column: targetColumn,
      task,
      model_key: modelKey,
      test_size: testSize,
      random_state: randomState,
    })
    return data
  } catch (err) {
    throw friendlyError(err)
  }
}

export async function predict({ modelId, inputs }) {
  try {
    const { data } = await client.post('/model/predict/', { model_id: modelId, inputs })
    return data
  } catch (err) {
    throw friendlyError(err)
  }
}

export function modelDownloadUrl(modelId) {
  return `/api/model/download/?model_id=${encodeURIComponent(modelId)}`
}

export function reportDownloadUrl(modelId) {
  return `/api/report/download/?model_id=${encodeURIComponent(modelId)}`
}

export async function triggerFileDownload(url, filename) {
  try {
    const response = await client.get(url.replace('/api', ''), { responseType: 'blob' })
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = blobUrl
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (err) {
    throw friendlyError(err)
  }
}
