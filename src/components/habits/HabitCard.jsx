import { Flame, Check, RotateCcw, Lock } from 'lucide-react'
import DynamicIcon from '../common/DynamicIcon'
import { getHabitIcon, COLOR_HEX } from '../../utils/habitStyle'
import { currentStreak } from '../../utils/habits'
import { useHabits } from '../../context/habitStore'
import { todayISO } from '../../utils/helpers'

export default function HabitCard({ habit, onOpen, maskedLabel }) {
  const { entries, toggleToday, markRelapse, privacyMode } = useHabits()
  const habitEntries = entries[habit.id] || {}
  const streak = currentStreak(habitEntries)
  const doneToday = habitEntries[todayISO()] === true
  const Icon = privacyMode ? Lock : getHabitIcon(habit.icon)
  const hex = COLOR_HEX[habit.color] || COLOR_HEX.blue
  const displayName = privacyMode ? maskedLabel : habit.name

  function handleRelapse(e) {
    e.stopPropagation()
    if (window.confirm('Отметить срыв? Текущая серия обнулится.')) {
      markRelapse(habit.id)
    }
  }

  return (
    <div className="ios-card p-4 flex items-center gap-3" onClick={() => onOpen(habit)}>
      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: hex + '22' }}>
        <DynamicIcon icon={Icon} size={22} style={{ color: hex }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{displayName}</p>
        <div className="flex items-center gap-1 text-xs text-ios-gray mt-0.5">
          <Flame size={13} className={streak > 0 ? 'text-ios-orange' : 'text-ios-gray2'} />
          <span>{streak > 0 ? `${streak} дн. подряд` : 'нет серии'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        {habit.kind === 'avoid' && !doneToday && (
          <button onClick={handleRelapse} className="w-9 h-9 rounded-full bg-ios-gray5 flex items-center justify-center active:opacity-60">
            <RotateCcw size={16} className="text-ios-red" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); toggleToday(habit.id) }}
          className={`w-11 h-11 rounded-full flex items-center justify-center active:opacity-70 transition-colors ${doneToday ? 'bg-ios-green text-white' : 'bg-ios-gray5 text-ios-gray2'}`}
        >
          <Check size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
