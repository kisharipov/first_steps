import { useState, useMemo } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'
import Modal from '../common/Modal'
import { useHabits } from '../../context/habitStore'
import { encodeShare } from '../../utils/habits'

export default function ShareChallengeModal({ isOpen, onClose, challenge }) {
  const { habits } = useHabits()
  const [copied, setCopied] = useState(false)
  const habit = challenge ? habits.find(h => h.id === challenge.habitId) : null

  const link = useMemo(() => {
    if (!challenge || !habit) return ''
    const code = encodeShare({
      v: 1,
      name: challenge.name,
      habitName: habit.name,
      kind: habit.kind,
      icon: habit.icon,
      color: habit.color,
      targetDays: challenge.targetDays,
    })
    return `${window.location.origin}${window.location.pathname}#join=${code}`
  }, [challenge, habit])

  const shareText = challenge ? `Присоединяйся к челленджу «${challenge.name}» на ${challenge.targetDays} дней! Отмечаем прогресс вместе:` : ''

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: challenge.name, text: shareText, url: link })
      } catch {
        // user cancelled the native share sheet
      }
    } else {
      handleCopy()
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${link}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard permission denied, nothing more we can do
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Пригласить друга">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ios-gray">
          Отправьте ссылку другу — он сможет запустить у себя такой же челлендж и отмечать свой прогресс параллельно с вами.
        </p>
        <div className="bg-white rounded-ios px-3 py-3 text-xs text-ios-gray break-all border border-ios-gray5">
          {link}
        </div>
        <button onClick={handleShare} className="ios-btn-primary flex items-center justify-center gap-2">
          <Share2 size={16} /> Поделиться
        </button>
        <button onClick={handleCopy} className="ios-btn-secondary flex items-center justify-center gap-2">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Скопировано' : 'Скопировать ссылку'}
        </button>
        <p className="text-[11px] text-ios-gray text-center">
          Каждый участник ведёт свой прогресс отдельно — это офлайн-приложение без общего сервера.
        </p>
      </div>
    </Modal>
  )
}
