"use client"
import { useEffect, useState } from 'react'
import { usePreferences } from './PreferencesProvider'
import { motion, AnimatePresence } from 'framer-motion'

export default function AlarmOverlay(){
  const { preferences, update } = usePreferences()
  const { alarmEnabled, alarmTime, use24h } = preferences
  const [ringing, setRinging] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement|null>(null)

  // Check every second for alarm match (local time HH:MM)
  useEffect(()=>{
    if(!alarmEnabled || !alarmTime) { setRinging(false); return }
    const tick = ()=>{
      const now = new Date()
      const hh = String(now.getHours()).padStart(2,'0')
      const mm = String(now.getMinutes()).padStart(2,'0')
      if(`${hh}:${mm}` === alarmTime){
        setRinging(true)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return ()=>clearInterval(id)
  },[alarmEnabled, alarmTime])

  // Create / play alarm sound
  useEffect(()=>{
    if(ringing){
      if(!audio){
        const a = new Audio('/alarm.mp3')
        a.loop = true
        setAudio(a)
        a.play().catch(()=>{})
      } else {
        audio.play().catch(()=>{})
      }
    } else {
      audio?.pause()
    }
  },[ringing])

  const stop = ()=>{
    setRinging(false)
    update('alarmEnabled', false)
  }

  return (
    <AnimatePresence>
      {ringing && (
        <motion.div
          key="alarm"
          initial={{opacity:0}}
            animate={{opacity:1}}
            exit={{opacity:0}}
          className="fixed inset-0 z-[500] flex items-center justify-center"
        >
          <span className="sr-only" aria-live="assertive">Alarm ringing. It is {alarmTime ? (use24h ? alarmTime : format12(alarmTime)) : ''}. Press stop to dismiss.</span>
          {/* Pulsing red beams */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-red-900/60 mix-blend-multiply" />
            {[...Array(12)].map((_,i)=> (
              <div key={i} className="absolute left-1/2 top-1/2 w-[140vmax] h-24 -translate-x-1/2 -translate-y-1/2 origin-center animate-[alarmBeam_3s_linear_infinite]" style={{
                background:'linear-gradient(to right, transparent, rgba(255,0,0,0.75), transparent)',
                transform:`translate(-50%,-50%) rotate(${(360/12)*i}deg)`
              }} />
            ))}
            <div className="absolute inset-0 animate-[alarmFlash_1.4s_ease-in-out_infinite] bg-red-600/10" />
          </div>
          <motion.div
            initial={{scale:0.9, opacity:0}}
            animate={{scale:1, opacity:1}}
            exit={{scale:0.9, opacity:0}}
            className="relative z-10 w-[min(480px,90vw)] rounded-2xl bg-neutral-950/80 backdrop-blur-xl border border-red-500/40 p-8 flex flex-col items-center gap-6 shadow-[0_0_40px_-5px_rgba(255,0,0,0.6)]"
          >
            <div className="text-center space-y-2 select-none">
              <motion.h2
                className="text-3xl font-semibold tracking-tight text-red-400"
                initial={{scale:0.9, filter:'drop-shadow(0 0 4px rgba(255,0,0,0.6))'}}
                animate={{
                  scale:[1,1.12,1],
                  rotate:[0,1.5,-1.5,0],
                  textShadow:[
                    '0 0 8px rgba(255,0,0,0.7)',
                    '0 0 24px rgba(255,0,0,1)',
                    '0 0 8px rgba(255,0,0,0.7)'
                  ],
                }}
                transition={{duration:1.8, repeat:Infinity, ease:'easeInOut'}}
              >ALARM</motion.h2>
              <motion.p
                className="text-sm text-red-200/80"
                initial={{opacity:0.8}}
                animate={{opacity:[0.5,1,0.5]}}
                transition={{duration:2.4, repeat:Infinity, ease:'easeInOut'}}
              >It's {alarmTime ? (use24h ? alarmTime : format12(alarmTime)) : ''}. Tap stop to dismiss.</motion.p>
            </div>
            <button onClick={stop} className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 transition text-white font-medium shadow-lg shadow-red-800/40">Stop Alarm</button>
          </motion.div>
          <style jsx>{`
            @keyframes alarmBeam {0%{transform:translate(-50%,-50%) rotate(var(--r,0deg)) translateY(0);} 50%{opacity:.5;} 100%{transform:translate(-50%,-50%) rotate(calc(var(--r,0deg) + 360deg)) translateY(0);} }
            @keyframes alarmFlash {0%,100%{opacity:0;} 50%{opacity:1;} }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function format12(hhmm:string){
  const [h,m] = hhmm.split(':').map(n=>parseInt(n,10))
  const per = h>=12? 'PM':'AM'
  const h12 = ((h%12)||12)
  return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${per}`
}
