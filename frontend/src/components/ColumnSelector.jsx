import { Check, Loader2, Target } from 'lucide-react'

export default function ColumnSelector({
  profile,
  featureColumns,
  setFeatureColumns,
  targetColumn,
  setTargetColumn,
  onConfirm,
  confirming,
  disabled,
}) {
  if (!profile) return null
  const columns = profile.column_order

  const toggleFeature = (col) => {
    if (disabled) return
    setFeatureColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    )
  }

  const selectTarget = (col) => {
    if (disabled) return
    setTargetColumn(col)
    setFeatureColumns((prev) => prev.filter((c) => c !== col))
  }

  const canConfirm = featureColumns.length > 0 && !!targetColumn && !disabled

  return (
    <section className="mt-8 animate-fadeUp">
      <h2 className="mb-1 font-display text-lg font-semibold text-ink">Select columns</h2>
      <p className="mb-4 text-sm text-inkMuted">
        Choose the independent columns to train on, then the single column you want to predict.
      </p>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-inkMuted">
            Independent columns · {featureColumns.length} selected
          </p>
          <div className="flex flex-wrap gap-2">
            {columns.map((col) => {
              const active = featureColumns.includes(col)
              const isTarget = col === targetColumn
              return (
                <button
                  key={col}
                  type="button"
                  disabled={isTarget || disabled}
                  onClick={() => toggleFeature(col)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    isTarget
                      ? 'cursor-not-allowed border-border bg-bg text-inkMuted/50 line-through'
                      : active
                      ? 'border-charcoal bg-charcoal text-bg'
                      : 'border-border bg-cardAlt text-ink hover:border-inkMuted'
                  }`}
                >
                  {active && !isTarget && <Check size={13} />}
                  {col}
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-inkMuted">
            <Target size={13} /> Dependent column (target)
          </p>
          <div className="flex flex-col gap-1.5">
            {columns.map((col) => {
              const active = col === targetColumn
              const isFeature = featureColumns.includes(col)
              return (
                <button
                  key={col}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectTarget(col)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'border-charcoal bg-charcoal text-bg'
                      : 'border-border bg-cardAlt text-ink hover:border-inkMuted'
                  }`}
                >
                  <span>{col}</span>
                  {isFeature && !active && (
                    <span className="text-[10px] text-inkMuted">also a feature</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!canConfirm || confirming}
        onClick={onConfirm}
        className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-charcoal px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
      >
        {confirming ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Analyzing target...
          </>
        ) : disabled ? (
          <>
            <Check size={15} /> Columns confirmed
          </>
        ) : (
          'Confirm Columns'
        )}
      </button>
    </section>
  )
}
