import { useState } from 'react'
import { Plus, Users, AlertTriangle, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import EmptyState from '../components/common/EmptyState'
import StudentFormModal from '../components/students/StudentFormModal'

export default function StudentsPage({ onNavigate }) {
  const { students, getStudentBalance, getStudentStats, lessons } = useApp()
  const [showForm, setShowForm] = useState(false)

  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  return (
    <div className="pb-24">
      <header className="bg-white/90 backdrop-blur sticky top-0 z-40 border-b border-ios-gray5">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Ученики</h1>
          <button
            onClick={() => setShowForm(true)}
            className="w-9 h-9 bg-ios-blue rounded-full flex items-center justify-center shadow-ios active:opacity-70"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </header>

      <div className="px-4 py-4">
        {sortedStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Нет учеников"
            description="Добавьте первого ученика, чтобы начать"
            action={
              <button onClick={() => setShowForm(true)} className="ios-btn-primary">
                Добавить ученика
              </button>
            }
          />
        ) : (
          <div className="ios-card overflow-hidden">
            {sortedStudents.map((student, i) => {
              const { remaining } = getStudentBalance(student.id)
              const { upcoming } = getStudentStats(student.id)
              const nextLesson = lessons
                .filter(l => l.studentId === student.id && l.status === 'scheduled')
                .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0]

              const warn = remaining <= 2

              return (
                <div
                  key={student.id}
                  onClick={() => onNavigate('studentDetail', student.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 active:bg-ios-gray6 cursor-pointer ${i > 0 ? 'border-t border-ios-gray5' : ''}`}
                >
                  <div className="relative shrink-0">
                    <Avatar name={student.name} colorIndex={student.colorIndex} size="md" />
                    {warn && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-ios-orange rounded-full flex items-center justify-center">
                        <AlertTriangle size={9} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{student.name}</p>
                    <p className="text-sm text-ios-gray truncate">{student.subject}</p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <Badge
                        label={remaining <= 0 ? 'Нет уроков' : `${remaining} ур.`}
                        variant={remaining <= 0 ? 'red' : remaining <= 2 ? 'orange' : 'green'}
                      />
                    </div>
                    <ChevronRight size={16} className="text-ios-gray3" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <StudentFormModal isOpen={showForm} onClose={() => setShowForm(false)} />
    </div>
  )
}
