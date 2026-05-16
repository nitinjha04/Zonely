import { ReactNode } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

export interface TimeZone {
  name: string
  timezone: string
  abbreviation: string
  flag: string
  offset: string
}

export interface WorldTimeDisplayProps {
  isFullscreen: boolean
}

export interface FullscreenToggleProps {
  isFullscreen: boolean
  setIsFullscreen: (value: boolean) => void
}

export interface ThemeContextType {
  theme: 'dark' | 'light'
  toggleTheme: () => void
}

export interface ThemeProviderProps {
  children: ReactNode
}
