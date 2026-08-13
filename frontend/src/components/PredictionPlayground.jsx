import { useMemo, useState } from 'react'
import { AlertCircle, Loader2, Wand2 } from 'lucide-react'

export default function PredictionPlayground({
  featureColumns,
  columnMeta,
  task,
  targetColumn,
  onPredict,
  status,
  error,
  prediction,
}) {
  const initialInputs = useMemo(() => {
    const obj = {}
    featureColumns.forEach((c) => {
      obj[c] = ''
    })
    return obj
  }, [featureColumns])

  const [inputs, setInputs] = useState(initialInputs)

  const metaFor = (col) => columnMeta.find((c) => c.name === col)

  const update = (col, value) => setInputs((prev) => ({ ...prev, [col]: value }))

  const canSubmit = featureColumns.every((c) => inputs[c] !== '' && inputs[c] !== null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    onPredict(inputs)
  }

  return (
    <section className="mt-10 animate-fadeUp">
      <h2 className="mb-1 font-display text-lg font-semibold text-ink">Test your model</h2>
      <p className="mb-4 text-sm text-inkMuted">
        Enter feature values and DataPilot will predict {targetColumn} using the trained pipeline.
      </p>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureColumns.map((col) => {
            const meta = metaFor(col)
            const isNumeric = meta?.dtype === 'Numeric' || meta?.dtype === 'Boolean'
            return (
              <div key={col}>
                <label className="mb-1.5 block text-xs font-medium text-inkMuted">{col}</label>
                <input
                  type={isNumeric ? 'number' : 'text'}
                  step={isNumeric ? 'any' : undefined}
                  value={inputs[col]}
                  onChange={(e) => update(col, e.target.value)}
                  placeholder={isNumeric ? '0' : 'value'}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-inkMuted"
                />
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!canSubmit || status === 'loading'}
            className="flex items-center gap-2 rounded-xl bg-charcoal px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Predicting...
              </>
            ) : (
              <>
                <Wand2 size={15} /> Predict
              </>
            )}
          </button>

          {prediction !== null && prediction !== undefined && status === 'done' && (
            <div className="rounded-lg border border-charcoal bg-charcoal px-4 py-2.5 text-sm font-semibold text-bg">
              {targetColumn}: {typeof prediction === 'number' ? prediction.toLocaleString(undefined, { maximumFractionDigits: 4 }) : prediction}
            </div>
          )}
        </div>
      </form>
    </section>
  )
}
