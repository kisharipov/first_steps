import { Trophy } from 'lucide-react'
import Modal from '../common/Modal'
import DynamicIcon from '../common/DynamicIcon'
import { useHabits } from '../../context/habitStore'
import { getHabitIcon, COLOR_HEX } from '../../utils/habitStyle'
import { todayISO } from '../../utils/helpers'

export default function JoinChallengeModal({ invite, onClose, onJoined }) {
  const { findOrCreateHabitByName, addChallenge } = useHabits()

  if (!invite) return null
  const Icon = getHabitIcon(invite.icon) || Trophy
  const hex = COLOR_HEX[invite.color] || COLOR_HEX.blue

  function handleJoin() {
    const habit = findOrCreateHabitByName(invite.habitName, invite.kind, invite.icon, invite.color)
    addChallenge({
      name: invite.name,
      habitId: habit.id,
      targetDays: invite.targetDays,
      startDate: todayISO(),
    })
    onJoined()
  }

  return (
    <Modal isOpen={!!invite} onClose={onClose} title="Приглашение в челлендж">
      <div className="flex flex-col items-center text-center gap-3 py-2">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: hex + '22' }}>
          <DynamicIcon icon={Icon} size={30} style={{ color: hex }} />
        </div>
        <p className="font-semibold text-lg text-gray-900">{invite.name}</p>
        <p className="text-sm text-ios-gray">Цель — {invite.targetDays} дней подряд по привычке «{invite.habitName}». Ваш отсчёт начнётся сегодня.</p>
        <button onClick={handleJoin} className="ios-btn-primary w-full mt-2">Присоединиться</button>
        <button onClick={onClose} className="ios-btn-secondary w-full">Не сейчас</button>
      </div>
    </Modal>
  )
}
