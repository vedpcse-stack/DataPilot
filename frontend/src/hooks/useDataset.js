import { useCallback, useState } from 'react'
import * as api from '../services/api'

export function useDataset() {
  const [status, setStatus] = useState('idle') // idle | uploading | ready | error
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [datasetId, setDatasetId] = useState(null)
  const [profile, setProfile] = useState(null)

  const [featureColumns, setFeatureColumns] = useState([])
  const [targetColumn, setTargetColumn] = useState(null)
  const [columnsConfirmed, setColumnsConfirmed] = useState(false)

  const [targetAnalysis, setTargetAnalysis] = useState(null)
  const [targetStatus, setTargetStatus] = useState('idle') // idle | loading | ready | error
  const [targetError, setTargetError] = useState(null)

  const upload = useCallback(async (file) => {
    setStatus('uploading')
    setError(null)
    setUploadProgress(0)
    try {
      const data = await api.analyzeDataset(file, (evt) => {
        if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100))
      })
      setDatasetId(data.dataset_id)
      setProfile(data.profile)
      setStatus('ready')
      return data
    } catch (err) {
      setError(err.message)
      setStatus('error')
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    setDatasetId(null)
    setProfile(null)
    setFeatureColumns([])
    setTargetColumn(null)
    setColumnsConfirmed(false)
    setTargetAnalysis(null)
    setTargetStatus('idle')
    setTargetError(null)
  }, [])

  const confirmColumns = useCallback(async () => {
    if (!targetColumn || featureColumns.length === 0) return
    setTargetStatus('loading')
    setTargetError(null)
    setColumnsConfirmed(true)
    try {
      const analysis = await api.analyzeTarget({ datasetId, featureColumns, targetColumn })
      setTargetAnalysis(analysis)
      setTargetStatus('ready')
      return analysis
    } catch (err) {
      setTargetError(err.message)
      setTargetStatus('error')
      setColumnsConfirmed(false)
      throw err
    }
  }, [datasetId, featureColumns, targetColumn])

  const editColumns = useCallback(() => {
    setColumnsConfirmed(false)
    setTargetAnalysis(null)
    setTargetStatus('idle')
  }, [])

  return {
    status,
    error,
    uploadProgress,
    datasetId,
    profile,
    upload,
    reset,
    featureColumns,
    setFeatureColumns,
    targetColumn,
    setTargetColumn,
    columnsConfirmed,
    confirmColumns,
    editColumns,
    targetAnalysis,
    targetStatus,
    targetError,
  }
}
