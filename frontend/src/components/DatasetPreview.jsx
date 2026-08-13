export default function DatasetPreview({ profile }) {
  if (!profile) return null
  const columns = profile.column_order
  const rows = profile.preview_rows

  return (
    <section className="mt-6 animate-fadeUp">
      <h3 className="mb-3 font-display text-base font-semibold text-ink">
        Preview — first {rows.length} rows
      </h3>
      <div className="dp-scroll overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-inkMuted">
              {columns.map((col) => (
                <th key={col} className="whitespace-nowrap px-4 py-2.5 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-border/70 last:border-none">
                {columns.map((col) => (
                  <td key={col} className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-ink">
                    {row[col] === null || row[col] === undefined || row[col] === '' ? (
                      <span className="text-inkMuted">—</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
