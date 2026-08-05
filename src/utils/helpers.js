import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatDateFull(dateStr) {
  if (!dateStr) return ''
  return format(parseISO(dateStr), 'd MMMM yyyy', { locale: ru })
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year, month) {
  let day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday-based
}
