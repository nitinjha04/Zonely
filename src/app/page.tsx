'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WorldTimeDisplay from '../components/WorldTimeDisplay'
import AmbientBackground from '../components/AmbientBackground'
import TimeQuotes from '../components/TimeQuotes'
import ThemeToggle from '../components/ThemeToggle'
import FullscreenToggle from '../components/FullscreenToggle'
import AmbientToggle from '../components/AmbientToggle'
import SettingsPanel from '../components/SettingsPanel'
import { usePreferences } from '../components/PreferencesProvider'
import Preloader from '../components/Preloader'
import { useAccurateUtcTime } from '../hooks/useAccurateUtcTime'
import AlarmOverlay from '../components/AlarmOverlay'

// keyboard shortcuts component (global)
const ScriptShortcuts = ({
  isFullscreen,
  setFullscreen,
  openFsSearch,
  toggleAlarm,
  alarmEnabled,
  showSelector,
}:{
  isFullscreen:boolean;
  setFullscreen:(v:boolean)=>void;
  openFsSearch:()=>void;
  toggleAlarm:()=>void;
  alarmEnabled:boolean;
  showSelector:boolean;
})=>{
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      if(e.repeat) return
      if((e.metaKey||e.ctrlKey)||e.altKey) return
      const activeTag = (document.activeElement as HTMLElement | null)?.tagName
      if(activeTag && ['INPUT','TEXTAREA','SELECT'].includes(activeTag)) return
      const key = e.key.toLowerCase()
      if(key==='f'){
        e.preventDefault(); setFullscreen(!isFullscreen); return
      }
      if(key==='/' ){
        e.preventDefault()
        if(isFullscreen) openFsSearch(); else if(showSelector) window.dispatchEvent(new Event('focus-main-search'))
        return
      }
      if(key==='a'){
        e.preventDefault(); toggleAlarm(); return
      }
    }
    window.addEventListener('keydown',handler)
    return ()=>window.removeEventListener('keydown',handler)
  },[isFullscreen,setFullscreen,openFsSearch,toggleAlarm,alarmEnabled,showSelector])
  return null
}

