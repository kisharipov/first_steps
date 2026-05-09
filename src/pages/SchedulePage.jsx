import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import LessonFormModal from '../components/lessons/LessonFormModal'
import { MONTHS, WEEKDAYS_SHORT, getDaysInMonth, getFirstDayOfMonth, todayISO, formatMinutes } from '../utils/helpers'

export default function SchedulePage({ onNavigate }) {
  const { students, lessons, updateLesson, markLessonMissed, deleteLesson } = useApp()

  const today = todayISO()
  const [year,  setYear]  = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(today)
  const [showAddLesson, setShowAddLesson] = useState(false)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  // Map: date string → lessons[]
  const lessonsByDate = useMemo(() => {
    const map = {}
    lessons.forEach(l => {
      const key = l.actualDate || l.scheduledDate
      if (!map[key]) map[key] = []
      map[key].push(l)
    })
    return map
  }, [lessons])

  const selectedLessons = (lessonsByDate[selectedDate] || [])
    .sort((a, b) => (a.actualTime || a.scheduledTime).localeCompare(b.actualTime || b.scheduledTime))

  function isoDate(d) {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }

  return (
    <div className="pb-24">
      <header className="bg-white/90 backdrop-blur sticky top-0 z-40 border-b border-ios-gray5">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Расписание</h1>
          <button
            onClick={() => setShowAddLesson(true)}
            className="w-9 h-9 bg-ios-blue rounded-full flex items-center justify-center shadow-ios active:opacity-70"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </header>

      {/* Calendar */}
      <div className="bg-white border-b border-ios-gray5 px-4 pb-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between py-3">
          <button onClick={prevMonth} className="p-1 active:opacity-60">
            <ChevronLeft size={22} className="text-ios-blue" />
          </button>
          <button
            onClick={() => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()); setSelectedDate(today) }}
            className="text-base font-semibold text-gray-900 active:opacity-60"
          >
            {MONTHS[month]} {year}
          </button>
          <button onClick={nextMonth} className="p-1 active:opacity-60">
            <ChevronRight size={22} className="text-ios-blue" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[11px] font-medium text-ios-gray py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1
            const dateStr = isoDate(day)
            const dayLessons = lessonsByDate[dateStr] || []
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            const hasScheduled = dayLessons.some(l => l.status === 'scheduled')
            const hasCompleted = dayLessons.some(l => l.status === 'completed')
            const hasMissed = dayLessons.some(l => l.status === 'missed_paid' || l.status === 'missed_free')

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center py-1 rounded-ios transition-colors ${
                  isSelected ? 'bg-ios-blue' : isToday ? 'bg-ios-blue/10' : 'active:bg-ios-gray6'
                }`}
              >
                <span className={`text-sm font-medium ${isSelected ? 'text-white' : isToday ? 'text-ios-blue' : 'text-gray-900'}`}>
                  {day}
                </span>
                <div className="flex gap-0.5 mt-0.5 h-1.5">
                  {hasScheduled && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-ios-blue'}`} />}
                  {hasCompleted && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-ios-green'}`} />}
                  {hasMissed && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-ios-red'}`} />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day lessons */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-ios-gray uppercase tracking-wide">
            {selectedDate === today ? 'Сегодня' : formatSelectedDate(selectedDate, month, year)}
          </p>
          <span className="text-xs text-ios-gray">{selectedLessons.length} занятий</span>
        </div>

        {selectedLessons.length === 0 ? (
          <div className="ios-card px-4 py-8 text-center">
            <p className="text-ios-gray text-sm">Нет занятий</p>
            <button onClick={() => setShowAddLesson(true)} className="text-ios-blue text-sm font-medium mt-2 active:opacity-60">
              + Добавить
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedLessons.map(lesson => (
              <ScheduleLessonCard
                key={lesson.id}
                lesson={lesson}
                students={students}
                onNavigate={onNavigate}
                onComplete={() => updateLesson(lesson.id, { status: 'completed' })}
                onMissed={() => markLessonMissed(lesson.id)}
                onDelete={() => { if (confirm('Удалить урок?')) deleteLesson(lesson.id) }}
              />
            ))}
          </div>
        )}
      </div>

      <LessonFormModal isOpen={showAddLesson} onClose={() => setShowAddLesson(false)} />
    </div>
  )
}

function ScheduleLessonCard({ lesson, students, onNavigate, onComplete, onMissed, onDelete }) {
  const student = students.find(s => s.id === lesson.studentId)
  if (!student) return null

  const time = lesson.actualTime || lesson.scheduledTime
  const isDelayed = lesson.actualTime && lesson.actualTime !== lesson.scheduledTime

  const statusConfig = {
    scheduled:   { label: 'Запланирован', variant: 'blue'   },
    completed:   { label: 'Завершён',     variant: 'green'  },
    missed_free: { label: 'Пропуск (бесплатно)', variant: 'yellow' },
    missed_paid: { label: 'Пропуск',      variant: 'red'    },
    cancelled:   { label: 'Отменён',      variant: 'gray'   },
  }
  const { label, variant } = statusConfig[lesson.status] || statusConfig.scheduled

  return (
    <div className="ios-card overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 active:bg-ios-gray6 cursor-pointer"
        onClick={() => onNavigate('studentDetail', student.id)}
      >
        <Avatar name={student.name} colorIndex={student.colorIndex} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{student.name}</p>
          <p className="text-xs text-ios-gray">{student.subject}</p>
          {lesson.notes && <p className="text-xs text-ios-gray italic truncate mt-0.5">{lesson.notes}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-gray-900">{time}</p>
          <p className="text-xs text-ios-gray">{formatMinutes(lesson.durationMin)}</p>
          {isDelayed && <p className="text-[10px] text-ios-orange">перенос</p>}
        </div>
      </div>

      <div className="flex items-center border-t border-ios-gray5">
        <div className="flex-1 px-3 py-1.5">
          <Badge label={label} variant={variant} />
        </div>
        {lesson.status === 'scheduled' && (
          <>
            <button onClick={onComplete} className="px-3 py-2.5 text-xs font-medium text-ios-green border-l border-ios-gray5 active:bg-ios-gray6">
              ✓ Завершить
            </button>
            <button onClick={onMissed} className="px-3 py-2.5 text-xs font-medium text-ios-orange border-l border-ios-gray5 active:bg-ios-gray6">
              Пропуск
            </button>
          </>
        )}
        <button onClick={onDelete} className="px-3 py-2.5 border-l border-ios-gray5 text-ios-gray2 active:text-ios-red active:bg-ios-gray6">
          <AlertTriangle size={14} />
        </button>
      </div>
    </div>
  )
}

function formatSelectedDate(dateStr, month, year) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const MONTHS_RU = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
  return `${d} ${MONTHS_RU[m - 1]}`
}
