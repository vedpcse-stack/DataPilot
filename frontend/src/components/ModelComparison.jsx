import { Trophy } from 'lucide-react'

export default function ModelComparison({ comparison, task, bestModelLabel }) {
  if (!comparison || comparison.length < 2) return null

  const columns =
    task === 'classification'
      ? [
          { key: 'accuracy', label: 'Accuracy', suffix: '%' },
          { key: 'precision', label: 'Precision', suffix: '%' },
          { key: 'recall', label: 'Recall', suffix: '%' },
          { key: 'f1', label: 'F1', suffix: '%' },
        ]
      : [
          { key: 'r2', label: 'R\u00B2', suffix: '' },
          { key: 'rmse', label: 'RMSE', suffix: '' },
          { key: 'mae', label: 'MAE', suffix: '' },
        ]

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-inkMuted">
        Model comparison — Auto Model
      </p>
      <div className="dp-scroll overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-inkMuted">
              <th className="py-2 pr-4 font-medium">Model</th>
              {columns.map((c) => (
                <th key={c.key} className="py-2 pr-4 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.map((row) => {
              const isBest = row.model === bestModelLabel
              return (
                <tr
                  key={row.key}
                  className={`border-b border-border/70 last:border-none ${
                    isBest ? 'bg-cardAlt' : ''
                  }`}
                >
                  <td className="flex items-center gap-1.5 py-2.5 pr-4 font-medium text-ink">
                    {isBest && <Trophy size={13} className="text-ink" />}
                    {row.model}
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="py-2.5 pr-4 font-mono text-xs text-ink">
                      {row[c.key]}
                      {c.suffix}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
