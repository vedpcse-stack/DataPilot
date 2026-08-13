import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Award, Clock, Database } from 'lucide-react'
import RegressionCharts from './RegressionCharts.jsx'
import ModelComparison from './ModelComparison.jsx'

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
      <p className="text-[11px] uppercase tracking-wide text-inkMuted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
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

export default function RegressionResults({ result }) {
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
        <MetricCard label="R\u00B2 Score" value={metrics.r2} />
        <MetricCard label="MSE" value={metrics.mse.toLocaleString()} />
        <MetricCard label="RMSE" value={metrics.rmse.toLocaleString()} />
        <MetricCard label="MAE" value={metrics.mae.toLocaleString()} />
      </div>

      <div className="mt-5">
        <RegressionCharts actualVsPredicted={result.actual_vs_predicted} residuals={result.residuals} />
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
            task="regression"
            bestModelLabel={result.selected_model_label}
          />
        </div>
      )}
    </section>
  )
}
