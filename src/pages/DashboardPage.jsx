import { useState } from 'react'
import { Plus, AlertTriangle, Clock, CheckCircle2, BookOpen } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDate, formatDateShort, formatMoney, todayISO } from '../utils/helpers'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import LessonFormModal from '../components/lessons/LessonFormModal'

export default function DashboardPage({ onNavigate }) {
  const { students, lessons, payments, homework, getStudentBalance } = useApp()
  const [showAddLesson, setShowAddLesson] = useState(false)

  const today = todayISO()

  const todayLessons = lessons
    .filter(l => l.scheduledDate === today || l.actualDate === today)
    .sort((a, b) => (a.actualTime || a.scheduledTime).localeCompare(b.actualTime || b.scheduledTime))

  const upcomingLessons = lessons
    .filter(l => l.status === 'scheduled' && l.scheduledDate > today)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.scheduledTime.localeCompare(b.scheduledTime))
    .slice(0, 5)

  const warningStudents = students.filter(s => {
    const { remaining } = getStudentBalance(s.id)
    return remaining <= 2 && remaining >= 0
  })

  const pendingHomework = homework.filter(h => h.status === 'pending').slice(0, 3)

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthRevenue = payments
    .filter(p => p.date.startsWith(thisMonth))
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur sticky top-0 z-40 border-b border-ios-gray5">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Главная</h1>
            <p className="text-xs text-ios-gray">{formatDate(today)}</p>
          </div>
          <button
            onClick={() => setShowAddLesson(true)}
            className="w-9 h-9 bg-ios-blue rounded-full flex items-center justify-center shadow-ios active:opacity-70"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Учеников" value={students.length} color="blue" />
          <StatCard label="В этом месяце" value={formatMoney(monthRevenue)} color="green" small />
          <StatCard label="Предстоит" value={upcomingLessons.length} color="orange" />
        </div>

        {/* Payment warnings */}
        {warningStudents.length > 0 && (
          <section>
            <SectionTitle title="⚠️ Заканчиваются уроки" />
            <div className="ios-card overflow-hidden">
              {warningStudents.map((student, i) => {
                const { remaining } = getStudentBalance(student.id)
                return (
                  <div
                    key={student.id}
                    onClick={() => onNavigate('studentDetail', student.id)}
                    className={`flex items-center gap-3 px-4 py-3 active:bg-ios-gray6 cursor-pointer ${i > 0 ? 'border-t border-ios-gray5' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-ios-orange/15 flex items-center justify-center shrink-0">
                      <AlertTriangle size={16} className="text-ios-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{student.name}</p>
                      <p className="text-xs text-ios-gray">{student.subject}</p>
                    </div>
                    <Badge
                      label={remaining === 0 ? 'Закончились' : `Осталось ${remaining}`}
                      variant={remaining === 0 ? 'red' : 'orange'}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Today's lessons */}
        <section>
          <SectionTitle title="Сегодня" />
          {todayLessons.length === 0 ? (
            <div className="ios-card px-4 py-6 text-center">
              <p className="text-ios-gray text-sm">Занятий нет</p>
            </div>
          ) : (
            <div className="ios-card overflow-hidden">
              {todayLessons.map((lesson, i) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  students={students}
                  divider={i > 0}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming */}
        {upcomingLessons.length > 0 && (
          <section>
            <SectionTitle title="Ближайшие занятия" />
            <div className="ios-card overflow-hidden">
              {upcomingLessons.map((lesson, i) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  students={students}
                  divider={i > 0}
                  onNavigate={onNavigate}
                  showDate
                />
              ))}
            </div>
          </section>
        )}

        {/* Homework pending */}
        {pendingHomework.length > 0 && (
          <section>
            <SectionTitle title="Домашние задания" />
            <div className="ios-card overflow-hidden">
              {pendingHomework.map((hw, i) => {
                const student = students.find(s => s.id === hw.studentId)
                return (
                  <div
                    key={hw.id}
                    onClick={() => onNavigate('studentDetail', hw.studentId)}
                    className={`flex items-start gap-3 px-4 py-3 active:bg-ios-gray6 cursor-pointer ${i > 0 ? 'border-t border-ios-gray5' : ''}`}
                  >
                    <BookOpen size={16} className="text-ios-orange mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{hw.title}</p>
                      <p className="text-xs text-ios-gray">{student?.name}</p>
                    </div>
                    {hw.dueDate && (
                      <span className="text-xs text-ios-gray shrink-0">{formatDateShort(hw.dueDate)}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      <LessonFormModal isOpen={showAddLesson} onClose={() => setShowAddLesson(false)} />
    </div>
  )
}

function StatCard({ label, value, color, small }) {
  const colors = {
    blue:   'text-ios-blue',
    green:  'text-ios-green',
    orange: 'text-ios-orange',
  }
  return (
    <div className="ios-card p-3 text-center">
      <p className={`font-bold ${small ? 'text-base' : 'text-2xl'} ${colors[color]}`}>{value}</p>
      <p className="text-[10px] text-ios-gray mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

function SectionTitle({ title }) {
  return <h2 className="text-xs font-semibold text-ios-gray uppercase tracking-wide mb-2">{title}</h2>
}

function LessonRow({ lesson, students, divider, onNavigate, showDate }) {
  const student = students.find(s => s.id === lesson.studentId)
  if (!student) return null

  const time = lesson.actualTime || lesson.scheduledTime
  const isDelayed = lesson.actualTime && lesson.actualTime !== lesson.scheduledTime

  const statusConfig = {
    scheduled:    { icon: Clock,         color: 'text-ios-blue',   label: 'Запланировано' },
    completed:    { icon: CheckCircle2,  color: 'text-ios-green',  label: 'Завершено' },
    missed_free:  { icon: AlertTriangle, color: 'text-ios-yellow', label: 'Пропуск (бесплатно)' },
    missed_paid:  { icon: AlertTriangle, color: 'text-ios-red',    label: 'Пропуск' },
    cancelled:    { icon: AlertTriangle, color: 'text-ios-gray',   label: 'Отменено' },
  }
  const { icon: Icon, color } = statusConfig[lesson.status] || statusConfig.scheduled

  return (
    <div
      onClick={() => onNavigate('studentDetail', student.id)}
      className={`flex items-center gap-3 px-4 py-3 active:bg-ios-gray6 cursor-pointer ${divider ? 'border-t border-ios-gray5' : ''}`}
    >
      <Avatar name={student.name} colorIndex={student.colorIndex} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
        <p className="text-xs text-ios-gray">{student.subject}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="flex items-center gap-1 justify-end">
          <Icon size={12} className={color} />
          <span className="text-sm font-medium text-gray-800">{time}</span>
        </div>
        {showDate && <p className="text-xs text-ios-gray">{formatDateShort(lesson.scheduledDate)}</p>}
        {isDelayed && !showDate && <p className="text-[10px] text-ios-orange">Перенос</p>}
      </div>
    </div>
  )
}
