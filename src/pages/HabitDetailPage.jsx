import { useState } from 'react'
import { Trophy, RotateCcw, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import DynamicIcon from '../components/common/DynamicIcon'
import MonthCalendar from '../components/habits/MonthCalendar'
import HabitFormModal from '../components/habits/HabitFormModal'
import { useHabits } from '../context/habitStore'
import { currentStreak, longestStreak, totalSuccessDays, totalFailDays, lastRelapseDate } from '../utils/habits'
import { getHabitIcon, COLOR_HEX } from '../utils/habitStyle'
import { formatDateFull } from '../utils/helpers'

function Stat({ label, value }) {
  return (
    <div className="ios-card p-3 flex-1 text-center">
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-[11px] text-ios-gray mt-0.5">{label}</p>
    </div>
  )
}

export default function HabitDetailPage({ habitId, onBack }) {
  const { habits, entries, setEntry, updateHabit, deleteHabit } = useHabits()
  const [editOpen, setEditOpen] = useState(false)
  const habit = habits.find(h => h.id === habitId)

  if (!habit) {
    return (
      <div>
        <PageHeader title="Привычка" onBack={onBack} />
        <p className="text-center text-sm text-ios-gray py-10">Привычка не найдена</p>
      </div>
    )
  }

  const habitEntries = entries[habitId] || {}
  const streak = currentStreak(habitEntries)
  const best = longestStreak(habitEntries)
  const successDays = totalSuccessDays(habitEntries)
  const failDays = totalFailDays(habitEntries)
  const lastFail = lastRelapseDate(habitEntries)
  const Icon = getHabitIcon(habit.icon)
  const hex = COLOR_HEX[habit.color] || COLOR_HEX.blue

  function handleToggleDay(dateStr) {
    const current = habitEntries[dateStr]
    if (current === undefined) setEntry(habitId, dateStr, true)
    else if (current === true) setEntry(habitId, dateStr, false)
    else setEntry(habitId, dateStr, null)
  }

  function handleDelete() {
    if (window.confirm(`Удалить привычку «${habit.name}» и всю историю?`)) {
      deleteHabit(habitId)
      onBack()
    }
  }

  return (
    <div className="pb-10">
      <PageHeader title={habit.name} onBack={onBack} action={
        <div className="flex gap-1">
          <button onClick={() => setEditOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-ios-gray5 active:opacity-60">
            <Pencil size={14} className="text-ios-gray" />
          </button>
          <button onClick={handleDelete} className="w-8 h-8 flex items-center justify-center rounded-full bg-ios-gray5 active:opacity-60">
            <Trash2 size={14} className="text-ios-red" />
          </button>
        </div>
      } />

      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: hex + '22' }}>
            <DynamicIcon icon={Icon} size={26} style={{ color: hex }} />
          </div>
          <div>
            <p className="font-semibold text-lg text-gray-900">{habit.name}</p>
            <p className="text-xs text-ios-gray">{habit.kind === 'avoid' ? 'Отказ / воздержание' : 'Регулярное действие'} · с {formatDateFull(habit.createdAt)}</p>
          </div>
        </div>

        <div className="flex gap-2.5 mb-4">
          <Stat label="Серия сейчас" value={streak} />
          <Stat label="Рекорд" value={best} />
          <Stat label="Всего дней" value={successDays} />
        </div>

        {habit.kind === 'avoid' && (
          <div className="ios-card p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-ios-gray">
              <RotateCcw size={14} className="text-ios-red" />
              <span>Срывов: {failDays}{lastFail ? ` · последний ${formatDateFull(lastFail)}` : ''}</span>
            </div>
          </div>
        )}

        {streak > 0 && streak % 7 === 0 && (
          <div className="ios-card p-3 mb-4 flex items-center gap-2 bg-ios-yellow/10">
            <Trophy size={16} className="text-ios-yellow" />
            <span className="text-sm font-medium text-gray-800">Отличная серия — {streak} дней подряд!</span>
          </div>
        )}

        <MonthCalendar entries={habitEntries} color={habit.color} onToggleDay={handleToggleDay} />
      </div>

      {editOpen && <HabitFormModal onClose={() => setEditOpen(false)} initial={habit} onSubmit={(data) => updateHabit(habitId, data)} />}
    </div>
  )
}
