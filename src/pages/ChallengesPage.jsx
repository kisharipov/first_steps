import { useState } from 'react'
import { Plus, Trophy, Link2 } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'
import ChallengeCard from '../components/challenges/ChallengeCard'
import ChallengeFormModal from '../components/challenges/ChallengeFormModal'
import ShareChallengeModal from '../components/challenges/ShareChallengeModal'
import Modal from '../components/common/Modal'
import { useHabits } from '../context/habitStore'
import { decodeShare } from '../utils/habits'

export default function ChallengesPage({ onOpenInvite }) {
  const { challenges } = useHabits()
  const [formOpen, setFormOpen] = useState(false)
  const [shareChallenge, setShareChallenge] = useState(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteValue, setPasteValue] = useState('')
  const [pasteError, setPasteError] = useState('')

  function handlePasteJoin() {
    setPasteError('')
    try {
      const url = new URL(pasteValue.trim())
      const hash = url.hash.replace('#', '')
      const params = new URLSearchParams(hash)
      const code = params.get('join')
      const invite = code ? decodeShare(code) : null
      if (!invite || !invite.habitName) throw new Error('bad')
      onOpenInvite(invite)
      setPasteOpen(false)
      setPasteValue('')
    } catch {
      setPasteError('Не удалось распознать ссылку. Проверьте, что она скопирована полностью.')
    }
  }

  return (
    <div className="pb-24">
      <PageHeader
        title="Челленджи"
        action={
          <button onClick={() => setFormOpen(true)} className="w-8 h-8 rounded-full bg-ios-blue text-white flex items-center justify-center active:opacity-70">
            <Plus size={16} />
          </button>
        }
      />

      <div className="px-4 pt-4">
        {challenges.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Нет активных челленджей"
            description="Создайте челлендж на 50 или 100 дней и позовите друзей — каждый будет отмечать свой прогресс"
            action={<button onClick={() => setFormOpen(true)} className="ios-btn-primary">Создать челлендж</button>}
          />
        ) : (
          <div className="flex flex-col gap-2.5 mb-4">
            {challenges.slice().reverse().map(c => (
              <ChallengeCard key={c.id} challenge={c} onShare={setShareChallenge} />
            ))}
          </div>
        )}

        <button onClick={() => setPasteOpen(true)} className="w-full flex items-center justify-center gap-2 text-sm font-medium text-ios-blue py-3">
          <Link2 size={15} /> Присоединиться по ссылке
        </button>
      </div>

      {formOpen && <ChallengeFormModal onClose={() => setFormOpen(false)} />}
      <ShareChallengeModal isOpen={!!shareChallenge} onClose={() => setShareChallenge(null)} challenge={shareChallenge} />

      <Modal isOpen={pasteOpen} onClose={() => setPasteOpen(false)} title="Присоединиться по ссылке">
        <div className="flex flex-col gap-3">
          <textarea
            className="ios-input min-h-[90px]"
            placeholder="Вставьте ссылку-приглашение от друга"
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
          />
          {pasteError && <p className="text-xs text-ios-red">{pasteError}</p>}
          <button onClick={handlePasteJoin} className="ios-btn-primary">Продолжить</button>
        </div>
      </Modal>
    </div>
  )
}
