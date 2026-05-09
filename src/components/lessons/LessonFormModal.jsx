import { useState } from 'react'
import Modal from '../common/Modal'
import { useApp } from '../../context/AppContext'
import { todayISO, nowTime, generateId } from '../../utils/helpers'

export default function LessonFormModal({ isOpen, onClose, editLesson, defaultStudentId }) {
  const { students, addLesson, updateLesson } = useApp()

  const [form, setForm] = useState(() => editLesson ? {
    studentId:     editLesson.studentId,
    scheduledDate: editLesson.scheduledDate,
    scheduledTime: editLesson.scheduledTime,
    actualDate:    editLesson.actualDate,
    actualTime:    editLesson.actualTime,
    durationMin:   String(editLesson.durationMin),
    status:        editLesson.status,
    notes:         editLesson.notes,
  } : {
    studentId:     defaultStudentId || (students[0]?.id || ''),
    scheduledDate: todayISO(),
    scheduledTime: '10:00',
    actualDate:    todayISO(),
    actualTime:    '10:00',
    durationMin:   '60',
    status:        'scheduled',
    notes:         '',
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.studentId || !form.scheduledDate || !form.scheduledTime) return
    const data = {
      studentId:     form.studentId,
      scheduledDate: form.scheduledDate,
      scheduledTime: form.scheduledTime,
      actualDate:    form.actualDate || form.scheduledDate,
      actualTime:    form.actualTime || form.scheduledTime,
      durationMin:   Number(form.durationMin) || 60,
      status:        form.status,
      notes:         form.notes,
    }
    if (editLesson) updateLesson(editLesson.id, data)
    else addLesson(data)
    onClose()
  }

  const selectedStudent = students.find(s => s.id === form.studentId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editLesson ? 'Редактировать урок' : 'Новый урок'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Ученик">
          <select
            className="ios-input"
            value={form.studentId}
            onChange={e => {
              const s = students.find(st => st.id === e.target.value)
              set('studentId', e.target.value)
              if (s) set('durationMin', String(s.lessonDurationMin || 60))
            }}
          >
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Дата">
            <input type="date" className="ios-input" value={form.scheduledDate} onChange={e => { set('scheduledDate', e.target.value); set('actualDate', e.target.value) }} />
          </Field>
          <Field label="Время">
            <input type="time" className="ios-input" value={form.scheduledTime} onChange={e => { set('scheduledTime', e.target.value); set('actualTime', e.target.value) }} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Факт. дата">
            <input type="date" className="ios-input" value={form.actualDate} onChange={e => set('actualDate', e.target.value)} />
          </Field>
          <Field label="Факт. время">
            <input type="time" className="ios-input" value={form.actualTime} onChange={e => set('actualTime', e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Длительность (мин)">
            <input type="number" min="15" step="15" className="ios-input" value={form.durationMin}
              onChange={e => set('durationMin', e.target.value)} />
          </Field>
          <Field label="Статус">
            <select className="ios-input" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="scheduled">Запланирован</option>
              <option value="completed">Завершён</option>
              <option value="missed_free">Пропуск (бесплатно)</option>
              <option value="missed_paid">Пропуск (платный)</option>
              <option value="cancelled">Отменён</option>
            </select>
          </Field>
        </div>

        <Field label="Заметки">
          <textarea
            className="ios-input resize-none"
            rows={2}
            placeholder="Тема урока, заметки..."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </Field>

        <button type="submit" className="ios-btn-primary w-full">
          {editLesson ? 'Сохранить' : 'Добавить урок'}
        </button>
      </form>
    </Modal>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ios-gray mb-1">{label}</label>
      {children}
    </div>
  )
}
