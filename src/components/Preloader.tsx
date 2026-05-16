"use client"
import { useEffect, useState, useRef } from 'react'
import { useAccurateUtcTime } from '../hooks/useAccurateUtcTime'

// National time loading preloader showing rotating city times and progress bar
export default function Preloader({ onDone, minDurationMs }:{ onDone: ()=>void, minDurationMs?: number }){
  const { now, ready } = useAccurateUtcTime()
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)
  const startRef = useRef<number>(Date.now())
  // Minimum time the preloader should remain fully visible (>= 2s as requested)
  const MIN_MS = minDurationMs ?? 2500
  const cities = [
    { label:'NYC', tz:'America/New_York' },
    { label:'LON', tz:'Europe/London' },
    { label:'DXB', tz:'Asia/Dubai' },
    { label:'TYO', tz:'Asia/Tokyo' },
    { label:'SYD', tz:'Australia/Sydney' },
  ]

  useEffect(()=>{
    const elapsed = Date.now() - startRef.current

    // Trigger exit only when progress reached 100, time is ready AND minimum duration elapsed
    if(progress >= 100 && ready && elapsed >= MIN_MS && !exiting){
      setExiting(true)
      return
    }

    if(!exiting){
      const id = setTimeout(()=> {
        setProgress(p => {
          // Target overall duration ~ (MIN_MS + 400ms) for smoother feel
          const targetDuration = MIN_MS + 400
          const newElapsed = Date.now() - startRef.current
          const ideal = Math.min(100, (newElapsed / targetDuration) * 100)
          // Ensure at least a small forward movement each tick
            const next = Math.max(p + 1.2, ideal)
          // If not ready or min time not yet reached, cap at 99 to avoid instant fade
          if((!ready || newElapsed < MIN_MS) && next >= 100) return 99
          return Math.min(100, next)
        })
      }, 80)
      return ()=>clearTimeout(id)
    }
  },[progress, ready, exiting])

  const activeIndex = Math.floor((Date.now()/800) % cities.length)
  const formatter = (tz:string)=> new Intl.DateTimeFormat('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false, timeZone:tz }).format(now)

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 transition-opacity duration-500 ${exiting? 'opacity-0 pointer-events-none':'opacity-100'}`}
      onTransitionEnd={()=> { if(exiting) onDone() }}
    >
      <div className="flex flex-col items-center gap-10 w-full max-w-sm px-8">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
            <circle cx="50" cy="50" r="44" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="6" fill="none" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="url(#grad)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={276}
              strokeDashoffset={276 - (276 * progress) / 100}
              className="transition-all duration-300 ease-out"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-from)" />
                <stop offset="100%" stopColor="var(--accent-to)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-xs tracking-wide text-neutral-500 dark:text-neutral-400 uppercase">World Time</span>
            <span className="text-lg font-mono tabular-nums tracking-tight">{progress.toFixed(0)}%</span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2 w-full">
          {cities.map((c,i)=>{
            const active = i===activeIndex
            return (
              <div key={c.tz} className={`flex flex-col items-center justify-center py-2 rounded-md text-center transition-all ${active? 'bg-neutral-200/70 dark:bg-neutral-800/70':'bg-neutral-100/40 dark:bg-neutral-900/40'} `}>
                <span className={`text-[9px] font-medium ${active? 'text-neutral-700 dark:text-neutral-200':'text-neutral-500 dark:text-neutral-500'}`}>{c.label}</span>
                <span className={`text-[11px] font-mono tabular-nums ${active? 'text-neutral-900 dark:text-neutral-50':'text-neutral-600 dark:text-neutral-400'}`}>{formatter(c.tz)}</span>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 tracking-wide uppercase">Syncing accurate UTC…</p>
      </div>
    </div>
  )
}
