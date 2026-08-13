import { AlertTriangle, Copy, Database, FileText, Hash, Layers } from 'lucide-react'

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-inkMuted">
        <Icon size={13} />
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-display text-xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-inkMuted">{hint}</p>}
    </div>
  )
}

export default function DatasetOverview({ profile }) {
  if (!profile) return null

  return (
    <section className="animate-fadeUp">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Dataset profile</h2>
        <span className="truncate rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-inkMuted">
          {profile.filename}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Layers} label="Rows" value={profile.row_count.toLocaleString()} />
        <StatCard icon={Database} label="Columns" value={profile.column_count} />
        <StatCard icon={FileText} label="File size" value={profile.file_size_display} />
        <StatCard icon={Hash} label="Total cells" value={profile.total_cells.toLocaleString()} />
        <StatCard
          icon={AlertTriangle}
          label="Missing values"
          value={profile.missing_value_count.toLocaleString()}
        />
        <StatCard icon={Copy} label="Duplicate rows" value={profile.duplicate_row_count.toLocaleString()} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="dp-scroll overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-inkMuted">
                <th className="px-4 py-2.5 font-medium">Column</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Unique values</th>
                <th className="px-4 py-2.5 font-medium">Missing</th>
              </tr>
            </thead>
            <tbody>
              {profile.columns.map((col) => (
                <tr key={col.name} className="border-b border-border/70 last:border-none">
                  <td className="px-4 py-2.5 font-medium text-ink">{col.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full border border-border bg-cardAlt px-2 py-0.5 text-xs text-inkMuted">
                      {col.dtype}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-inkMuted">{col.unique_count}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-inkMuted">{col.missing_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
