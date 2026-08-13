import { useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import UploadDataset from './components/UploadDataset.jsx'
import DatasetOverview from './components/DatasetOverview.jsx'
import DatasetPreview from './components/DatasetPreview.jsx'
import ColumnSelector from './components/ColumnSelector.jsx'
import TargetAnalysis from './components/TargetAnalysis.jsx'
import TrainingConfiguration from './components/TrainingConfiguration.jsx'
import TrainingProgress from './components/TrainingProgress.jsx'
import ClassificationResults from './components/ClassificationResults.jsx'
import RegressionResults from './components/RegressionResults.jsx'
import PredictionPlayground from './components/PredictionPlayground.jsx'
import DownloadSection from './components/DownloadSection.jsx'
import { useDataset } from './hooks/useDataset.js'
import { useTraining } from './hooks/useTraining.js'
import { RotateCcw } from 'lucide-react'

function StageLabel(dataset, training) {
  if (training.result) return 'Results'
  if (dataset.targetAnalysis) return 'Configure model'
  if (dataset.profile) return 'Select columns'
  return 'Upload dataset'
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const dataset = useDataset()
  const training = useTraining({
    datasetId: dataset.datasetId,
    featureColumns: dataset.featureColumns,
    targetColumn: dataset.targetColumn,
    task: dataset.targetAnalysis?.detected_task,
  })

  const handleStartOver = () => {
    dataset.reset()
    training.resetTraining()
  }

  const showUploadOnly = dataset.status !== 'ready'
  const showColumnsAndProfile = dataset.status === 'ready'
  const showTargetAndModel = dataset.columnsConfirmed && dataset.targetAnalysis
  const showResults = training.trainingStatus === 'done' && training.result

  return (
    <div className="min-h-screen bg-bg font-body text-ink">
      <Navbar theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} stage={!showUploadOnly ? StageLabel(dataset, training) : null} />

      <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        {showUploadOnly && (
          <UploadDataset
            status={dataset.status}
            error={dataset.error}
            uploadProgress={dataset.uploadProgress}
            onUpload={dataset.upload}
          />
        )}

        {showColumnsAndProfile && (
          <div className="pt-8">
            <div className="mb-2 flex items-center justify-between">
              <div />
              <button
                type="button"
                onClick={handleStartOver}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-inkMuted transition-colors hover:border-inkMuted hover:text-ink"
              >
                <RotateCcw size={13} /> Start over
              </button>
            </div>

            <DatasetOverview profile={dataset.profile} />
            <DatasetPreview profile={dataset.profile} />

            <ColumnSelector
              profile={dataset.profile}
              featureColumns={dataset.featureColumns}
              setFeatureColumns={dataset.setFeatureColumns}
              targetColumn={dataset.targetColumn}
              setTargetColumn={dataset.setTargetColumn}
              onConfirm={dataset.confirmColumns}
              confirming={dataset.targetStatus === 'loading'}
              disabled={dataset.columnsConfirmed}
            />

            {dataset.columnsConfirmed && dataset.targetStatus === 'error' && (
              <div className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink">
                {dataset.targetError}
                <button
                  type="button"
                  onClick={dataset.editColumns}
                  className="ml-2 underline underline-offset-2"
                >
                  Edit columns
                </button>
              </div>
            )}

            {showTargetAndModel && (
              <>
                <TargetAnalysis analysis={dataset.targetAnalysis} />

                {!training.result && (
                  <TrainingConfiguration
                    task={dataset.targetAnalysis.detected_task}
                    modelKey={training.modelKey}
                    setModelKey={training.setModelKey}
                    testSize={training.testSize}
                    setTestSize={training.setTestSize}
                    randomState={training.randomState}
                    setRandomState={training.setRandomState}
                    onTrain={training.train}
                    training={training.trainingStatus === 'training'}
                  />
                )}

                <TrainingProgress
                  stages={training.progressStages}
                  currentStage={training.progressStage}
                  status={training.trainingStatus}
                  error={training.trainingError}
                />

                {showResults && (
                  <>
                    {dataset.targetAnalysis.detected_task === 'classification' ? (
                      <ClassificationResults result={training.result} />
                    ) : (
                      <RegressionResults result={training.result} />
                    )}

                    <PredictionPlayground
                      featureColumns={dataset.featureColumns}
                      columnMeta={dataset.profile.columns}
                      task={dataset.targetAnalysis.detected_task}
                      targetColumn={dataset.targetColumn}
                      onPredict={training.runPrediction}
                      status={training.predictionStatus}
                      error={training.predictionError}
                      prediction={training.predictionResult}
                    />

                    <DownloadSection modelId={training.result.model_id} />
                  </>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
