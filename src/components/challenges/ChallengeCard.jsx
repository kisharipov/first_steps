import { Trophy, Share2, RotateCcw, Trash2, Lock } from 'lucide-react'
import DynamicIcon from '../common/DynamicIcon'
import { useHabits } from '../../context/habitStore'
import { challengeProgress, challengeStatus } from '../../utils/habits'
import { formatDateFull } from '../../utils/helpers'
import { COLOR_HEX, getHabitIcon } from '../../utils/habitStyle'

export default function ChallengeCard({ challenge, onShare }) {
  const { habits, entries, restartChallenge, deleteChallenge, privacyMode } = useHabits()
  const habit = habits.find(h => h.id === challenge.habitId)
  const habitEntries = entries[challenge.habitId] || {}
  const progress = challengeProgress(habitEntries, challenge.startDate)
  const status = challengeStatus(habitEntries, challenge.startDate, challenge.targetDays)
  const pct = Math.min(100, Math.round((progress / challenge.targetDays) * 100))
  const hex = COLOR_HEX[habit?.color] || COLOR_HEX.blue
  const Icon = privacyMode ? Lock : (habit ? getHabitIcon(habit.icon) : Trophy)
  const displayName = privacyMode ? `Челлендж на ${challenge.targetDays} дн.` : challenge.name

  return (
    <div className="ios-card p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: hex + '22' }}>
          <DynamicIcon icon={Icon} size={22} style={{ color: hex }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{displayName}</p>
          <p className="text-xs text-ios-gray">С {formatDateFull(challenge.startDate)} · цель {challenge.targetDays} дн.</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onShare(challenge)} className="w-8 h-8 flex items-center justify-center rounded-full bg-ios-gray5 active:opacity-60">
            <Share2 size={14} className="text-ios-blue" />
          </button>
          <button onClick={() => { if (window.confirm('Удалить челлендж?')) deleteChallenge(challenge.id) }} className="w-8 h-8 flex items-center justify-center rounded-full bg-ios-gray5 active:opacity-60">
            <Trash2 size={14} className="text-ios-red" />
          </button>
        </div>
      </div>

      <div className="w-full h-2 bg-ios-gray5 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: status === 'failed' ? '#FF3B30' : hex }} />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-ios-gray">{progress} / {challenge.targetDays} дней</span>
        {status === 'completed' && <span className="font-semibold text-ios-green">🏆 Завершён!</span>}
        {status === 'failed' && (
          <button onClick={() => restartChallenge(challenge.id)} className="flex items-center gap-1 font-semibold text-ios-red">
            <RotateCcw size={12} /> Начать заново
          </button>
        )}
        {status === 'active' && <span className="font-semibold text-ios-blue">В процессе</span>}
      </div>
    </div>
  )
}
