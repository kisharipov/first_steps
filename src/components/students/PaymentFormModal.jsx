import { useState } from 'react'
import Modal from '../common/Modal'
import { useApp } from '../../context/AppContext'
import { todayISO, formatMoney } from '../../utils/helpers'

export default function PaymentFormModal({ isOpen, onClose, studentId }) {
  const { students, addPayment } = useApp()
  const student = students.find(s => s.id === studentId)

  const [form, setForm] = useState({ lessonsCount: '5', date: todayISO(), note: '' })
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const amount = student ? (Number(form.lessonsCount) || 0) * student.ratePerLesson : 0

  function submit(e) {
    e.preventDefault()
    if (!form.lessonsCount || Number(form.lessonsCount) < 1) return
    addPayment({
      studentId,
      amount,
      lessonsCount: Number(form.lessonsCount),
      date: form.date,
      note: form.note,
    })
    setForm({ lessonsCount: '5', date: todayISO(), note: '' })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Добавить оплату">
      <form onSubmit={submit} className="space-y-4">
        {student && (
          <div className="ios-card p-3 bg-ios-gray6">
            <p className="text-xs text-ios-gray">Ученик</p>
            <p className="font-semibold text-gray-900">{student.name}</p>
            <p className="text-xs text-ios-gray">{formatMoney(student.ratePerLesson)} / урок</p>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-ios-gray mb-1 block">Количество уроков</label>
          <input
            type="number" min="1" className="ios-input"
            value={form.lessonsCount} onChange={e => set('lessonsCount', e.target.value)} required
          />
        </div>

        <div className="ios-card px-4 py-3 bg-ios-green/10">
          <p className="text-xs text-ios-gray">Сумма к оплате</p>
          <p className="text-2xl font-bold text-ios-green">{formatMoney(amount)}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-ios-gray mb-1 block">Дата оплаты</label>
          <input type="date" className="ios-input" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-medium text-ios-gray mb-1 block">Заметка</label>
          <input type="text" className="ios-input" placeholder="Комментарий..." value={form.note} onChange={e => set('note', e.target.value)} />
        </div>

        <button type="submit" className="ios-btn-primary w-full">Записать оплату</button>
      </form>
    </Modal>
  )
}
