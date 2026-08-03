import { format, parseISO, subDays, addDays, differenceInCalendarDays } from 'date-fns'
import { todayISO } from './helpers'

// entries: { [dateISO]: true | false }  true = success, false = explicit fail

export function currentStreak(entries) {
  const today = todayISO()
  let cursor = entries[today] === true ? parseISO(today) : subDays(parseISO(today), 1)
  let streak = 0
  while (true) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (entries[key] === true) {
      streak++
      cursor = subDays(cursor, 1)
    } else {
      break
    }
  }
  return streak
}

export function longestStreak(entries) {
  const dates = Object.keys(entries).filter(k => entries[k] === true).sort()
  if (!dates.length) return 0
  let longest = 1
  let current = 1
  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInCalendarDays(parseISO(dates[i]), parseISO(dates[i - 1]))
    current = diff === 1 ? current + 1 : 1
    longest = Math.max(longest, current)
  }
  return longest
}

export function totalSuccessDays(entries) {
  return Object.values(entries).filter(v => v === true).length
}

export function totalFailDays(entries) {
  return Object.values(entries).filter(v => v === false).length
}

export function lastRelapseDate(entries) {
  const dates = Object.keys(entries).filter(k => entries[k] === false).sort()
  return dates.length ? dates[dates.length - 1] : null
}

// Consecutive success run starting exactly at startDate, stopping at first non-success day (or today+1)
export function challengeProgress(entries, startDate) {
  const today = parseISO(todayISO())
  let cursor = parseISO(startDate)
  let count = 0
  while (cursor <= today) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (entries[key] === true) {
      count++
      cursor = addDays(cursor, 1)
    } else {
      break
    }
  }
  return count
}

export function challengeStatus(entries, startDate, targetDays) {
  const today = todayISO()
  const progress = challengeProgress(entries, startDate)
  if (progress >= targetDays) return 'completed'
  // Failed if there is a day between startDate and today (exclusive of today) that isn't success
  let cursor = parseISO(startDate)
  const yesterday = subDays(parseISO(today), 1)
  while (cursor <= yesterday) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (entries[key] !== true) return 'failed'
    cursor = addDays(cursor, 1)
  }
  return 'active'
}

// URL-safe base64 encode/decode of a JS object (supports Cyrillic)
export function encodeShare(obj) {
  const json = JSON.stringify(obj)
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeShare(str) {
  try {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const json = decodeURIComponent(escape(atob(b64)))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const CHALLENGE_PRESETS = [7, 21, 30, 50, 100]
