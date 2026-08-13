import { GitBranch, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function TargetAnalysis({ analysis }) {
  if (!analysis) return null
  const isClassification = analysis.detected_task === 'classification'

  return (
    <section className="mt-8 animate-fadeUp">
      <h2 className="mb-4 font-display text-lg font-semibold text-ink">Target analysis</h2>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-inkMuted">Target</p>
              <p className="font-display text-lg font-semibold text-ink">{analysis.target_column}</p>
            </div>
            <span
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                isClassification
                  ? 'border-charcoal bg-charcoal text-bg'
                  : 'border-charcoal bg-charcoal text-bg'
              }`}
            >
              {isClassification ? <GitBranch size={13} /> : <TrendingUp size={13} />}
              {isClassification ? 'Classification' : 'Regression'}
            </span>
          </div>

          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-xs text-inkMuted">Data type</dt>
              <dd className="mt-0.5 font-medium text-ink">{analysis.dtype}</dd>
            </div>
            <div>
              <dt className="text-xs text-inkMuted">Unique values</dt>
              <dd className="mt-0.5 font-medium text-ink">{analysis.unique_count}</dd>
            </div>
            <div>
              <dt className="text-xs text-inkMuted">Missing</dt>
              <dd className="mt-0.5 font-medium text-ink">{analysis.missing_count}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-2 text-xs uppercase tracking-wide text-inkMuted">
            Value distribution {analysis.distribution.length >= 10 ? '(top 10)' : ''}
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.distribution} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--dp-chart-grid, #00000010)" />
                <XAxis
                  dataKey="value"
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  className="text-inkMuted"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={40}
                />
                <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-inkMuted" width={30} />
                <Tooltip
                  contentStyle={{
                    background: 'rgb(var(--dp-card))',
                    border: '1px solid rgb(var(--dp-border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="rgb(var(--dp-charcoal))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
