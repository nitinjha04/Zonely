"use client"
import { useEffect, useState } from 'react'

export default function PWAInstall(){
  const [canInstall,setCanInstall]=useState(false)
  const [deferred,setDeferred]=useState<any>(null)
  useEffect(()=>{
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/sw.js').catch(()=>{})
    }
    const handler=(e:Event)=>{
      e.preventDefault()
      // @ts-ignore
      setDeferred(e)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt',handler as any)
    return ()=> window.removeEventListener('beforeinstallprompt',handler as any)
  },[])
  const install=()=>{
    if(!deferred) return
    deferred.prompt()
    deferred.userChoice.finally(()=>{setDeferred(null); setCanInstall(false)})
  }
  if(!canInstall) return null
  return (
    <button onClick={install} className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[600] px-4 py-2 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white shadow-lg shadow-black/30 border border-white/10 backdrop-blur-md">
      Install App
    </button>
  )
}
