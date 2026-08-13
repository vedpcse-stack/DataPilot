import { Compass } from 'lucide-react'
import ThemeToggle from './ThemeToggle.jsx'

export default function Navbar({ theme, onToggleTheme, stage }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-charcoal text-bg">
            <Compass size={17} strokeWidth={2.25} />
          </span>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold tracking-tight text-ink">
              DataPilot
            </p>
            <p className="hidden text-[11px] text-inkMuted sm:block">
              No-code machine learning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {stage && (
            <span className="hidden rounded-full border border-border bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-inkMuted md:inline-block">
              {stage}
            </span>
          )}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  )
}
