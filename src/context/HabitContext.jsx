import { useState, useEffect, useCallback } from 'react'
import { HabitContext } from './habitStore'
import { generateId, todayISO } from '../utils/helpers'

function loadFromStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch {
    // corrupted or inaccessible storage, fall back to default
    return fallback
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable, changes just won't persist
  }
}

function defaultHabits() {
  return [
    { id: generateId(), name: 'Без ПАВ (снюс)', icon: 'Ban', color: 'orange', kind: 'avoid', archived: false, createdAt: todayISO() },
    { id: generateId(), name: 'Воздержание', icon: 'ShieldCheck', color: 'purple', kind: 'avoid', archived: false, createdAt: todayISO() },
    { id: generateId(), name: 'Спортзал', icon: 'Dumbbell', color: 'green', kind: 'do', archived: false, createdAt: todayISO() },
    { id: generateId(), name: 'Чтение', icon: 'BookOpen', color: 'blue', kind: 'do', archived: false, createdAt: todayISO() },
  ]
}

export function HabitProvider({ children }) {
  const [habits, setHabits] = useState(() => {
    const stored = loadFromStorage('habits', null)
    return stored !== null ? stored : defaultHabits()
  })
  const [entries, setEntries] = useState(() => loadFromStorage('entries', {})) // { [habitId]: { [date]: true|false } }
  const [challenges, setChallenges] = useState(() => loadFromStorage('challenges', []))
  const [privacyMode, setPrivacyMode] = useState(() => loadFromStorage('privacyMode', false))

  useEffect(() => { saveToStorage('habits', habits) }, [habits])
  useEffect(() => { saveToStorage('entries', entries) }, [entries])
  useEffect(() => { saveToStorage('challenges', challenges) }, [challenges])
  useEffect(() => { saveToStorage('privacyMode', privacyMode) }, [privacyMode])

  // ─── Habits ──────────────────────────────────────────────────
  const addHabit = useCallback((data) => {
    const habit = { ...data, id: generateId(), archived: false, createdAt: todayISO() }
    setHabits(prev => [...prev, habit])
    return habit
  }, [])

  const updateHabit = useCallback((id, data) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...data } : h))
  }, [])

  const archiveHabit = useCallback((id, archived = true) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, archived } : h))
  }, [])

  const deleteHabit = useCallback((id) => {
    setHabits(prev => prev.filter(h => h.id !== id))
    setEntries(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setChallenges(prev => prev.filter(c => c.habitId !== id))
  }, [])

  const findOrCreateHabitByName = useCallback((name, kind, icon, color) => {
    let found = null
    setHabits(prev => {
      found = prev.find(h => h.name === name && h.kind === kind)
      if (found) return prev
      const habit = { id: generateId(), name, kind, icon, color, archived: false, createdAt: todayISO() }
      found = habit
      return [...prev, habit]
    })
    return found
  }, [])

  // ─── Entries ─────────────────────────────────────────────────
  const setEntry = useCallback((habitId, date, value) => {
    setEntries(prev => {
      const habitEntries = { ...(prev[habitId] || {}) }
      if (value === null) {
        delete habitEntries[date]
      } else {
        habitEntries[date] = value
      }
      return { ...prev, [habitId]: habitEntries }
    })
  }, [])

  const toggleToday = useCallback((habitId) => {
    const today = todayISO()
    setEntries(prev => {
      const habitEntries = { ...(prev[habitId] || {}) }
      if (habitEntries[today] === true) {
        delete habitEntries[today]
      } else {
        habitEntries[today] = true
      }
      return { ...prev, [habitId]: habitEntries }
    })
  }, [])

  const markRelapse = useCallback((habitId, date = todayISO()) => {
    setEntry(habitId, date, false)
  }, [setEntry])

  // ─── Challenges ──────────────────────────────────────────────
  const addChallenge = useCallback((data) => {
    const challenge = { ...data, id: generateId(), createdAt: todayISO() }
    setChallenges(prev => [...prev, challenge])
    return challenge
  }, [])

  const deleteChallenge = useCallback((id) => {
    setChallenges(prev => prev.filter(c => c.id !== id))
  }, [])

  const restartChallenge = useCallback((id) => {
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, startDate: todayISO() } : c))
  }, [])

  // ─── Backup ──────────────────────────────────────────────────
  const exportData = useCallback(() => {
    return JSON.stringify({ habits, entries, challenges, exportedAt: todayISO() }, null, 2)
  }, [habits, entries, challenges])

  const importData = useCallback((json) => {
    const data = JSON.parse(json)
    if (data.habits) setHabits(data.habits)
    if (data.entries) setEntries(data.entries)
    if (data.challenges) setChallenges(data.challenges)
  }, [])

  const resetAll = useCallback(() => {
    setHabits(defaultHabits())
    setEntries({})
    setChallenges([])
  }, [])

  const value = {
    habits, entries, challenges, privacyMode,
    setPrivacyMode,
    addHabit, updateHabit, archiveHabit, deleteHabit, findOrCreateHabitByName,
    setEntry, toggleToday, markRelapse,
    addChallenge, deleteChallenge, restartChallenge,
    exportData, importData, resetAll,
  }

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>
}
