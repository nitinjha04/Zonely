'use client'

import { useState, useEffect } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { usePreferences, fontClass, accentClass, ringAccent } from './PreferencesProvider'
import { countryTimezones, topCountryCodes } from '../data/countryTimezones'
import { useMemo, useRef } from 'react'
import { useAccurateUtcTime } from '../hooks/useAccurateUtcTime'

interface TimeZone {
  name: string
  timezone: string
  abbreviation: string
  flag: string
  offset: string
}

// Base curated list; will be enriched with full IANA zones
const baseTimeZones: TimeZone[] = [
  { name: 'New York', timezone: 'America/New_York', abbreviation: 'EST/EDT', flag: '🇺🇸', offset: 'UTC-5/-4' },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', abbreviation: 'PST/PDT', flag: '🇺🇸', offset: 'UTC-8/-7' },
  { name: 'London', timezone: 'Europe/London', abbreviation: 'GMT/BST', flag: '🇬🇧', offset: 'UTC+0/+1' },
  { name: 'Paris', timezone: 'Europe/Paris', abbreviation: 'CET/CEST', flag: '🇫🇷', offset: 'UTC+1/+2' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo', abbreviation: 'JST', flag: '🇯🇵', offset: 'UTC+9' },
  { name: 'Sydney', timezone: 'Australia/Sydney', abbreviation: 'AEDT/AEST', flag: '🇦🇺', offset: 'UTC+11/+10' },
  { name: 'Mumbai', timezone: 'Asia/Kolkata', abbreviation: 'IST', flag: '🇮🇳', offset: 'UTC+5:30' },
  { name: 'Dubai', timezone: 'Asia/Dubai', abbreviation: 'GST', flag: '🇦🇪', offset: 'UTC+4' },
  { name: 'Moscow', timezone: 'Europe/Moscow', abbreviation: 'MSK', flag: '🇷🇺', offset: 'UTC+3' },
  { name: 'Singapore', timezone: 'Asia/Singapore', abbreviation: 'SGT', flag: '🇸🇬', offset: 'UTC+8' },
  { name: 'São Paulo', timezone: 'America/Sao_Paulo', abbreviation: 'BRT', flag: '🇧🇷', offset: 'UTC-3' },
  { name: 'Mexico City', timezone: 'America/Mexico_City', abbreviation: 'CST/CDT', flag: '🇲🇽', offset: 'UTC-6/-5' },
]

// Attempt to generate a larger unique list of zones (browser env only)
const allZoneNames: string[] = typeof Intl !== 'undefined' && (Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf('timeZone') : baseTimeZones.map(z=>z.timezone)

const timeZones: TimeZone[] = Array.from(new Set([...baseTimeZones.map(z=>z.timezone), ...allZoneNames])).slice(0, 400).map(tz => {
  const existing = baseTimeZones.find(b => b.timezone === tz)
  if (existing) return existing
  // Derive name from timezone path
  const parts = tz.split('/')
  const raw = parts[parts.length - 1].replace(/_/g,' ')
  // Build basic offset (approx) using current date
  const now = new Date()
  try {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    const parts = fmt.formatToParts(now)
    const tzName = parts.find(p=>p.type==='timeZoneName')?.value || ''
    const match = tzName.match(/GMT([+-]\d+)?/i)
    const off = match? match[0].replace('GMT','UTC'): 'UTC'
    return {
      name: raw,
      timezone: tz,
      abbreviation: tzName.replace(/\s.+$/,''),
      flag: '',
      offset: off,
    }
  } catch {
    return {
      name: raw,
      timezone: tz,
      abbreviation: '',
      flag: '',
      offset: '',
    }
  }
})

interface WorldTimeDisplayProps {
  isFullscreen: boolean
  fsSearchOpen?: boolean
  onCloseSearch?: () => void
}

export default function WorldTimeDisplay({ isFullscreen, fsSearchOpen, onCloseSearch }: WorldTimeDisplayProps) {
  // Use network-synced base UTC time
  const { now: accurateNow } = useAccurateUtcTime()
  const [mounted, setMounted] = useState(false)
  useEffect(()=>{ setMounted(true) },[])
  const detectTz = () => {
    if(!mounted) return timeZones[0].timezone
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return timeZones[0].timezone }
  }
  const initialTz = detectTz()
  const { preferences, update } = usePreferences()
  const storedTz = preferences.selectedTimezone
  const [selectedTimezone, setSelectedTimezone] = useState(()=>{
    const tzToUse = storedTz || initialTz
    return timeZones.find(t=> t.timezone===tzToUse) || timeZones[0]
  })
  const [query, setQuery] = useState('')
  const countryFilter = preferences.countryFilter || ''
  const setCountryFilter = (val: string) => update('countryFilter', val)

  // Apply a country filter and optionally auto-select a representative timezone
  const applyCountryFilter = (code: string) => {
    setCountryFilter(code)
    if(code){
      const country = countryTimezones.find(c=> c.code===code)
      if(country){
        const primaryTz = country.timezones[0]
        if(primaryTz && selectedTimezone.timezone !== primaryTz && !country.timezones.includes(selectedTimezone.timezone)){
          const tzObj = timeZones.find(t=> t.timezone===primaryTz)
          if(tzObj){
            setSelectedTimezone(tzObj)
            update('selectedTimezone', tzObj.timezone)
          }
        }
      }
    }
  }

  // On mount / preference load: if a country filter is active but current timezone not inside it, align.
  useEffect(()=>{
    if(countryFilter){
      const country = countryTimezones.find(c=> c.code===countryFilter)
      if(country && !country.timezones.includes(selectedTimezone.timezone)){
        const primaryTz = country.timezones[0]
        const tzObj = timeZones.find(t=> t.timezone===primaryTz)
        if(tzObj){
          setSelectedTimezone(tzObj)
          update('selectedTimezone', tzObj.timezone)
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[countryFilter])
  // Page-based pagination for city cards when not searching
  const PAGE_SIZE = 24
  const [page, setPage] = useState(0)
  const searchRef = useRef<HTMLInputElement|null>(null)
  const [showFsSearch, setShowFsSearch] = useState(false)

  // Focus main search when custom event fired (from shortcut outside fullscreen)
  useEffect(()=>{
    const focusHandler = () => {
      if(!isFullscreen && preferences.showSelector){
        searchRef.current?.focus()
      }
    }
    window.addEventListener('focus-main-search', focusHandler)
    return ()=> window.removeEventListener('focus-main-search', focusHandler)
  },[isFullscreen, preferences.showSelector])

  // Sync external fullscreen search trigger
  useEffect(()=>{
    if(isFullscreen){
      if(fsSearchOpen){
        setShowFsSearch(true)
        // focus after small delay to ensure overlay rendered
        setTimeout(()=> searchRef.current?.focus(), 30)
      } else {
        setShowFsSearch(false)
      }
    }
  },[fsSearchOpen, isFullscreen])

  // We rely entirely on the network-synced time from the hook; no extra device interval.

  // Legacy pattern-based formatting still used for date; time uses Intl for locale respect
  const formatAt = (timezone: string, pattern: string) => formatInTimeZone(accurateNow, timezone, pattern)

  const filtered = useMemo(()=>{
    let baseList = timeZones
    if(countryFilter){
      const country = countryTimezones.find(c=> c.code===countryFilter)
      if(country){
        baseList = baseList.filter(t=> country.timezones.includes(t.timezone))
      }
    }
    if(!query.trim()) return baseList
    const q = query.toLowerCase()
    return baseList.filter(t=> (t.name||'').toLowerCase().includes(q) || t.timezone.toLowerCase().includes(q) || (t.abbreviation||'').toLowerCase().includes(q))
  },[query, countryFilter])

  // Reset / clamp page when dataset or query changes
  useEffect(()=>{
    if(query){
      setPage(0)
    } else {
      const maxPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1)
      if(page > maxPage) setPage(maxPage)
    }
  },[query, filtered.length, page])

  const timeString = (tz: string) => {
    try {
      const opt: Intl.DateTimeFormatOptions = {
        hour: 'numeric', minute: '2-digit', second: preferences.showSeconds? '2-digit': undefined,
        hour12: !preferences.use24h,
        timeZone: tz,
      }
      // Ensure 2-digit hour when 24h
      if(preferences.use24h) opt.hour = '2-digit'
      return new Intl.DateTimeFormat(preferences.locale || 'en-US', opt).format(accurateNow)
    } catch {
      const fallbackPattern = preferences.use24h ? (preferences.showSeconds? 'HH:mm:ss':'HH:mm') : (preferences.showSeconds? 'hh:mm:ss a':'hh:mm a')
      return formatAt(tz, fallbackPattern)
    }
  }
  const accentGradient = 'bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)]'

  const renderTime = (tz: string, sizeClasses: string, weight: string = 'font-semibold') => {
    const str = timeString(tz)
    const scale = isFullscreen ? (preferences.fontScale || 1) : 1
    return (
      <div aria-live={preferences.showSeconds? 'off':'polite'} aria-label={`Current time ${str}`} className={`select-none leading-none tracking-tight ${fontClass(preferences.font)} ${weight} ${sizeClasses} flex items-center justify-center`} style={scale!==1?{ transform:`scale(${scale})` }:undefined}> 
        {str.split('').map((ch,i)=> {
          if(ch === ':'){
            return <span key={i} className="mx-[0.05em] text-transparent bg-clip-text bg-gradient-to-b from-[var(--accent-from)] to-[var(--accent-to)]">:</span>
          }
          return <span key={i}>{ch}</span>
        })}
      </div>
    )
  }

  if(!mounted){
    return <div className="flex items-center justify-center py-20" suppressHydrationWarning><span className="text-neutral-400 text-sm">Loading…</span></div>
  }
  if (isFullscreen) {
    return (
      <div className="h-full w-full relative flex flex-col items-center justify-center px-6 pb-16">
        {/* Centered time */}
  {renderTime(selectedTimezone.timezone, 'text-[18vw] md:text-[14rem] xl:text-[16rem]')}
        {/* Meta info below */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <h1 className="text-base md:text-lg font-medium tracking-wide text-neutral-500 dark:text-neutral-400">
            {selectedTimezone.name}
          </h1>
            {preferences.showDate && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{formatAt(selectedTimezone.timezone, 'EEEE, MMM d, yyyy')}</p>
          )}
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {selectedTimezone.abbreviation} {selectedTimezone.offset}
          </p>
        </div>
        {/* Fullscreen search overlay */}
        {preferences.showSelector && showFsSearch && (
          <div className="absolute inset-0 z-40 flex items-start justify-center pt-28 px-4 backdrop-blur-xl bg-neutral-50/70 dark:bg-neutral-950/70">
            <div className="w-full max-w-2xl">
              <div className="flex items-center gap-2">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={e=>setQuery(e.target.value)}
                  placeholder="Search timezone or city..."
                  className="flex-1 rounded-lg px-5 py-4 bg-neutral-100/90 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 text-sm shadow-sm"
                />
                <button
                  onClick={()=>{ setQuery(''); setShowFsSearch(false); onCloseSearch?.() }}
                  className="h-12 w-12 flex items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-900/70 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                  aria-label="Close search"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-2 flex-wrap mt-4">
                <button
                  onClick={()=> setCountryFilter('')}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium border transition ${!countryFilter? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100':'border-neutral-300 dark:border-neutral-700 bg-neutral-100/60 dark:bg-neutral-900/60 hover:border-neutral-500 dark:hover:border-neutral-500'}`}
                >All</button>
                {topCountryCodes.map(code=> {
                  const c = countryTimezones.find(ct=> ct.code===code)!
                  const active = countryFilter===code
                  return (
                    <button
                      key={code}
                      onClick={()=> applyCountryFilter(code)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium border transition ${active? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100':'border-neutral-300 dark:border-neutral-700 bg-neutral-100/60 dark:bg-neutral-900/60 hover:border-neutral-500 dark:hover:border-neutral-500'}`}
                    >{c.country}</button>
                  )
                })}
              </div>
              <div className="mt-5 max-h-[50vh] overflow-auto rounded-xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/40 shadow-xl">
                {filtered.map(tz => (
                  <button key={tz.timezone} onClick={()=>{ setSelectedTimezone(tz); update('selectedTimezone', tz.timezone); setQuery(''); setShowFsSearch(false); onCloseSearch?.(); }}
                    className="w-full text-left px-5 py-3 hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70 text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1">{tz.flag && <span>{tz.flag}</span>} {tz.name || tz.timezone}</span>
                    <span className="tabular-nums text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                      {timeString(tz.timezone)}
                      {tz.offset && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800/60">{tz.offset}</span>}
                    </span>
                  </button>
                ))}
                {!filtered.length && <div className="px-5 py-4 text-xs text-neutral-500">No matches</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-12 flex flex-col gap-10">
      <section className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          {renderTime(selectedTimezone.timezone, 'text-7xl sm:text-8xl md:text-9xl lg:text-[10rem]')}
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{selectedTimezone.flag} {selectedTimezone.name}</p>
            {preferences.showDate && (
              <p className="text-xs text-neutral-500 dark:text-neutral-500">{formatAt(selectedTimezone.timezone, 'EEEE, MMM d, yyyy')}</p>
            )}
          </div>
        </div>
        {preferences.showSelector && (
          <div className="w-full max-w-xl px-4">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
                <button
                  onClick={()=> setCountryFilter('')}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium border transition ${!countryFilter? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100':'border-neutral-300 dark:border-neutral-700 bg-neutral-100/60 dark:bg-neutral-900/60 hover:border-neutral-500 dark:hover:border-neutral-500'}`}
                >All</button>
                {topCountryCodes.map(code=> {
                  const c = countryTimezones.find(ct=> ct.code===code)!
                  const active = countryFilter===code
                  return (
                    <button
                      key={code}
                      onClick={()=> applyCountryFilter(code)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium border transition ${active? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100':'border-neutral-300 dark:border-neutral-700 bg-neutral-100/60 dark:bg-neutral-900/60 hover:border-neutral-500 dark:hover:border-neutral-500'}`}
                    >{c.country}</button>
                  )
                })}
              </div>
              <input
                ref={searchRef}
                value={query}
                onChange={e=>setQuery(e.target.value)}
                placeholder={countryFilter? 'Search within country...' : 'Search timezone or city...'}
                className="w-full rounded-full px-5 py-3 bg-neutral-100/70 dark:bg-neutral-900/70 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 text-sm"
              />
            </div>
          </div>
        )}
      </section>
      {preferences.showGrid && preferences.showCityCards && (
        <section className="px-2 flex flex-col gap-5">
          <div className={`grid gap-5 ${preferences.compactCards ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
          {(query ? filtered : filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)).map(tz => {
            const active = tz.name === selectedTimezone.name
            return (
              <button
                key={tz.name}
                onClick={() => { setSelectedTimezone(tz); update('selectedTimezone', tz.timezone) }}
                className={`group relative text-left rounded-xl transition-all p-4 flex flex-col gap-2 border backdrop-blur-sm ${active? 'border-neutral-900 dark:border-neutral-200 bg-neutral-100/80 dark:bg-neutral-800/70 shadow ring-2 '+ringAccent(preferences.accent):'border-neutral-200/70 dark:border-neutral-800/70 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-sm bg-neutral-50/40 dark:bg-neutral-900/30'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 font-medium truncate">{tz.name || tz.timezone}</span>
                    {preferences.showDate && (
                      <span className="text-[10px] text-neutral-400 mt-1">{formatAt(tz.timezone, 'MMM d')}</span>
                    )}
                  </div>
                  {tz.offset && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300">{tz.offset}</span>}
                </div>
                <div className="flex items-end justify-between">
                  <span className={`text-[1.35rem] font-semibold ${fontClass(preferences.font)} tabular-nums tracking-tight leading-none`}>
                    {preferences.use24h ? timeString(tz.timezone) : timeString(tz.timezone)}
                  </span>
                  {tz.abbreviation && <span className="text-[10px] text-neutral-400 tracking-wide uppercase">{tz.abbreviation}</span>}
                </div>
                {active && (
                  <span className={`absolute inset-x-4 bottom-1 h-0.5 rounded overflow-hidden`}>
                    <span className={`absolute inset-0 bg-gradient-to-r ${accentClass(preferences.accent)}`} />
                    <span className="absolute inset-0 opacity-60" style={{background:'var(--accent-pattern)'}} />
                  </span>
                )}
              </button>
            )
          })}
          </div>
          {!query && filtered.length > PAGE_SIZE && (
            <div className="flex flex-col items-center gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={()=> setPage(p=> Math.max(0, p-1))}
                  disabled={page===0}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${page===0? 'opacity-40 cursor-not-allowed border-neutral-300 dark:border-neutral-700':'border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-500 bg-neutral-100/60 dark:bg-neutral-900/60'}`}
                  aria-label="Previous page"
                >Prev</button>
                {/* Page indicators (show at most 7 with ellipsis) */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const total = Math.ceil(filtered.length / PAGE_SIZE)
                    const pages: (number | 'ellipsis')[] = []
                    const push = (v: number | 'ellipsis') => pages.push(v)
                    for(let i=0;i<total;i++){
                      if(total <= 7){ push(i); continue }
                      if(i === 0 || i === total-1 || Math.abs(i - page) <=1){ push(i) }
                      else if(pages[pages.length-1] !== 'ellipsis'){ push('ellipsis') }
                    }
                    return pages.map((p,i)=> p==='ellipsis'? <span key={i} className="text-[10px] px-1 text-neutral-400">…</span> : (
                      <button
                        key={p}
                        onClick={()=> setPage(p)}
                        className={`h-7 w-7 rounded-full text-[11px] font-medium border transition ${p===page? 'border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900':'border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-500 bg-neutral-100/60 dark:bg-neutral-900/60'}`}
                        aria-label={`Go to page ${p+1}`}
                      >{p+1}</button>
                    ))
                  })()}
                </div>
                <button
                  onClick={()=> setPage(p=> Math.min(Math.ceil(filtered.length / PAGE_SIZE)-1, p+1))}
                  disabled={page >= Math.ceil(filtered.length / PAGE_SIZE)-1}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${page >= Math.ceil(filtered.length / PAGE_SIZE)-1? 'opacity-40 cursor-not-allowed border-neutral-300 dark:border-neutral-700':'border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-500 bg-neutral-100/60 dark:bg-neutral-900/60'}`}
                  aria-label="Next page"
                >Next</button>
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Page {page+1} of {Math.ceil(filtered.length / PAGE_SIZE)}</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
