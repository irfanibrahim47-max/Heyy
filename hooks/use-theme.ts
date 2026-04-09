import { useState, useEffect } from 'react'

export interface Theme {
  bg: string
  card: string
  cardBorder: string
  text: string
  sub: string
  muted: string
  input: string
  inputBorder: string
  headerBg: string
  borderLight: string
  accent: string
  error: string
  success: string
  elevated: string
  navBg: string
  shadow: string
  warning: string
  pill: string
  pillText: string
}

const lightTheme: Theme = {
  bg: '#FFFFFF',
  card: '#F8FAFC',
  cardBorder: '#E2E8F0',
  text: '#0F172A',
  sub: '#475569',
  muted: '#94A3B8',
  input: '#F1F5F9',
  inputBorder: '#CBD5E1',
  headerBg: 'rgba(255, 255, 255, 0.8)',
  borderLight: '#E2E8F0',
  accent: '#3B82F6',
  error: '#EF4444',
  success: '#10B981',
  elevated: '#F1F5F9',
  navBg: 'rgba(255, 255, 255, 0.8)',
  shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  warning: '#F59E0B',
  pill: '#EFF6FF',
  pillText: '#3B82F6',
}

const darkTheme: Theme = {
  bg: '#080F1E',
  card: '#0F1629',
  cardBorder: '#1E293B',
  text: '#F1F5F9',
  sub: '#94A3B8',
  muted: '#64748B',
  input: '#1E293B',
  inputBorder: '#334155',
  headerBg: 'rgba(8, 15, 30, 0.8)',
  borderLight: '#1E293B',
  accent: '#3B82F6',
  error: '#EF4444',
  success: '#22C55E',
  elevated: '#1E293B',
  navBg: 'rgba(8, 15, 30, 0.8)',
  shadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  warning: '#FBBF24',
  pill: '#1E3A8A',
  pillText: '#93C5FD',
}

export function useTheme() {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('heyy_theme')
    if (stored) {
      setIsDark(stored === 'dark')
    }
    setMounted(true)
  }, [])

  const theme = isDark ? darkTheme : lightTheme

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('heyy_theme', newTheme ? 'dark' : 'light')
  }

  return { theme, isDark, toggleTheme, mounted }
}
