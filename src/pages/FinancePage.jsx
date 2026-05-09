import { useState, useMemo } from 'react'
import { Plus, TrendingUp, DollarSign, Users, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'
import PaymentFormModal from '../components/students/PaymentFormModal'
import { formatMoney, formatDate, todayISO } from '../utils/helpers'

export default function FinancePage({ onNavigate }) {
  const { students, payments, lessons, getStudentBalance, deletePayment } = useApp()
  const [showPayForm, setShowPayForm] = useState(false)
  const [payStudentId, setPayStudentId] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')

  const thisMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 7)
  })()

  const totalRevenue   = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const monthRevenue   = payments.filter(p => p.date.startsWith(thisMonth)).reduce((s, p) => s + (p.amount || 0), 0)
  const lastMonthRev   = payments.filter(p => p.date.startsWith(lastMonth)).reduce((s, p) => s + (p.amount || 0), 0)
  const totalLessons   = lessons.filter(l => l.status === 'completed').length
  const upcomingLessons = lessons.filter(l => l.status === 'scheduled').length

  const sortedPayments = [...payments].sort((a, b) => b.date.localeCompare(a.date))

  const studentSummaries = useMemo(() => students.map(s => {
    const { remaining, totalPaid, consumed } = getStudentBalance(s.id)
    const earned = payments.filter(p => p.studentId === s.id).reduce((sum, p) => sum + (p.amount || 0), 0)
    const completed = lessons.filter(l => l.studentId === s.id && l.status === 'completed').length
    return { student: s, remaining, totalPaid, consumed, earned, completed }
  }).sort((a, b) => b.earned - a.earned), [students, payments, lessons, getStudentBalance])

  function openPayment(studentId) {
    setPayStudentId(studentId)
    setShowPayForm(true)
  }

  return (
    <div className="pb-24">
      <header className="bg-white/90 backdrop-blur sticky top-0 z-40 border-b border-ios-gray5">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Финансы</h1>
          <button
            onClick={() => { setPayStudentId(students[0]?.id || null); setShowPayForm(true) }}
            className="w-9 h-9 bg-ios-blue rounded-full flex items-center justify-center shadow-ios active:opacity-70"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-5">
        {/* Top stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="ios-card p-4 col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-ios-green/15 flex items-center justify-center">
                <TrendingUp size={22} className="text-ios-green" />
              </div>
              <div>
                <p className="text-xs text-ios-gray">Общий доход</p>
                <p className="text-3xl font-bold text-ios-green">{formatMoney(totalRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="ios-card p-3 text-center">
            <p className="text-2xl font-bold text-ios-blue">{formatMoney(monthRevenue)}</p>
            <p className="text-[11px] text-ios-gray mt-0.5">Этот месяц</p>
            {lastMonthRev > 0 && (
              <p className="text-[10px] text-ios-gray2 mt-0.5">пред: {formatMoney(lastMonthRev)}</p>
            )}
          </div>
          <div className="ios-card p-3 text-center">
            <p className="text-2xl font-bold text-ios-orange">{totalLessons}</p>
            <p className="text-[11px] text-ios-gray mt-0.5">Проведено уроков</p>
            <p className="text-[10px] text-ios-gray2 mt-0.5">{upcomingLessons} предстоит</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-ios-gray5 p-1 rounded-ios">
          {[['summary', 'По ученикам'], ['history', 'История']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-1.5 rounded-[8px] text-sm font-medium transition-all ${
                activeTab === id ? 'bg-white text-gray-900 shadow-ios' : 'text-ios-gray'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Summary tab */}
        {activeTab === 'summary' && (
          <div>
            <p className="text-xs font-semibold text-ios-gray uppercase tracking-wide mb-2">Ученики</p>
            {studentSummaries.length === 0 ? (
              <EmptyState icon={Users} title="Нет учеников" description="Добавьте учеников в разделе «Ученики»" />
            ) : (
              <div className="ios-card overflow-hidden">
                {studentSummaries.map((item, i) => {
                  const { student, remaining, earned, completed } = item
                  const warn = remaining <= 2
                  return (
                    <div key={student.id} className={`px-4 py-3 ${i > 0 ? 'border-t border-ios-gray5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} colorIndex={student.colorIndex} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{student.name}</p>
                          <p className="text-xs text-ios-gray">{student.subject}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-ios-green">{formatMoney(earned)}</p>
                          <p className="text-xs text-ios-gray">{completed} ур.</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pl-10">
                        <Badge
                          label={remaining <= 0 ? 'Нет уроков' : `Остаток: ${remaining} ур.`}
                          variant={remaining <= 0 ? 'red' : warn ? 'orange' : 'green'}
                        />
                        <button
                          onClick={() => openPayment(student.id)}
                          className="text-ios-blue text-xs font-medium active:opacity-60"
                        >
                          + Оплата
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div>
            <p className="text-xs font-semibold text-ios-gray uppercase tracking-wide mb-2">
              История платежей ({sortedPayments.length})
            </p>
            {sortedPayments.length === 0 ? (
              <EmptyState icon={DollarSign} title="Нет платежей" description="Записи оплат появятся здесь" />
            ) : (
              <div className="ios-card overflow-hidden">
                {sortedPayments.map((payment, i) => {
                  const student = students.find(s => s.id === payment.studentId)
                  return (
                    <div key={payment.id} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-ios-gray5' : ''}`}>
                      {student && <Avatar name={student.name} colorIndex={student.colorIndex} size="sm" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{student?.name || 'Неизвестно'}</p>
                        <p className="text-xs text-ios-gray">{formatDate(payment.date)} · {payment.lessonsCount} ур.</p>
                        {payment.note && <p className="text-xs text-ios-gray italic">{payment.note}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-ios-green">{formatMoney(payment.amount)}</span>
                        <button
                          onClick={() => { if (confirm('Удалить платёж?')) deletePayment(payment.id) }}
                          className="text-ios-gray3 active:text-ios-red"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <PaymentFormModal
        isOpen={showPayForm}
        onClose={() => setShowPayForm(false)}
        studentId={payStudentId}
      />
    </div>
  )
}
