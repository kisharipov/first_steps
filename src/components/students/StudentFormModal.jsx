import { useState } from 'react'
import Modal from '../common/Modal'
import { useApp } from '../../context/AppContext'
import { AVATAR_COLORS } from '../../utils/helpers'

const SUBJECTS = ['Математика', 'Физика', 'Химия', 'Биология', 'Английский', 'Русский язык', 'История', 'Информатика', 'Литература', 'Другой']

export default function StudentFormModal({ isOpen, onClose, editStudent }) {
  const { addStudent, updateStudent, deleteStudent } = useApp()

  const [form, setForm] = useState(() => editStudent ? {
    name:             editStudent.name,
    subject:          editStudent.subject,
    phone:            editStudent.phone,
    email:            editStudent.email,
    ratePerLesson:    String(editStudent.ratePerLesson),
    lessonDurationMin: String(editStudent.lessonDurationMin),
    colorIndex:        editStudent.colorIndex,
    notes:             editStudent.notes,
  } : {
    name: '', subject: 'Математика', phone: '', email: '',
    ratePerLesson: '1500', lessonDurationMin: '60', colorIndex: 0, notes: '',
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    const data = {
      name:              form.name.trim(),
      subject:           form.subject,
      phone:             form.phone,
      email:             form.email,
      ratePerLesson:     Number(form.ratePerLesson) || 0,
      lessonDurationMin: Number(form.lessonDurationMin) || 60,
      colorIndex:        form.colorIndex,
      notes:             form.notes,
    }
    if (editStudent) updateStudent(editStudent.id, data)
    else addStudent(data)
    onClose()
  }

  function handleDelete() {
    if (confirm(`Удалить ученика ${editStudent.name}? Все уроки и данные будут удалены.`)) {
      deleteStudent(editStudent.id)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editStudent ? 'Редактировать ученика' : 'Новый ученик'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Color picker */}
        <div>
          <label className="block text-xs font-medium text-ios-gray mb-2">Цвет аватара</label>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_COLORS.map((c, i) => (
              <button
                key={i} type="button"
                onClick={() => set('colorIndex', i)}
                className={`w-8 h-8 rounded-full transition-all ${form.colorIndex === i ? 'ring-2 ring-offset-2 ring-ios-blue scale-110' : ''}`}
                style={{ backgroundColor: c.bg }}
              />
            ))}
          </div>
        </div>

        <Field label="Имя *">
          <input
            type="text" className="ios-input" placeholder="Имя ученика"
            value={form.name} onChange={e => set('name', e.target.value)} required
          />
        </Field>

        <Field label="Предмет">
          <select className="ios-input" value={form.subject} onChange={e => set('subject', e.target.value)}>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Телефон">
            <input type="tel" className="ios-input" placeholder="+7 900 000-00-00"
              value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" className="ios-input" placeholder="email@example.com"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Стоимость урока (₽)">
            <input type="number" min="0" className="ios-input" placeholder="1500"
              value={form.ratePerLesson} onChange={e => set('ratePerLesson', e.target.value)} />
          </Field>
          <Field label="Длительность (мин)">
            <select className="ios-input" value={form.lessonDurationMin} onChange={e => set('lessonDurationMin', e.target.value)}>
              {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} мин</option>)}
            </select>
          </Field>
        </div>

        <Field label="Заметки">
          <textarea className="ios-input resize-none" rows={2} placeholder="Цели, уровень, особенности..."
            value={form.notes} onChange={e => set('notes', e.target.value)} />
        </Field>

        <button type="submit" className="ios-btn-primary w-full">
          {editStudent ? 'Сохранить' : 'Добавить ученика'}
        </button>

        {editStudent && (
          <button type="button" onClick={handleDelete}
            className="w-full py-3 text-ios-red font-medium text-sm active:opacity-60">
            Удалить ученика
          </button>
        )}
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
