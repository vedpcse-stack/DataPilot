import { Loader2, Play } from 'lucide-react'
import ModelSelector from './ModelSelector.jsx'

export default function TrainingConfiguration({
  task,
  modelKey,
  setModelKey,
  testSize,
  setTestSize,
  randomState,
  setRandomState,
  onTrain,
  training,
}) {
  return (
    <section className="mt-8 animate-fadeUp">
      <h2 className="mb-1 font-display text-lg font-semibold text-ink">Model configuration</h2>
      <p className="mb-4 text-sm text-inkMuted">
        Pick an algorithm suited to a {task} problem, then set your train/test split.
      </p>

      <ModelSelector task={task} modelKey={modelKey} setModelKey={setModelKey} disabled={training} />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-inkMuted">
              Test size
            </label>
            <span className="font-mono text-sm font-semibold text-ink">
              {Math.round(testSize * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={20}
            max={80}
            step={5}
            value={Math.round(testSize * 100)}
            disabled={training}
            onChange={(e) => setTestSize(Number(e.target.value) / 100)}
            className="w-full accent-current"
            style={{ accentColor: 'rgb(var(--dp-charcoal))' }}
          />
          <div className="mt-1 flex justify-between text-[11px] text-inkMuted">
            <span>20%</span>
            <span>80%</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-inkMuted">
            Random state
          </label>
          <input
            type="number"
            value={randomState}
            disabled={training}
            onChange={(e) => setRandomState(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm text-ink outline-none focus:border-inkMuted"
          />
          <p className="mt-1 text-[11px] text-inkMuted">Controls reproducibility of the split.</p>
        </div>
      </div>

      <button
        type="button"
        disabled={!modelKey || training}
        onClick={onTrain}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal px-6 py-3.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto sm:px-10"
      >
        {training ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Training...
          </>
        ) : (
          <>
            <Play size={16} /> Train Model
          </>
        )}
      </button>
    </section>
  )
}
