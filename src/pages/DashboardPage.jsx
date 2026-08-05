import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'
import HabitCard from '../components/habits/HabitCard'
import HabitFormModal from '../components/habits/HabitFormModal'
import ChallengeCard from '../components/challenges/ChallengeCard'
import ShareChallengeModal from '../components/challenges/ShareChallengeModal'
import { useHabits } from '../context/habitStore'
import { formatDateFull, todayISO } from '../utils/helpers'

export default function DashboardPage({ onNavigate }) {
  const { habits, addHabit, challenges } = useHabits()
  const [formOpen, setFormOpen] = useState(false)
  const [shareChallenge, setShareChallenge] = useState(null)

  const activeHabits = habits.filter(h => !h.archived)
  const activeChallenges = challenges.slice(-2).reverse()

  return (
    <div className="pb-24">
      <PageHeader title="Главная" subtitle={formatDateFull(todayISO())} />

      <div className="px-4 pt-4">
        {activeHabits.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Пока нет привычек"
            description="Добавьте первую привычку, чтобы начать отмечать прогресс"
            action={<button onClick={() => setFormOpen(true)} className="ios-btn-primary">Добавить привычку</button>}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="ios-section-title !px-0">Сегодня</h2>
              <button onClick={() => setFormOpen(true)} className="w-7 h-7 rounded-full bg-ios-blue text-white flex items-center justify-center active:opacity-70">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2.5 mb-6">
              {activeHabits.map((h, i) => (
                <HabitCard key={h.id} habit={h} onOpen={(habit) => onNavigate('habitDetail', habit.id)} maskedLabel={`Привычка ${i + 1}`} />
              ))}
            </div>
          </>
        )}

        {activeChallenges.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="ios-section-title !px-0">Активные челленджи</h2>
              <button onClick={() => onNavigate('challenges')} className="text-xs font-medium text-ios-blue">Все</button>
            </div>
            <div className="flex flex-col gap-2.5">
              {activeChallenges.map(c => (
                <ChallengeCard key={c.id} challenge={c} onShare={setShareChallenge} />
              ))}
            </div>
          </>
        )}
      </div>

      {formOpen && <HabitFormModal onClose={() => setFormOpen(false)} onSubmit={addHabit} />}
      <ShareChallengeModal isOpen={!!shareChallenge} onClose={() => setShareChallenge(null)} challenge={shareChallenge} />
    </div>
  )
}
