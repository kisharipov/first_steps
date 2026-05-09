import { useState } from 'react'
import { Edit2, Plus, Phone, Mail, CheckCircle2, Clock, AlertTriangle, ChevronRight, Trash2, Check, BookOpen, ListChecks, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'
import StudentFormModal from '../components/students/StudentFormModal'
import LessonFormModal from '../components/lessons/LessonFormModal'
import PaymentFormModal from '../components/students/PaymentFormModal'
import { formatDate, formatDateShort, formatMoney, formatMinutes, todayISO } from '../utils/helpers'

const TABS = [
  { id: 'info',     label: 'Обзор',   Icon: Info },
  { id: 'lessons',  label: 'Уроки',   Icon: Clock },
  { id: 'homework', label: 'ДЗ',      Icon: BookOpen },
  { id: 'plan',     label: 'План',    Icon: ListChecks },
]

export default function StudentDetailPage({ studentId, onBack }) {
  const { students, lessons, payments, homework, lessonPlans,
          getStudentBalance, getLessonPaymentColor, getStudentStats,
          updateLesson, deleteLesson, markLessonMissed,
          addHomework, updateHomework, deleteHomework,
          addLessonPlan, updateLessonPlan, deleteLessonPlan } = useApp()

  const [tab, setTab] = useState('info')
  const [showEdit, setShowEdit] = useState(false)
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showAddHW, setShowAddHW] = useState(false)
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [editLesson, setEditLesson] = useState(null)

  const student = students.find(s => s.id === studentId)
  if (!student) return <div className="p-4 text-ios-gray">Ученик не найден</div>

  const { remaining, totalPaid, consumed } = getStudentBalance(studentId)
  const { completed, upcoming, missedFree, missedPaid } = getStudentStats(studentId)
  const warn = remaining <= 2

  const studentLessons = lessons
    .filter(l => l.studentId === studentId)
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate) || b.scheduledTime.localeCompare(a.scheduledTime))

  const studentHW = homework.filter(h => h.studentId === studentId)
  const studentPlans = lessonPlans.filter(p => p.studentId === studentId).sort((a, b) => a.order - b.order)

  return (
    <div className="pb-24">
      <PageHeader
        title={student.name}
        subtitle={student.subject}
        onBack={onBack}
        action={
          <button onClick={() => setShowEdit(true)} className="text-ios-blue active:opacity-60">
            <Edit2 size={18} />
          </button>
        }
      />

      {/* Student hero */}
      <div className="bg-white border-b border-ios-gray5 px-4 pt-5 pb-4">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} colorIndex={student.colorIndex} size="xl" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
            <p className="text-sm text-ios-gray">{student.subject}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge
                label={remaining <= 0 ? 'Уроки закончились' : `Остаток: ${remaining} ур.`}
                variant={remaining <= 0 ? 'red' : remaining <= 2 ? 'orange' : 'green'}
              />
              {warn && remaining > 0 && <Badge label="Пора оплатить" variant="orange" />}
            </div>
          </div>
        </div>

        {/* Pay warning banner */}
        {warn && (
          <div className="mt-3 bg-ios-orange/10 rounded-ios px-3 py-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-ios-orange shrink-0" />
            <p className="text-sm text-ios-orange font-medium">
              {remaining <= 0 ? 'Оплаченные уроки закончились' : `Осталось ${remaining} оплаченных урока — нужна оплата`}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-ios-gray5 sticky top-[57px] z-30">
        <div className="flex">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id ? 'border-ios-blue text-ios-blue' : 'border-transparent text-ios-gray'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {tab === 'info'     && <InfoTab student={student} totalPaid={totalPaid} consumed={consumed} remaining={remaining} completed={completed} upcoming={upcoming} missedFree={missedFree} missedPaid={missedPaid} onAddPayment={() => setShowAddPayment(true)} onAddLesson={() => setShowAddLesson(true)} />}
        {tab === 'lessons'  && <LessonsTab lessons={studentLessons} studentId={studentId} getLessonPaymentColor={getLessonPaymentColor} onEdit={setEditLesson} onDelete={deleteLesson} onMissed={markLessonMissed} onUpdateLesson={updateLesson} onAdd={() => setShowAddLesson(true)} />}
        {tab === 'homework' && <HomeworkTab items={studentHW} onAdd={() => setShowAddHW(true)} onUpdate={updateHomework} onDelete={deleteHomework} />}
        {tab === 'plan'     && <PlanTab items={studentPlans} onAdd={() => setShowAddPlan(true)} onUpdate={updateLessonPlan} onDelete={deleteLessonPlan} />}
      </div>

      <StudentFormModal isOpen={showEdit} onClose={() => setShowEdit(false)} editStudent={student} />
      <LessonFormModal isOpen={showAddLesson || !!editLesson} onClose={() => { setShowAddLesson(false); setEditLesson(null) }} editLesson={editLesson} defaultStudentId={studentId} />
      <PaymentFormModal isOpen={showAddPayment} onClose={() => setShowAddPayment(false)} studentId={studentId} />
      <AddHWModal isOpen={showAddHW} onClose={() => setShowAddHW(false)} studentId={studentId} onAdd={addHomework} />
      <AddPlanModal isOpen={showAddPlan} onClose={() => setShowAddPlan(false)} studentId={studentId} itemsCount={studentPlans.length} onAdd={addLessonPlan} />
    </div>
  )
}

