import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/common/BottomNav'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import StudentDetailPage from './pages/StudentDetailPage'
import SchedulePage from './pages/SchedulePage'
import FinancePage from './pages/FinancePage'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [detail, setDetail] = useState(null) // { type: 'studentDetail', id }

  function navigate(target, id) {
    if (target === 'studentDetail') {
      setDetail({ type: 'studentDetail', id })
    } else {
      setDetail(null)
      setTab(target)
    }
  }

  function handleTabChange(newTab) {
    setDetail(null)
    setTab(newTab)
  }

  return (
    <AppProvider>
      <div className="min-h-dvh bg-ios-gray6 font-sans">
        {detail?.type === 'studentDetail' ? (
          <div className="page-enter">
            <StudentDetailPage studentId={detail.id} onBack={() => setDetail(null)} />
          </div>
        ) : (
          <>
            {tab === 'dashboard' && <DashboardPage onNavigate={navigate} />}
            {tab === 'students'  && <StudentsPage  onNavigate={navigate} />}
            {tab === 'schedule'  && <SchedulePage  onNavigate={navigate} />}
            {tab === 'finance'   && <FinancePage   onNavigate={navigate} />}
          </>
        )}
        <BottomNav active={detail ? null : tab} onNavigate={handleTabChange} />
      </div>
    </AppProvider>
  )
}
