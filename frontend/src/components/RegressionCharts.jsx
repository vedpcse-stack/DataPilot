import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const tooltipStyle = {
  background: 'rgb(var(--dp-card))',
  border: '1px solid rgb(var(--dp-border))',
  borderRadius: 8,
  fontSize: 12,
}

export default function RegressionCharts({ actualVsPredicted, residuals }) {
  const allValues = actualVsPredicted.flatMap((p) => [p.actual, p.predicted])
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-inkMuted">
          Actual vs Predicted
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 4, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="rgb(var(--dp-border))" />
              <XAxis
                type="number"
                dataKey="actual"
                name="Actual"
                domain={[min, max]}
                tick={{ fontSize: 11 }}
                className="text-inkMuted"
              />
              <YAxis
                type="number"
                dataKey="predicted"
                name="Predicted"
                domain={[min, max]}
                tick={{ fontSize: 11 }}
                className="text-inkMuted"
                width={40}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
              <ReferenceLine
                segment={[
                  { x: min, y: min },
                  { x: max, y: max },
                ]}
                stroke="rgb(var(--dp-ink-muted))"
                strokeDasharray="4 4"
              />
              <Scatter data={actualVsPredicted} fill="rgb(var(--dp-charcoal))" fillOpacity={0.65} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-inkMuted">
          Residual plot
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 4, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="rgb(var(--dp-border))" />
              <XAxis
                type="number"
                dataKey="predicted"
                name="Predicted"
                tick={{ fontSize: 11 }}
                className="text-inkMuted"
              />
              <YAxis
                type="number"
                dataKey="residual"
                name="Residual"
                tick={{ fontSize: 11 }}
                className="text-inkMuted"
                width={40}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
              <ReferenceLine y={0} stroke="rgb(var(--dp-ink-muted))" strokeDasharray="4 4" />
              <Scatter data={residuals} fill="rgb(var(--dp-charcoal))" fillOpacity={0.65} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
