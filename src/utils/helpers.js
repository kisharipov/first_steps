import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Сегодня'
  if (isTomorrow(date)) return 'Завтра'
  if (isYesterday(date)) return 'Вчера'
  return format(date, 'd MMMM', { locale: ru })
}

export function formatDateFull(dateStr) {
  if (!dateStr) return ''
  return format(parseISO(dateStr), 'd MMMM yyyy', { locale: ru })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  return format(parseISO(dateStr), 'd MMM', { locale: ru })
}

export function formatDayOfWeek(dateStr) {
  if (!dateStr) return ''
  return format(parseISO(dateStr), 'EEEE', { locale: ru })
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function nowTime() {
  return format(new Date(), 'HH:mm')
}

export function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const AVATAR_COLORS = [
  { bg: '#007AFF', light: '#E5F0FF' },
  { bg: '#34C759', light: '#E5F9EC' },
  { bg: '#FF9500', light: '#FFF4E5' },
  { bg: '#AF52DE', light: '#F5E8FF' },
  { bg: '#FF3B30', light: '#FFE8E7' },
  { bg: '#5856D6', light: '#EEEEFC' },
  { bg: '#FF2D55', light: '#FFE5EC' },
  { bg: '#00C7BE', light: '#E5FAFA' },
]

export function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

export function getInitials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount)
}

export function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes} мин`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`
}

export const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
export const WEEKDAYS_FULL  = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

export const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year, month) {
  let day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday-based
}
