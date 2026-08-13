export default function ConfusionMatrix({ data }) {
  if (!data) return null
  const { labels, matrix } = data
  const max = Math.max(...matrix.flat(), 1)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-inkMuted">
        Confusion matrix
      </p>
      <div className="dp-scroll overflow-x-auto">
        <table className="border-collapse text-center text-xs">
          <thead>
            <tr>
              <th className="p-2"></th>
              <th
                colSpan={labels.length}
                className="pb-1 text-[10px] font-medium uppercase tracking-wide text-inkMuted"
              >
                Predicted
              </th>
            </tr>
            <tr>
              <th className="p-2"></th>
              {labels.map((l) => (
                <th key={l} className="whitespace-nowrap p-2 font-medium text-ink">
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                {i === 0 && (
                  <th
                    rowSpan={matrix.length}
                    className="whitespace-nowrap p-2 pr-3 align-middle text-[10px] font-medium uppercase tracking-wide text-inkMuted"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    Actual
                  </th>
                )}
                <th className="whitespace-nowrap p-2 pr-3 font-medium text-ink">{labels[i]}</th>
                {row.map((val, j) => {
                  const intensity = val / max
                  return (
                    <td
                      key={j}
                      className="h-14 w-14 rounded-md font-mono text-sm font-semibold"
                      style={{
                        backgroundColor: `rgb(var(--dp-charcoal) / ${0.08 + intensity * 0.55})`,
                        color: intensity > 0.55 ? 'rgb(var(--dp-bg))' : 'rgb(var(--dp-ink))',
                      }}
                    >
                      {val}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
