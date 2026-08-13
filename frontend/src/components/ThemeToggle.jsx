import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle color theme"
      className="relative flex h-9 w-16 items-center rounded-full border border-border bg-cardAlt px-1 transition-colors"
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-charcoal text-bg shadow-soft transition-transform duration-300 ease-out ${
          isDark ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
      </span>
    </button>
  )
}