export default function Home() {
  const { preferences, update } = usePreferences()
  const isFullscreen = preferences.fullscreen
  const setIsFullscreen = (val: boolean) => update('fullscreen', val)
  const [fsSearchOpen, setFsSearchOpen] = useState(false)
  const { ready } = useAccurateUtcTime()
  const [showLoader, setShowLoader] = useState(true)
  const [fsTransition, setFsTransition] = useState<null | 'enter' | 'exit'>(null)
  const [fsAnimating, setFsAnimating] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement|null>(null)
  // Animated fullscreen transitions
  const animatedSetFullscreen = (next: boolean) => {
    if (fsAnimating) return
    if (next && !isFullscreen) {
      // Enter fullscreen immediately then run a subtle scale-in
      setIsFullscreen(true)
      setFsAnimating(true)
      setFsTransition('enter')
      setTimeout(()=>{ setFsTransition(null); setFsAnimating(false) }, 550)
    } else if (!next && isFullscreen) {
      // Animate scale-out then leave fullscreen
      setFsAnimating(true)
      setFsTransition('exit')
      setTimeout(()=>{ setIsFullscreen(false); setFsSearchOpen(false); setFsTransition(null); setFsAnimating(false) }, 550)
    } else {
      setIsFullscreen(next)
    }
  }

  // Close mobile menu on outside tap
  useEffect(()=>{
    const handler = (e: Event)=> {
      if(menuRef.current && !menuRef.current.contains(e.target as Node)){
        setMobileMenuOpen(false)
      }
    }
    if(mobileMenuOpen){
      document.addEventListener('mousedown', handler)
      document.addEventListener('touchstart', handler)
    }
    return ()=>{ document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler) }
  },[mobileMenuOpen])

  return (
  <main className="relative min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans overflow-hidden">
  <ScriptShortcuts
    isFullscreen={isFullscreen}
    setFullscreen={animatedSetFullscreen}
    openFsSearch={()=>setFsSearchOpen(true)}
    toggleAlarm={()=>update('alarmEnabled', !preferences.alarmEnabled)}
    alarmEnabled={!!preferences.alarmEnabled}
    showSelector={preferences.showSelector}
  />
  {showLoader && <Preloader minDurationMs={2600} onDone={()=>setShowLoader(false)} />}
  {/* Ambient only renders while in fullscreen and toggle enabled */}
  {preferences.fullscreen && preferences.bgAnimation && <AmbientBackground />}
  <AlarmOverlay />
  <motion.div
    key="fs-container"
    animate={fsTransition==='enter' ? {scale:[0.97,1]} : fsTransition==='exit' ? {scale:[1,0.97]} : {scale:1}}
    transition={{duration:0.5, ease:[0.4,0,0.2,1]}}
    style={{transformOrigin:'50% 50%', pointerEvents: fsAnimating ? 'none':'auto'}}
    className="will-change-transform"
  >
      <div className="fixed right-3 z-[120]" style={{top:'calc(env(safe-area-inset-top,0px) + 0.75rem)'}} ref={menuRef}>
        {/* Desktop / larger screens toolbar */}
        <div className="hidden sm:flex gap-2 items-center">
          <SettingsPanel />
          <ThemeToggle />
          {/* Ambient toggle shows only in fullscreen (as per requirement) */}
          {isFullscreen && <AmbientToggle />}
          {!isFullscreen && <FullscreenToggle isFullscreen={isFullscreen} setIsFullscreen={animatedSetFullscreen} />}
          {isFullscreen && (
            <>
              {preferences.showSelector && (
                <button
                  onClick={()=>setFsSearchOpen(true)}
                  aria-label="Search timezones"
                  className="p-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900/70 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors relative"
                  style={{touchAction:'manipulation'}}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none"><circle cx="11" cy="11" r="7" strokeWidth="2"/><path strokeWidth="2" strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                </button>
              )}
              <button onClick={()=>{animatedSetFullscreen(false); setFsSearchOpen(false)}} className="p-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900/70 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors relative" aria-label="Exit Fullscreen" style={{touchAction:'manipulation'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </>
          )}
        </div>
        {/* Mobile hamburger */}
        <div className="sm:hidden flex items-center">
          <motion.button
            onClick={()=>setMobileMenuOpen(o=>!o)}
            aria-label={mobileMenuOpen? 'Close menu':'Menu'}
            className="p-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-900/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors relative flex items-center justify-center"
            style={{touchAction:'manipulation', WebkitTapHighlightColor:'transparent'}}
            whileTap={{scale:0.9}}
          >
            <div className="w-5 h-5 relative" aria-hidden>
              <motion.span className="absolute left-0 right-0 h-0.5 bg-current rounded" style={{top:4}} animate={mobileMenuOpen?{top:'50%', rotate:45}:{top:4, rotate:0}} transition={{duration:.18}} />
              <motion.span className="absolute left-0 right-0 h-0.5 bg-current rounded" style={{top:'50%', transform:'translateY(-50%)'}} animate={mobileMenuOpen?{opacity:0}:{opacity:1}} transition={{duration:.12}} />
              <motion.span className="absolute left-0 right-0 h-0.5 bg-current rounded" style={{bottom:4}} animate={mobileMenuOpen?{bottom:'50%', rotate:-45}:{bottom:4, rotate:0}} transition={{duration:.18}} />
            </div>
          </motion.button>
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{opacity:0, y:-10}}
                animate={{opacity:1, y:0}}
                exit={{opacity:0, y:-8}}
                transition={{duration:.18, ease:'easeOut'}}
                className="absolute right-0 mt-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl shadow-xl px-3 py-3 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Menu</span>
                  <button aria-label="Close menu" onClick={()=>setMobileMenuOpen(false)} className="p-2 rounded-md hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="flex gap-2">
                    <SettingsPanel />
                    <ThemeToggle />
                    {isFullscreen && <AmbientToggle />}
                    {!isFullscreen && <FullscreenToggle isFullscreen={isFullscreen} setIsFullscreen={animatedSetFullscreen} />}
                    {isFullscreen && preferences.showSelector && (
                      <button
                        onClick={()=>{setFsSearchOpen(true); setMobileMenuOpen(false)}}
                        aria-label="Search timezones"
                        className="p-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900/70 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none"><circle cx="11" cy="11" r="7" strokeWidth="2"/><path strokeWidth="2" strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                      </button>
                    )}
                    {isFullscreen && (
                      <button onClick={()=>{animatedSetFullscreen(false); setMobileMenuOpen(false)}} className="p-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900/70 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center" aria-label="Exit Fullscreen">
                        <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className={`relative z-10 ${isFullscreen ? 'h-screen' : 'min-h-screen'} px-4 pb-24`}>        
        <WorldTimeDisplay isFullscreen={isFullscreen} fsSearchOpen={fsSearchOpen} onCloseSearch={()=>setFsSearchOpen(false)} />
        {preferences.showQuotes && !isFullscreen && <TimeQuotes />}
        {preferences.showQuotes && isFullscreen && (
          <div className="absolute left-0 right-0 bottom-4 md:bottom-6 z-20">
            <TimeQuotes minimal />
          </div>
        )}
      </div>
    {!isFullscreen && (
        <footer className="absolute inset-x-0 bottom-0 z-20 py-4 px-6 text-[11px] md:text-xs text-neutral-500 dark:text-neutral-500 flex items-center justify-center bg-gradient-to-t from-neutral-100/80 dark:from-neutral-900/70 via-neutral-100/40 dark:via-neutral-900/30 to-transparent backdrop-blur-sm border-t border-neutral-200/60 dark:border-neutral-800/60">
          <span className="flex items-center gap-1">
            © 2025 <a href="https://karthiklal.in" target="_blank" rel="noopener noreferrer" className="font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors underline-offset-2 hover:underline">Zonely</a>. All rights reserved.
          </span>
        </footer>
      )}
  </motion.div>
    </main>
  )
}
