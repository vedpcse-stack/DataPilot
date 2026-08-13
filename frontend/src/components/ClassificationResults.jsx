import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Award, Clock, Database, ListChecks } from 'lucide-react'
import ConfusionMatrix from './ConfusionMatrix.jsx'
import ModelComparison from './ModelComparison.jsx'

function MetricCard({ label, value, suffix = '' }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
      <p className="text-[11px] uppercase tracking-wide text-inkMuted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">
        {value}
        {suffix}
      </p>
    </div>
  )
}

function InfoPill({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-inkMuted">
      <Icon size={13} />
      <span>
        {label}: <span className="font-medium text-ink">{value}</span>
      </span>
    </div>
  )
}

export default function ClassificationResults({ result }) {
  if (!result) return null
  const { metrics } = result

  return (
    <section className="mt-10 animate-fadeUp">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-ink">Results</h2>
        <div className="flex flex-wrap gap-2">
          <InfoPill icon={Award} label="Best model" value={result.selected_model_label} />
          <InfoPill icon={Clock} label="Training time" value={`${result.training_time_seconds}s`} />
          <InfoPill icon={Database} label="Train / Test" value={`${result.train_samples} / ${result.test_samples}`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Accuracy" value={metrics.accuracy} suffix="%" />
        <MetricCard label="Precision" value={metrics.precision} suffix="%" />
        <MetricCard label="Recall" value={metrics.recall} suffix="%" />
        <MetricCard label="F1 Score" value={metrics.f1} suffix="%" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ConfusionMatrix data={result.confusion_matrix} />

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-inkMuted">
            <ListChecks size={13} /> Class distribution
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.class_distribution} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgb(var(--dp-border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-inkMuted" />
                <YAxis tick={{ fontSize: 11 }} className="text-inkMuted" width={32} />
                <Tooltip
                  contentStyle={{
                    background: 'rgb(var(--dp-card))',
                    border: '1px solid rgb(var(--dp-border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="rgb(var(--dp-charcoal))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {result.feature_importance && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-inkMuted">
            Feature importance
          </p>
          <div style={{ height: Math.max(180, result.feature_importance.length * 34) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={result.feature_importance}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="rgb(var(--dp-border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="text-inkMuted" />
                <YAxis
                  dataKey="feature"
                  type="category"
                  width={130}
                  tick={{ fontSize: 11 }}
                  className="text-inkMuted"
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgb(var(--dp-card))',
                    border: '1px solid rgb(var(--dp-border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="importance" fill="rgb(var(--dp-charcoal))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {result.comparison && (
        <div className="mt-4">
          <ModelComparison
            comparison={result.comparison}
            task="classification"
            bestModelLabel={result.selected_model_label}
          />
        </div>
      )}
    </section>
  )
}
