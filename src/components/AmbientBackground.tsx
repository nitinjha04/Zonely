"use client"
import { motion, useReducedMotion } from 'framer-motion'

// Unified ambient design: clean, minimal, accent‑aware
// Layers: subtle vignette, accent dual glow, rotating conic sheen, soft moving light, faint pulse ring, grain
export default function AmbientBackground(){
  const reduce = !!useReducedMotion()
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base neutral vignette */}
      <div className="absolute inset-0" style={{background:'radial-gradient(circle at center, rgba(0,0,0,0.45), rgba(0,0,0,0.75))'}} />
      {/* Accent dual glow (very soft) */}
      <div className="absolute inset-0 opacity-30 mix-blend-screen" style={{background:
        'radial-gradient(circle at 32% 38%, var(--accent-from) 0%, transparent 55%),'+
        'radial-gradient(circle at 72% 66%, var(--accent-to) 0%, transparent 60%)'}} />
      {/* Rotating conic sheen */}
      {!reduce && (
        <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay animate-[ambientSpin_90s_linear_infinite]" style={{background:'conic-gradient(from 0deg at 50% 50%, var(--accent-from) 0deg, transparent 90deg, var(--accent-to) 180deg, transparent 270deg, var(--accent-from) 360deg)'}} />
      )}
      {/* Soft moving accent light */}
      {!reduce && (
        <motion.div
          className="absolute w-[520px] h-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-22 blur-3xl mix-blend-screen"
          style={{left:'55%', top:'50%', background:'radial-gradient(circle at 35% 35%, var(--accent-from), transparent 70%)'}}
          animate={{x:[0,-40,25,0], y:[0,30,-20,0]}}
          transition={{duration:48, repeat:Infinity, ease:'linear'}}
        />
      )}
      {/* Pulse ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[640px] h-[640px] opacity-[0.18] [mask-image:radial-gradient(circle_at_center,white_55%,transparent)]">
          <div className="absolute inset-0 rounded-full border border-white/10" />
          {!reduce && <div className="absolute inset-0 rounded-full border border-[var(--accent-from)]/25 animate-[pulseScale_14s_ease-in-out_infinite]" />}
        </div>
      </div>
      {/* Fine grain */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{backgroundImage:'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 0 1px, transparent 1px)', backgroundSize:'24px 24px'}} />
      <style jsx>{`
        @keyframes ambientSpin {from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes pulseScale {0%,100%{transform:scale(1);} 50%{transform:scale(1.04);} }
      `}</style>
    </div>
  )
}