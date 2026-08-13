import { useCallback, useRef, useState } from 'react'
import * as api from '../services/api'

const PROGRESS_STAGES = [
  'Preparing dataset...',
  'Preprocessing...',
  'Training model...',
  'Evaluating model...',
  'Generating graphs...',
]

// Index of "Training model..." — this is where almost all of the real wait
// happens (fitting the estimator), so the UI races through the first two
// stages and then holds here until the API call actually resolves, instead
// of pretending to make even progress the whole way through.
const HOLD_STAGE_INDEX = 2

export function useTraining({ datasetId, featureColumns, targetColumn, task }) {
  const [modelKey, setModelKey] = useState(null)
  const [testSize, setTestSize] = useState(0.2)
  const [randomState, setRandomState] = useState(42)

  const [trainingStatus, setTrainingStatus] = useState('idle') // idle | training | done | error
  const [trainingError, setTrainingError] = useState(null)
  const [progressStage, setProgressStage] = useState(0)
  const [result, setResult] = useState(null)

  const [predictionStatus, setPredictionStatus] = useState('idle')
  const [predictionError, setPredictionError] = useState(null)
  const [predictionResult, setPredictionResult] = useState(null)

  const timeouts = useRef([])

  const clearAllTimeouts = () => {
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
  }

  const after = (ms, fn) => {
    const id = setTimeout(fn, ms)
    timeouts.current.push(id)
  }

  const wait = (ms) => new Promise((resolve) => after(ms, resolve))

  const train = useCallback(async () => {
    if (!modelKey) return
    setTrainingStatus('training')
    setTrainingError(null)
    setResult(null)
    setProgressStage(0)
    setPredictionResult(null)
    clearAllTimeouts()

    // Quickly step through "Preparing dataset..." and "Preprocessing...",
    // then hold on "Training model..." for as long as the real request
    // takes — there's no per-step progress from the backend, so this is
    // the honest thing to show: most of the wait genuinely is training.
    after(300, () => setProgressStage(1))
    after(700, () => setProgressStage(HOLD_STAGE_INDEX))

    try {
      const data = await api.trainModel({
        datasetId,
        featureColumns,
        targetColumn,
        task,
        modelKey,
        testSize,
        randomState,
      })

      // The response is back, meaning training + evaluation + graph-data
      // shaping all already happened server-side in one shot. Flash through
      // the last two stages briefly so it doesn't jump straight from
      // "Training model..." to the finished results.
      clearAllTimeouts()
      setProgressStage(HOLD_STAGE_INDEX + 1)
      await wait(250)
      setProgressStage(HOLD_STAGE_INDEX + 2)
      await wait(250)

      setResult(data)
      setTrainingStatus('done')
      return data
    } catch (err) {
      clearAllTimeouts()
      setTrainingError(err.message)
      setTrainingStatus('error')
      throw err
    }
  }, [datasetId, featureColumns, targetColumn, task, modelKey, testSize, randomState])

  const resetTraining = useCallback(() => {
    clearAllTimeouts()
    setModelKey(null)
    setTrainingStatus('idle')
    setTrainingError(null)
    setProgressStage(0)
    setResult(null)
    setPredictionStatus('idle')
    setPredictionError(null)
    setPredictionResult(null)
  }, [])

  const runPrediction = useCallback(
    async (inputs) => {
      if (!result?.model_id) return
      setPredictionStatus('loading')
      setPredictionError(null)
      try {
        const data = await api.predict({ modelId: result.model_id, inputs })
        setPredictionResult(data.prediction)
        setPredictionStatus('done')
        return data
      } catch (err) {
        setPredictionError(err.message)
        setPredictionStatus('error')
        throw err
      }
    },
    [result],
  )

  return {
    modelKey,
    setModelKey,
    testSize,
    setTestSize,
    randomState,
    setRandomState,
    trainingStatus,
    trainingError,
    progressStage,
    progressStages: PROGRESS_STAGES,
    result,
    train,
    resetTraining,
    predictionStatus,
    predictionError,
    predictionResult,
    runPrediction,
  }
}