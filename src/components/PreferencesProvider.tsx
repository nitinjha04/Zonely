"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Curated style accents (reduced + textured)
export type AccentColor = 'ocean' | 'forest' | 'sunset' | 'blossom' | 'aurora' | 'midnight'
export type TimeFont = 'mono' | 'sans' | 'serif' | 'condensed' | 'wide' | 'thin'

interface Preferences {
  accent: AccentColor
  font: TimeFont
  fontScale: number
  selectedTimezone?: string
  countryFilter?: string
  fullscreen: boolean
  showSeconds: boolean
  showDate: boolean
  showGrid: boolean
  showQuotes: boolean
  compactCards: boolean
  showSelector: boolean
  showCityCards: boolean
  bgAnimation: boolean
  alarmTime?: string // HH:MM in local time
  alarmEnabled?: boolean
  use24h: boolean
  pinnedTimezones: string[]
  dockMode: boolean
  autoAccent: boolean
  reduceMotion: boolean
  locale: string
  highContrast: boolean
}

interface PreferencesContextType {
  preferences: Preferences
  update: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
  reset: () => void
}

const DEFAULT: Preferences = {
  accent: 'ocean',
  font: 'mono',
  fontScale: 1,
  selectedTimezone: undefined,
  countryFilter: '',
  fullscreen: false,
  showSeconds: true,
  showDate: true,
  showGrid: true,
  showQuotes: true,
  compactCards: false,
  showSelector: true,
  showCityCards: true,
  bgAnimation: false,
  alarmTime: undefined,
  alarmEnabled: false,
  use24h: true,
  pinnedTimezones: [],
  dockMode: false,
  autoAccent: false,
  reduceMotion: false,
  locale: 'en-US',
  highContrast: false,
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

const STORAGE_KEY = 'zonely:preferences:v1'

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        // Fallback if old accent no longer exists
        const allowed: AccentColor[] = ['ocean','forest','sunset','blossom','aurora','midnight']
        if (!allowed.includes(parsed.accent)) parsed.accent = 'ocean'
        setPreferences({ ...DEFAULT, ...parsed })
      }
    } catch {}
    // Detect reduced motion user preference (non-persistent; stored each load)
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      const setRM = () => setPreferences(p=>({...p, reduceMotion: mq.matches}))
      setRM()
      mq.addEventListener('change', setRM)
      return () => mq.removeEventListener('change', setRM)
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    }
  }, [preferences, loaded])

  // Update CSS variables for accent (gradient + pattern layer)
  useEffect(() => {
    const root = document.documentElement
    const accentMap: Record<AccentColor, {from:string; to:string; solid:string; pattern:string}> = {
      ocean: { from:'#1D4ED8', to:'#0EA5E9', solid:'#0EA5E9', pattern: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 6px, rgba(255,255,255,0.05) 6px 12px)' },
      forest: { from:'#065F46', to:'#10B981', solid:'#10B981', pattern: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.15) 0 8px, rgba(255,255,255,0.04) 8px 16px)' },
      sunset: { from:'#F59E0B', to:'#EF4444', solid:'#F59E0B', pattern: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.17) 0 4px, rgba(255,255,255,0.05) 4px 8px)' },
      blossom: { from:'#DB2777', to:'#8B5CF6', solid:'#DB2777', pattern: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), rgba(255,255,255,0) 60%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.15), rgba(255,255,255,0) 65%)' },
      aurora: { from:'#059669', to:'#6366F1', solid:'#10B981', pattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.25), rgba(255,255,255,0) 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18), rgba(255,255,255,0) 55%)' },
      midnight: { from:'#312E81', to:'#0F172A', solid:'#4338CA', pattern: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0 1px, rgba(255,255,255,0) 1px 6px), repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 1px, rgba(255,255,255,0) 1px 6px)' },
    }
    const a = accentMap[preferences.accent]
    root.style.setProperty('--accent-from', a.from)
    root.style.setProperty('--accent-to', a.to)
    root.style.setProperty('--accent-solid', a.solid)
    root.style.setProperty('--accent-pattern', a.pattern)
  }, [preferences.accent])

  // Auto accent theme based on time-of-day when enabled
  useEffect(()=>{
    if(!preferences.autoAccent) return
    const apply = () => {
      const hour = new Date().getHours()
      let next: AccentColor
      if(hour >= 5 && hour < 9) next = 'blossom' // sunrise
      else if(hour >=9 && hour < 17) next = 'ocean' // day
      else if(hour >=17 && hour < 21) next = 'sunset' // sunset
      else if(hour >=21 || hour < 5) next = 'midnight' // night
      else next = 'ocean'
      setPreferences(p=> p.accent === next ? p : ({...p, accent: next}))
    }
    apply()
    const id = setInterval(apply, 60 * 1000) // check each minute
    return ()=> clearInterval(id)
  },[preferences.autoAccent])

  // High contrast mode tweaks
  useEffect(()=>{
    const root = document.documentElement
    if(preferences.highContrast){
      root.classList.add('high-contrast')
      root.style.setProperty('--accent-from', '#000')
      root.style.setProperty('--accent-to', '#000')
      root.style.setProperty('--accent-solid', '#000')
      root.style.setProperty('--accent-pattern', 'none')
    } else {
      root.classList.remove('high-contrast')
    }
  },[preferences.highContrast])

  const update = (key: keyof Preferences, value: any) => {
    setPreferences(p => ({ ...p, [key]: value }))
  }

  const reset = () => setPreferences(DEFAULT)

  return (
    <PreferencesContext.Provider value={{ preferences, update, reset }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be inside PreferencesProvider')
  return ctx
}

// Utility helpers
export const accentClass = (accent: AccentColor) => ({
  ocean: 'from-[#1D4ED8] to-[#0EA5E9]',
  forest: 'from-[#065F46] to-[#10B981]',
  sunset: 'from-[#F59E0B] to-[#EF4444]',
  blossom: 'from-[#DB2777] to-[#8B5CF6]',
  aurora: 'from-[#059669] to-[#6366F1]',
  midnight: 'from-[#312E81] to-[#0F172A]',
}[accent])

export const solidAccent = (accent: AccentColor) => ({
  ocean: 'text-sky-500',
  forest: 'text-emerald-500',
  sunset: 'text-amber-500',
  blossom: 'text-fuchsia-500',
  aurora: 'text-teal-500',
  midnight: 'text-indigo-500',
}[accent])

export const borderAccent = (accent: AccentColor) => ({
  ocean: 'focus:ring-sky-500',
  forest: 'focus:ring-emerald-500',
  sunset: 'focus:ring-amber-500',
  blossom: 'focus:ring-fuchsia-500',
  aurora: 'focus:ring-teal-500',
  midnight: 'focus:ring-indigo-500',
}[accent])

export const solidBgAccent = (accent: AccentColor) => ({
  ocean: 'bg-sky-500',
  forest: 'bg-emerald-500',
  sunset: 'bg-amber-500',
  blossom: 'bg-fuchsia-500',
  aurora: 'bg-teal-500',
  midnight: 'bg-indigo-600',
}[accent])

export const borderColorAccent = (accent: AccentColor) => ({
  ocean: 'border-sky-500',
  forest: 'border-emerald-500',
  sunset: 'border-amber-500',
  blossom: 'border-fuchsia-500',
  aurora: 'border-teal-500',
  midnight: 'border-indigo-600',
}[accent])

export const ringAccent = (accent: AccentColor) => ({
  ocean: 'ring-sky-500/40',
  forest: 'ring-emerald-500/40',
  sunset: 'ring-amber-500/40',
  blossom: 'ring-fuchsia-500/40',
  aurora: 'ring-teal-500/40',
  midnight: 'ring-indigo-500/40',
}[accent])

export const fontClass = (font: TimeFont) => ({
  mono: 'font-mono tracking-tight',
  sans: 'font-sans tracking-tight',
  serif: 'font-serif tracking-tight',
  condensed: 'font-sans tracking-wider',
  wide: 'font-wide tracking-tight',
  thin: 'font-thin tracking-tight',
}[font])
