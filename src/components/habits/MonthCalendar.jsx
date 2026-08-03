import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check, X as XIcon } from 'lucide-react'
import { WEEKDAYS_SHORT, MONTHS, getDaysInMonth, getFirstDayOfMonth, todayISO } from '../../utils/helpers'
import { COLOR_HEX } from '../../utils/habitStyle'

export default function MonthCalendar({ entries, color, onToggleDay }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const hex = COLOR_HEX[color] || COLOR_HEX.blue
  const todayStr = todayISO()

  function toDateStr(day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isFutureMonth = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth())

  return (
    <div className="ios-card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-ios-gray5 active:opacity-60">
          <ChevronLeft size={16} className="text-ios-gray" />
        </button>
        <p className="font-semibold text-sm text-gray-900">{MONTHS[month]} {year}</p>
        <button onClick={nextMonth} disabled={isFutureMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-ios-gray5 active:opacity-60 disabled:opacity-30">
          <ChevronRight size={16} className="text-ios-gray" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS_SHORT.slice(1).concat(WEEKDAYS_SHORT[0]).map(w => (
          <div key={w} className="text-center text-[10px] font-medium text-ios-gray2">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />
          const dateStr = toDateStr(day)
          const state = entries[dateStr]
          const isFuture = dateStr > todayStr
          const isToday = dateStr === todayStr
          let style = { backgroundColor: '#F2F2F7', color: '#8E8E93' }
          if (state === true) style = { backgroundColor: hex, color: '#fff' }
          else if (state === false) style = { backgroundColor: '#FFE8E7', color: '#FF3B30' }
          return (
            <button
              key={dateStr}
              disabled={isFuture}
              onClick={() => onToggleDay(dateStr)}
              className="aspect-square rounded-ios flex flex-col items-center justify-center text-[11px] font-medium disabled:opacity-30 relative"
              style={style}
            >
              {state === true && <Check size={11} strokeWidth={3} className="absolute top-0.5 right-0.5" />}
              {state === false && <XIcon size={11} strokeWidth={3} className="absolute top-0.5 right-0.5" />}
              <span className={isToday ? 'underline underline-offset-2' : ''}>{day}</span>
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-ios-gray text-center mt-3">Нажмите на день, чтобы отметить: пусто → успех → срыв → пусто</p>
    </div>
  )
}
