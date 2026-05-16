'use client'
import { useEffect, useRef, useState } from 'react'

// Fetch accurate UTC time from public API and maintain locally with drift correction.
// Falls back to device time if network fails. Re-syncs periodically.
export function useAccurateUtcTime() {
  const [baseUtcMs, setBaseUtcMs] = useState<number>(() => Date.now())
  const [deviceBaseMs, setDeviceBaseMs] = useState<number>(() => Date.now())
  const [tick, setTick] = useState(0)
  const [ready, setReady] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    function fetchUtc() {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', { signal: ctrl.signal })
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Bad status')))
        .then(data => {
          // worldtimeapi provides either 'unixtime' (seconds) and/or 'datetime'
          let utcMs: number | null = null
          if (typeof data.unixtime === 'number') {
            utcMs = data.unixtime * 1000
          } else if (typeof data.datetime === 'string') {
            utcMs = Date.parse(data.datetime)
          }
          if (utcMs && !Number.isNaN(utcMs)) {
            setBaseUtcMs(utcMs)
            setDeviceBaseMs(Date.now())
            setReady(true)
          }
        })
        .catch(() => {
          // swallow; fallback to device time
          setBaseUtcMs(Date.now())
          setDeviceBaseMs(Date.now())
          setReady(true)
        })
    }
    fetchUtc()
    const resync = setInterval(fetchUtc, 5 * 60 * 1000) // resync every 5 min
    return () => { resync && clearInterval(resync); abortRef.current?.abort() }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setTick(t => (t + 1) % 60), 1000)
    return () => clearInterval(interval)
  }, [])

  const nowMs = baseUtcMs + (Date.now() - deviceBaseMs)
  return { now: new Date(nowMs), ready }
}
