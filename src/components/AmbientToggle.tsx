"use client"
import { usePreferences } from './PreferencesProvider'

export default function AmbientToggle(){
  const { preferences, update } = usePreferences()
  const active = preferences.bgAnimation
  return (
    <button
      onClick={()=> update('bgAnimation', !active)}
      aria-label={active? 'Disable ambient animation':'Enable ambient animation'}
      className={`p-2 rounded-md border transition-colors relative flex items-center justify-center ${active? 'border-[var(--accent-from)]/60 bg-[linear-gradient(135deg,var(--accent-from)_0%,var(--accent-to)_100%)] text-white shadow-sm':'border-neutral-300 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900/70 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
      style={{touchAction:'manipulation'}}
    >
      {active ? (
        // Active: dynamic ambient ring with inner orb + sparkle
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="animate-[spin_6s_linear_infinite]">
          <defs>
            <linearGradient id="ambientGrad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="7" stroke="url(#ambientGrad)" strokeDasharray="6 10" />
          <circle cx="12" cy="12" r="3.2" fill="currentColor" fillOpacity="0.35" />
          <circle cx="17.5" cy="8.5" r="1.2" fill="currentColor" className="animate-pulse" />
        </svg>
      ) : (
        // Inactive: static cluster of spark particles
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 7.5 7.9 9l1.5.9-1.5.9L7 13.3l-.9-1.5L4.6 9.9 6.1 9 7 7.5Z" />
          <circle cx="15.5" cy="8.5" r="1.2" />
          <circle cx="13" cy="15" r="1" />
          <circle cx="18" cy="14.5" r="0.7" />
        </svg>
      )}
    </button>
  )
}
