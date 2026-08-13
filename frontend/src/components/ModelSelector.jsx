import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import * as api from '../services/api'

const DESCRIPTIONS = {
  knn: 'Predicts using the majority class among nearby data points.',
  decision_tree: 'Splits data into branching rules to reach a decision.',
  random_forest: 'An ensemble of decision trees for stronger, steadier accuracy.',
  svc: 'Finds the boundary that best separates classes.',
  linear_regression: 'Fits a straight-line relationship between features and target.',
  polynomial_regression: 'Fits a curved relationship for non-linear trends.',
  auto: 'Trains every eligible model and automatically keeps the best one.',
}

export default function ModelSelector({ task, modelKey, setModelKey, disabled }) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .fetchAvailableModels(task)
      .then((data) => {
        if (active) setModels(data)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [task])

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-inkMuted">
        Select a model
      </p>
      {loading ? (
        <div className="h-24 animate-pulseSoft rounded-xl border border-border bg-card" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {models.map((m) => {
            const active = modelKey === m.key
            const isAuto = m.key === 'auto'
            return (
              <button
                key={m.key}
                type="button"
                disabled={disabled}
                onClick={() => setModelKey(m.key)}
                className={`flex items-start gap-2.5 rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? 'border-charcoal bg-charcoal text-bg'
                    : 'border-border bg-card text-ink hover:border-inkMuted'
                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {isAuto && (
                  <Sparkles size={16} className={`mt-0.5 shrink-0 ${active ? 'text-bg' : 'text-inkMuted'}`} />
                )}
                <div>
                  <p className="text-sm font-semibold">{m.label}</p>
                  <p className={`mt-0.5 text-xs ${active ? 'text-bg/70' : 'text-inkMuted'}`}>
                    {DESCRIPTIONS[m.key]}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
