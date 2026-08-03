import { useState } from 'react'
import Modal from '../common/Modal'
import DynamicIcon from '../common/DynamicIcon'
import { ICON_CHOICES, COLOR_CHOICES, COLOR_HEX, getHabitIcon } from '../../utils/habitStyle'

const EMPTY = { name: '', kind: 'do', icon: 'Flame', color: 'blue' }

export default function HabitFormModal({ onClose, onSubmit, initial }) {
  const [form, setForm] = useState(() =>
    initial ? { name: initial.name, kind: initial.kind, icon: initial.icon, color: initial.color } : EMPTY
  )

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit({ ...form, name: form.name.trim() })
    onClose()
  }

  return (
    <Modal isOpen onClose={onClose} title={initial ? 'Изменить привычку' : 'Новая привычка'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="ios-section-title">Название</label>
          <input
            autoFocus
            className="ios-input"
            placeholder="Например: Без сигарет"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div>
          <label className="ios-section-title">Тип</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, kind: 'avoid' }))}
              className={`flex-1 py-2.5 rounded-ios text-sm font-medium ${form.kind === 'avoid' ? 'bg-ios-red text-white' : 'bg-white text-gray-700'}`}
            >
              Отказ / воздержание
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, kind: 'do' }))}
              className={`flex-1 py-2.5 rounded-ios text-sm font-medium ${form.kind === 'do' ? 'bg-ios-green text-white' : 'bg-white text-gray-700'}`}
            >
              Регулярное действие
            </button>
          </div>
        </div>

        <div>
          <label className="ios-section-title">Цвет</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_CHOICES.map(c => (
              <button
                type="button"
                key={c}
                onClick={() => setForm(f => ({ ...f, color: c }))}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLOR_HEX[c], boxShadow: form.color === c ? `0 0 0 2px white, 0 0 0 4px ${COLOR_HEX[c]}` : 'none' }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="ios-section-title">Иконка</label>
          <div className="grid grid-cols-8 gap-2">
            {ICON_CHOICES.map(name => {
              const active = form.icon === name
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => setForm(f => ({ ...f, icon: name }))}
                  className={`w-9 h-9 rounded-ios flex items-center justify-center ${active ? 'bg-ios-blue text-white' : 'bg-white text-ios-gray'}`}
                >
                  <DynamicIcon icon={getHabitIcon(name)} size={17} />
                </button>
              )
            })}
          </div>
        </div>

        <button type="submit" className="ios-btn-primary mt-2">
          {initial ? 'Сохранить' : 'Добавить привычку'}
        </button>
      </form>
    </Modal>
  )
}
