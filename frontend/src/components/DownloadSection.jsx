import { useState } from 'react'
import { Download, FileDown, Loader2 } from 'lucide-react'
import * as api from '../services/api'

export default function DownloadSection({ modelId }) {
  const [downloading, setDownloading] = useState(null) // 'model' | 'report' | null
  const [error, setError] = useState(null)

  const handleDownload = async (kind) => {
    setDownloading(kind)
    setError(null)
    try {
      if (kind === 'model') {
        await api.triggerFileDownload(api.modelDownloadUrl(modelId), 'datapilot_model.pkl')
      } else {
        await api.triggerFileDownload(api.reportDownloadUrl(modelId), 'datapilot_report.pdf')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <section className="mt-10 animate-fadeUp pb-16">
      <h2 className="mb-4 font-display text-lg font-semibold text-ink">Export</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => handleDownload('model')}
          disabled={downloading !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-inkMuted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading === 'model' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          Download Model (.pkl)
        </button>
        <button
          type="button"
          onClick={() => handleDownload('report')}
          disabled={downloading !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-charcoal px-6 py-3.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading === 'report' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileDown size={16} />
          )}
          Download PDF Report
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-inkMuted">{error}</p>}
    </section>
  )
}