// ─── Info Tab ──────────────────────────────────────────────────────────────
function InfoTab({ student, totalPaid, consumed, remaining, completed, upcoming, missedFree, missedPaid, onAddPayment, onAddLesson }) {
  return (
    <div className="space-y-5">
      {/* Stats */}
      <section>
        <SectionTitle title="Статистика" />
        <div className="ios-card p-4 grid grid-cols-2 gap-3">
          <StatItem label="Завершено" value={completed} color="text-ios-blue" />
          <StatItem label="Предстоит" value={upcoming} color="text-ios-orange" />
          <StatItem label="Пропуск (бесплатно)" value={missedFree} color="text-ios-yellow" />
          <StatItem label="Пропуск (платный)" value={missedPaid} color="text-ios-red" />
        </div>
      </section>

      {/* Payment */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <SectionTitle title="Оплата" />
          <button onClick={onAddPayment} className="text-ios-blue text-sm font-medium active:opacity-60">+ Платёж</button>
        </div>
        <div className="ios-card p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-ios-gray">Оплачено уроков</span>
            <span className="text-sm font-semibold text-gray-900">{totalPaid}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-ios-gray">Использовано</span>
            <span className="text-sm font-semibold text-gray-900">{consumed}</span>
          </div>
          <div className="h-px bg-ios-gray5" />
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-800">Остаток</span>
            <span className={`text-sm font-bold ${remaining <= 0 ? 'text-ios-red' : remaining <= 2 ? 'text-ios-orange' : 'text-ios-green'}`}>
              {remaining} ур.
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-ios-gray">Стоимость урока</span>
            <span className="text-sm font-semibold text-gray-900">{formatMoney(student.ratePerLesson)}</span>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <SectionTitle title="Действия" />
        <div className="ios-card overflow-hidden">
          <button onClick={onAddLesson} className="flex items-center gap-3 w-full px-4 py-3 active:bg-ios-gray6 border-b border-ios-gray5">
            <div className="w-8 h-8 rounded-full bg-ios-blue/10 flex items-center justify-center">
              <Plus size={16} className="text-ios-blue" />
            </div>
            <span className="text-sm font-medium text-gray-900">Добавить урок</span>
          </button>
          <button onClick={onAddPayment} className="flex items-center gap-3 w-full px-4 py-3 active:bg-ios-gray6">
            <div className="w-8 h-8 rounded-full bg-ios-green/10 flex items-center justify-center">
              <Plus size={16} className="text-ios-green" />
            </div>
            <span className="text-sm font-medium text-gray-900">Добавить оплату</span>
          </button>
        </div>
      </section>

      {/* Contacts */}
      {(student.phone || student.email) && (
        <section>
          <SectionTitle title="Контакты" />
          <div className="ios-card overflow-hidden">
            {student.phone && (
              <a href={`tel:${student.phone}`} className="flex items-center gap-3 px-4 py-3 border-b border-ios-gray5 last:border-0 active:bg-ios-gray6">
                <div className="w-8 h-8 rounded-full bg-ios-green/10 flex items-center justify-center shrink-0">
                  <Phone size={15} className="text-ios-green" />
                </div>
                <div>
                  <p className="text-xs text-ios-gray">Телефон</p>
                  <p className="text-sm font-medium text-ios-blue">{student.phone}</p>
                </div>
              </a>
            )}
            {student.email && (
              <a href={`mailto:${student.email}`} className="flex items-center gap-3 px-4 py-3 active:bg-ios-gray6">
                <div className="w-8 h-8 rounded-full bg-ios-blue/10 flex items-center justify-center shrink-0">
                  <Mail size={15} className="text-ios-blue" />
                </div>
                <div>
                  <p className="text-xs text-ios-gray">Email</p>
                  <p className="text-sm font-medium text-ios-blue">{student.email}</p>
                </div>
              </a>
            )}
          </div>
        </section>
      )}

      {/* Notes */}
      {student.notes && (
        <section>
          <SectionTitle title="Заметки" />
          <div className="ios-card px-4 py-3">
            <p className="text-sm text-gray-700 leading-relaxed">{student.notes}</p>
          </div>
        </section>
      )}

      {/* Lesson info */}
      <section>
        <SectionTitle title="Параметры занятий" />
        <div className="ios-card p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-ios-gray">Длительность урока</span>
            <span className="text-sm font-medium text-gray-900">{formatMinutes(student.lessonDurationMin || 60)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-ios-gray">Стоимость</span>
            <span className="text-sm font-medium text-gray-900">{formatMoney(student.ratePerLesson)}/ур.</span>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Lessons Tab ───────────────────────────────────────────────────────────
function LessonsTab({ lessons, studentId, getLessonPaymentColor, onEdit, onDelete, onMissed, onUpdateLesson, onAdd }) {
  const statusConfig = {
    scheduled:   { label: 'Запланирован', variant: 'blue',   icon: Clock },
    completed:   { label: 'Завершён',     variant: 'green',  icon: CheckCircle2 },
    missed_free: { label: 'Пропуск (бесплатно)', variant: 'yellow', icon: AlertTriangle },
    missed_paid: { label: 'Пропуск',      variant: 'red',    icon: AlertTriangle },
    cancelled:   { label: 'Отменён',      variant: 'gray',   icon: AlertTriangle },
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionTitle title={`${lessons.length} уроков`} />
        <button onClick={onAdd} className="text-ios-blue text-sm font-medium active:opacity-60">+ Урок</button>
      </div>

      {lessons.length === 0 ? (
        <EmptyState icon={Clock} title="Нет уроков" description="Добавьте первый урок" action={<button onClick={onAdd} className="ios-btn-primary">Добавить</button>} />
      ) : (
        <div className="space-y-2">
          {lessons.map(lesson => {
            const payColor = getLessonPaymentColor(studentId, lesson.id)
            const { label, variant, icon: Icon } = statusConfig[lesson.status] || statusConfig.scheduled
            const isDelayed = lesson.actualTime && lesson.actualTime !== lesson.scheduledTime

            return (
              <div key={lesson.id} className="ios-card overflow-hidden">
                <div className="flex items-start gap-3 px-4 pt-3 pb-2">
                  {/* Payment color dot */}
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${payColor === 'green' ? 'bg-ios-green' : payColor === 'red' ? 'bg-ios-red' : 'bg-ios-gray3'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{formatDate(lesson.scheduledDate)}</p>
                      <Badge label={label} variant={variant} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-ios-gray">
                        {lesson.scheduledTime}
                        {isDelayed && ` → ${lesson.actualTime}`}
                        {' · '}{formatMinutes(lesson.durationMin)}
                      </p>
                      {isDelayed && <span className="text-[10px] text-ios-orange font-medium">перенос</span>}
                    </div>
                    {lesson.notes && <p className="text-xs text-ios-gray mt-1 italic truncate">{lesson.notes}</p>}
                  </div>
                </div>

                {/* Actions */}
                {lesson.status === 'scheduled' && (
                  <div className="flex border-t border-ios-gray5">
                    <button
                      onClick={() => onUpdateLesson(lesson.id, { status: 'completed' })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-ios-green active:bg-ios-gray6"
                    >
                      <CheckCircle2 size={14} /> Завершить
                    </button>
                    <div className="w-px bg-ios-gray5" />
                    <button
                      onClick={() => onMissed(lesson.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-ios-orange active:bg-ios-gray6"
                    >
                      <AlertTriangle size={14} /> Пропуск
                    </button>
                    <div className="w-px bg-ios-gray5" />
                    <button
                      onClick={() => onEdit(lesson)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-ios-blue active:bg-ios-gray6"
                    >
                      <Edit2 size={14} /> Изменить
                    </button>
                    <div className="w-px bg-ios-gray5" />
                    <button
                      onClick={() => { if (confirm('Удалить урок?')) onDelete(lesson.id) }}
                      className="flex items-center justify-center px-3 py-2.5 text-ios-red active:bg-ios-gray6"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                {lesson.status !== 'scheduled' && (
                  <div className="flex border-t border-ios-gray5">
                    <button onClick={() => onEdit(lesson)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-ios-blue active:bg-ios-gray6">
                      <Edit2 size={12} /> Изменить
                    </button>
                    <div className="w-px bg-ios-gray5" />
                    <button onClick={() => { if (confirm('Удалить?')) onDelete(lesson.id) }} className="flex items-center justify-center px-4 py-2 text-ios-red active:bg-ios-gray6">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="ios-card p-3">
        <p className="text-xs text-ios-gray font-medium mb-2">Цвет оплаты:</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-ios-green" /><span className="text-xs text-ios-gray">Оплачен</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-ios-red" /><span className="text-xs text-ios-gray">Не оплачен</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-ios-gray3" /><span className="text-xs text-ios-gray">Не учитывается</span></div>
        </div>
      </div>
    </div>
  )
}

// ─── Homework Tab ──────────────────────────────────────────────────────────
function HomeworkTab({ items, onAdd, onUpdate, onDelete }) {
  const pending = items.filter(h => h.status === 'pending')
  const done = items.filter(h => h.status === 'done')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionTitle title="Домашние задания" />
        <button onClick={onAdd} className="text-ios-blue text-sm font-medium active:opacity-60">+ Добавить</button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={BookOpen} title="Нет заданий" description="Добавьте домашнее задание" action={<button onClick={onAdd} className="ios-btn-primary">Добавить</button>} />
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <p className="text-xs text-ios-gray font-semibold uppercase tracking-wide mb-2">Активные</p>
              <div className="ios-card overflow-hidden">
                {pending.map((hw, i) => (
                  <HWItem key={hw.id} hw={hw} divider={i > 0} onUpdate={onUpdate} onDelete={onDelete} />
                ))}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <p className="text-xs text-ios-gray font-semibold uppercase tracking-wide mb-2">Выполнено</p>
              <div className="ios-card overflow-hidden opacity-60">
                {done.map((hw, i) => (
                  <HWItem key={hw.id} hw={hw} divider={i > 0} onUpdate={onUpdate} onDelete={onDelete} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function HWItem({ hw, divider, onUpdate, onDelete }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 ${divider ? 'border-t border-ios-gray5' : ''}`}>
      <button
        onClick={() => onUpdate(hw.id, { status: hw.status === 'done' ? 'pending' : 'done' })}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          hw.status === 'done' ? 'bg-ios-green border-ios-green' : 'border-ios-gray3'
        }`}
      >
        {hw.status === 'done' && <Check size={12} className="text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${hw.status === 'done' ? 'line-through text-ios-gray' : 'text-gray-900'}`}>
          {hw.title}
        </p>
        {hw.description && <p className="text-xs text-ios-gray mt-0.5">{hw.description}</p>}
        {hw.dueDate && <p className="text-xs text-ios-orange mt-0.5">до {formatDateShort(hw.dueDate)}</p>}
      </div>
      <button onClick={() => { if (confirm('Удалить задание?')) onDelete(hw.id) }} className="text-ios-gray3 active:text-ios-red shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Plan Tab ─────────────────────────────────────────────────────────────
function PlanTab({ items, onAdd, onUpdate, onDelete }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionTitle title="План занятий" />
        <button onClick={onAdd} className="text-ios-blue text-sm font-medium active:opacity-60">+ Добавить</button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={ListChecks} title="План пуст" description="Добавьте темы для предстоящих занятий" action={<button onClick={onAdd} className="ios-btn-primary">Добавить тему</button>} />
      ) : (
        <div className="ios-card overflow-hidden">
          {items.map((plan, i) => (
            <div key={plan.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-ios-gray5' : ''}`}>
              <button
                onClick={() => onUpdate(plan.id, { done: !plan.done })}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  plan.done ? 'bg-ios-blue border-ios-blue' : 'border-ios-gray3'
                }`}
              >
                {plan.done && <Check size={12} className="text-white" />}
              </button>
              <p className={`flex-1 text-sm ${plan.done ? 'line-through text-ios-gray' : 'text-gray-900'}`}>
                {plan.title}
              </p>
              <button onClick={() => { if (confirm('Удалить?')) onDelete(plan.id) }} className="text-ios-gray3 active:text-ios-red shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helper sub-components ─────────────────────────────────────────────────
function SectionTitle({ title }) {
  return <p className="text-xs font-semibold text-ios-gray uppercase tracking-wide mb-2">{title}</p>
}

function StatItem({ label, value, color }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-ios-gray leading-tight">{label}</p>
    </div>
  )
}

// ─── Add HW Modal ──────────────────────────────────────────────────────────
function AddHWModal({ isOpen, onClose, studentId, onAdd }) {
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' })
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    onAdd({ studentId, title: form.title.trim(), description: form.description, status: 'pending', dueDate: form.dueDate })
    setForm({ title: '', description: '', dueDate: '' })
    onClose()
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Домашнее задание">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-ios-gray mb-1 block">Задание *</label>
          <input className="ios-input" placeholder="Название задания" value={form.title} onChange={e => set('title', e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium text-ios-gray mb-1 block">Описание</label>
          <textarea className="ios-input resize-none" rows={2} placeholder="Подробности..." value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-ios-gray mb-1 block">Срок выполнения</label>
          <input type="date" className="ios-input" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
        </div>
        <button type="submit" className="ios-btn-primary w-full">Добавить</button>
      </form>
    </Modal>
  )
}

// ─── Add Plan Modal ────────────────────────────────────────────────────────
function AddPlanModal({ isOpen, onClose, studentId, itemsCount, onAdd }) {
  const [title, setTitle] = useState('')
  function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ studentId, title: title.trim(), done: false, order: itemsCount })
    setTitle('')
    onClose()
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Тема в план">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-ios-gray mb-1 block">Тема *</label>
          <input className="ios-input" placeholder="Тема следующего урока" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <button type="submit" className="ios-btn-primary w-full">Добавить</button>
      </form>
    </Modal>
  )
}
