import { createContext, useContext } from 'react'

export const HabitContext = createContext(null)

export function useHabits() {
  const ctx = useContext(HabitContext)
  if (!ctx) throw new Error('useHabits must be used within HabitProvider')
  return ctx
}
