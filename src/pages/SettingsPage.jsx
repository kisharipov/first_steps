import { useRef, useState } from 'react'
import { Lock, Download, Upload, Trash2, ShieldCheck } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import { useHabits } from '../context/habitStore'
import { todayISO } from '../utils/helpers'

function Row({ icon: Icon, title, subtitle, right, onClick }) {
  return (
    <button onClick={onClick} className="w-full ios-card p-4 flex items-center gap-3 text-left">
      <div className="w-9 h-9 rounded-full bg-ios-gray5 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-ios-gray" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm">{title}</p>
        {subtitle && <p className="text-xs text-ios-gray mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </button>
  )
}

export default function SettingsPage() {
  const { privacyMode, setPrivacyMode, exportData, importData, resetAll } = useHabits()
  const fileInput = useRef(null)
  const [message, setMessage] = useState('')

  function handleExport() {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habit-tracker-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInput.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importData(reader.result)
        setMessage('Данные успешно импортированы')
      } catch {
        setMessage('Не удалось прочитать файл — проверьте формат')
      }
      setTimeout(() => setMessage(''), 3000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleReset() {
    if (window.confirm('Удалить все привычки, историю и челленджи без возможности восстановления?')) {
      resetAll()
      setMessage('Данные сброшены')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <div className="pb-24">
      <PageHeader title="Настройки" />

      <div className="px-4 pt-4 flex flex-col gap-2.5">
        <h2 className="ios-section-title !px-0">Приватность</h2>
        <Row
          icon={Lock}
          title="Приватный режим"
          subtitle="Скрывает названия привычек на экранах — удобно, если рядом кто-то смотрит"
          onClick={() => setPrivacyMode(!privacyMode)}
          right={
            <span className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${privacyMode ? 'bg-ios-green justify-end' : 'bg-ios-gray4 justify-start'}`}>
              <span className="w-5 h-5 rounded-full bg-white shadow" />
            </span>
          }
        />

        <h2 className="ios-section-title !px-0 mt-3">Данные</h2>
        <Row icon={Download} title="Экспорт данных" subtitle="Сохранить резервную копию в JSON-файл" onClick={handleExport} />
        <Row icon={Upload} title="Импорт данных" subtitle="Восстановить из ранее сохранённого файла" onClick={handleImportClick} />
        <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
        <Row icon={Trash2} title="Сбросить всё" subtitle="Удалить все привычки и историю" onClick={handleReset} />

        {message && <p className="text-center text-sm text-ios-green font-medium py-1">{message}</p>}

        <div className="ios-card p-4 mt-3 flex items-start gap-3">
          <ShieldCheck size={18} className="text-ios-blue shrink-0 mt-0.5" />
          <p className="text-xs text-ios-gray leading-relaxed">
            Все данные хранятся только на этом устройстве в памяти браузера. Никуда не отправляются.
            Регулярно делайте экспорт, чтобы не потерять историю при очистке кэша или смене устройства.
          </p>
        </div>
      </div>
    </div>
  )
}
