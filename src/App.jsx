import { useState } from 'react'
import { HabitProvider } from './context/HabitContext'
import BottomNav from './components/common/BottomNav'
import DashboardPage from './pages/DashboardPage'
import HabitsPage from './pages/HabitsPage'
import HabitDetailPage from './pages/HabitDetailPage'
import ChallengesPage from './pages/ChallengesPage'
import SettingsPage from './pages/SettingsPage'
import JoinChallengeModal from './components/challenges/JoinChallengeModal'
import { decodeShare } from './utils/habits'

function readInviteFromHash() {
  const hash = window.location.hash.replace('#', '')
  if (!hash.startsWith('join=')) return null
  const code = hash.slice('join='.length)
  const invite = decodeShare(code)
  return invite && invite.habitName ? invite : null
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [detailHabitId, setDetailHabitId] = useState(null)
  const [invite, setInvite] = useState(() => readInviteFromHash())

  function navigate(target, id) {
    if (target === 'habitDetail') {
      setDetailHabitId(id)
    } else {
      setDetailHabitId(null)
      setTab(target)
    }
  }

  function handleTabChange(newTab) {
    setDetailHabitId(null)
    setTab(newTab)
  }

  function closeInvite() {
    setInvite(null)
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  function handleJoined() {
    closeInvite()
    setDetailHabitId(null)
    setTab('challenges')
  }

  return (
    <HabitProvider>
      <div className="min-h-dvh bg-ios-gray6 font-sans">
        {detailHabitId ? (
          <div className="page-enter">
            <HabitDetailPage habitId={detailHabitId} onBack={() => setDetailHabitId(null)} />
          </div>
        ) : (
          <>
            {tab === 'dashboard'   && <DashboardPage onNavigate={navigate} />}
            {tab === 'habits'      && <HabitsPage onNavigate={navigate} />}
            {tab === 'challenges'  && <ChallengesPage onOpenInvite={setInvite} />}
            {tab === 'settings'    && <SettingsPage />}
          </>
        )}
        <BottomNav active={detailHabitId ? null : tab} onNavigate={handleTabChange} />
      </div>
      <JoinChallengeModal invite={invite} onClose={closeInvite} onJoined={handleJoined} />
    </HabitProvider>
  )
}
