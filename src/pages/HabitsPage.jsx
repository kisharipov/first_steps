import { useState } from 'react'
import { Plus, Flame, Archive, ArchiveRestore, ChevronRight, Lock } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'
import DynamicIcon from '../components/common/DynamicIcon'
import HabitFormModal from '../components/habits/HabitFormModal'
import { useHabits } from '../context/habitStore'
import { currentStreak, longestStreak } from '../utils/habits'
import { getHabitIcon, COLOR_HEX } from '../utils/habitStyle'

function HabitRow({ habit, onOpen, onToggleArchive, masked, label }) {
  const { entries } = useHabits()
  const habitEntries = entries[habit.id] || {}
  const streak = currentStreak(habitEntries)
  const best = longestStreak(habitEntries)
  const Icon = masked ? Lock : getHabitIcon(habit.icon)
  const hex = COLOR_HEX[habit.color] || COLOR_HEX.blue

  return (
    <div className="ios-card p-4 flex items-center gap-3">
      <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => onOpen(habit)}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: hex + '22' }}>
          <DynamicIcon icon={Icon} size={22} style={{ color: hex }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{masked ? label : habit.name}</p>
          <div className="flex items-center gap-1 text-xs text-ios-gray mt-0.5">
            <Flame size={12} className={streak > 0 ? 'text-ios-orange' : 'text-ios-gray2'} />
            <span>{streak} сейчас · рекорд {best}</span>
          </div>
        </div>
        <ChevronRight size={18} className="text-ios-gray2 shrink-0" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleArchive(habit) }}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-ios-gray5 active:opacity-60 shrink-0"
      >
        {habit.archived ? <ArchiveRestore size={14} className="text-ios-gray" /> : <Archive size={14} className="text-ios-gray" />}
      </button>
    </div>
  )
}

export default function HabitsPage({ onNavigate }) {
  const { habits, addHabit, archiveHabit, privacyMode } = useHabits()
  const [formOpen, setFormOpen] = useState(false)

  const active = habits.filter(h => !h.archived)
  const archived = habits.filter(h => h.archived)

  return (
    <div className="pb-24">
      <PageHeader
        title="Привычки"
        action={
          <button onClick={() => setFormOpen(true)} className="w-8 h-8 rounded-full bg-ios-blue text-white flex items-center justify-center active:opacity-70">
            <Plus size={16} />
          </button>
        }
      />

      <div className="px-4 pt-4">
        {habits.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="Пока нет привычек"
            description="Добавьте привычки для отслеживания: воздержание, спорт, чтение и другие"
            action={<button onClick={() => setFormOpen(true)} className="ios-btn-primary">Добавить привычку</button>}
          />
        ) : (
          <>
            <div className="flex flex-col gap-2.5 mb-6">
              {active.map((h, i) => (
                <HabitRow key={h.id} habit={h} onOpen={(habit) => onNavigate('habitDetail', habit.id)} onToggleArchive={(habit) => archiveHabit(habit.id, true)} masked={privacyMode} label={`Привычка ${i + 1}`} />
              ))}
            </div>

            {archived.length > 0 && (
              <>
                <h2 className="ios-section-title !px-0">В архиве</h2>
                <div className="flex flex-col gap-2.5">
                  {archived.map((h, i) => (
                    <HabitRow key={h.id} habit={h} onOpen={(habit) => onNavigate('habitDetail', habit.id)} onToggleArchive={(habit) => archiveHabit(habit.id, false)} masked={privacyMode} label={`Архив ${i + 1}`} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {formOpen && <HabitFormModal onClose={() => setFormOpen(false)} onSubmit={addHabit} />}
    </div>
  )
}
