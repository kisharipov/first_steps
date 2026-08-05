import { useState } from 'react'
import Modal from '../common/Modal'
import { useHabits } from '../../context/habitStore'
import { CHALLENGE_PRESETS } from '../../utils/habits'
import { todayISO } from '../../utils/helpers'

export default function ChallengeFormModal({ onClose }) {
  const { habits, addChallenge } = useHabits()
  const activeHabits = habits.filter(h => !h.archived)
  const [habitId, setHabitId] = useState(() => activeHabits[0]?.id || '')
  const [targetDays, setTargetDays] = useState(50)
  const [name, setName] = useState('')

  const habit = activeHabits.find(h => h.id === habitId)
  const defaultName = habit ? `${targetDays} дней: ${habit.name}` : ''

  function handleSubmit(e) {
    e.preventDefault()
    if (!habitId) return
    addChallenge({
      name: name.trim() || defaultName,
      habitId,
      targetDays: Number(targetDays),
      startDate: todayISO(),
    })
    onClose()
  }

  if (!activeHabits.length) {
    return (
      <Modal isOpen onClose={onClose} title="Новый челлендж">
        <p className="text-sm text-ios-gray text-center py-6">Сначала добавьте хотя бы одну привычку на вкладке «Привычки».</p>
      </Modal>
    )
  }

  return (
    <Modal isOpen onClose={onClose} title="Новый челлендж">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="ios-section-title">Привычка</label>
          <select
            className="ios-input"
            value={habitId}
            onChange={(e) => setHabitId(e.target.value)}
          >
            {activeHabits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>

        <div>
          <label className="ios-section-title">Длительность</label>
          <div className="flex gap-2 flex-wrap">
            {CHALLENGE_PRESETS.map(d => (
              <button
                type="button"
                key={d}
                onClick={() => setTargetDays(d)}
                className={`px-3 py-2 rounded-ios text-sm font-medium ${Number(targetDays) === d ? 'bg-ios-blue text-white' : 'bg-white text-gray-700'}`}
              >
                {d} дн.
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            className="ios-input mt-2"
            value={targetDays}
            onChange={(e) => setTargetDays(e.target.value)}
          />
        </div>

        <div>
          <label className="ios-section-title">Название челленджа</label>
          <input className="ios-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={defaultName} />
        </div>

        <button type="submit" className="ios-btn-primary mt-2">Создать челлендж</button>
      </form>
    </Modal>
  )
}
