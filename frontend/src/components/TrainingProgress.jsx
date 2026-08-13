import { Check, Loader2 } from 'lucide-react'

export default function TrainingProgress({ stages, currentStage, status, error }) {
  if (status !== 'training' && status !== 'error') return null

  return (
    <section className="mt-8 animate-fadeUp rounded-xl border border-border bg-card p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-inkMuted">
        Training your model
      </p>
      <ol className="space-y-3">
        {stages.map((stage, idx) => {
          const done = status === 'training' && idx < currentStage
          const active = status === 'training' && idx === currentStage
          const failed = status === 'error' && idx === currentStage
          return (
            <li key={stage} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                  done
                    ? 'border-charcoal bg-charcoal text-bg'
                    : active
                    ? 'border-charcoal text-ink'
                    : failed
                    ? 'border-border text-inkMuted'
                    : 'border-border text-inkMuted'
                }`}
              >
                {done ? (
                  <Check size={12} />
                ) : active ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  idx + 1
                )}
              </span>
              <span
                className={`text-sm ${
                  done || active ? 'text-ink' : 'text-inkMuted'
                }`}
              >
                {stage}
              </span>
            </li>
          )
        })}
      </ol>
      {status === 'error' && (
        <p className="mt-4 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink">
          {error || 'Training failed. Please adjust your configuration and try again.'}
        </p>
      )}
    </section>
  )
}