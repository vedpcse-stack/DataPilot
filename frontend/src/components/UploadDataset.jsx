import { AlertCircle, FileSpreadsheet, Loader2, UploadCloud } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export default function UploadDataset({ status, error, uploadProgress, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  const isUploading = status === 'uploading'

  const handleFiles = useCallback((files) => {
    const file = files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setSelectedFile({ invalid: true, name: file.name })
      return
    }
    setSelectedFile(file)
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragActive(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
      <div className="animate-fadeUp">
        <p className="mb-3 inline-block rounded-full border border-border bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-inkMuted">
          Step 1 of 4
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Turn a spreadsheet into a trained model
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-inkMuted">
          Upload a CSV, DataPilot profiles it, detects whether you're solving a
          classification or regression problem, and trains a model — no code required.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`group mt-10 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl2 border-2 border-dashed px-8 py-14 transition-all duration-200 ${
          dragActive
            ? 'border-charcoal bg-cardAlt scale-[1.01]'
            : 'border-border bg-card hover:border-inkMuted'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-bg transition-transform duration-200 group-hover:scale-105">
          <UploadCloud size={24} strokeWidth={1.8} />
        </span>
        <p className="mt-5 text-[15px] font-medium text-ink">
          Drag & drop your CSV here
        </p>
        <p className="mt-1 text-sm text-inkMuted">or click to browse files · .csv only</p>
      </div>

      {selectedFile && !selectedFile.invalid && (
        <div className="mt-5 flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 animate-fadeUp">
          <div className="flex min-w-0 items-center gap-3 text-left">
            <FileSpreadsheet size={18} className="shrink-0 text-inkMuted" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{selectedFile.name}</p>
              <p className="text-xs text-inkMuted">{formatBytes(selectedFile.size)}</p>
            </div>
          </div>
        </div>
      )}

      {selectedFile?.invalid && (
        <div className="mt-5 flex w-full items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-ink animate-fadeUp">
          <AlertCircle size={16} className="shrink-0" />
          <span>"{selectedFile.name}" isn't a .csv file. Please choose a CSV.</span>
        </div>
      )}

      {error && (
        <div className="mt-5 flex w-full items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-ink animate-fadeUp">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        disabled={!selectedFile || selectedFile.invalid || isUploading}
        onClick={() => onUpload(selectedFile)}
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal px-6 py-3.5 text-sm font-semibold text-bg transition-all duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto sm:px-10"
      >
        {isUploading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Loading dataset{uploadProgress ? ` — ${uploadProgress}%` : '...'}
          </>
        ) : (
          'Load Dataset'
        )}
      </button>
    </div>
  )
}
