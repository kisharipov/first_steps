import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { generateId, todayISO } from '../utils/helpers'
import { createSampleData } from '../utils/sampleData'

const AppContext = createContext(null)

function loadFromStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function AppProvider({ children }) {
  const [students,    setStudents]    = useState(() => loadFromStorage('students', null))
  const [lessons,     setLessons]     = useState(() => loadFromStorage('lessons', null))
  const [payments,    setPayments]    = useState(() => loadFromStorage('payments', null))
  const [homework,    setHomework]    = useState(() => loadFromStorage('homework', null))
  const [lessonPlans, setLessonPlans] = useState(() => loadFromStorage('lessonPlans', null))

  // Seed sample data on first launch
  useEffect(() => {
    if (students === null) {
      const sample = createSampleData()
      setStudents(sample.students)
      setLessons(sample.lessons)
      setPayments(sample.payments)
      setHomework(sample.homework)
      setLessonPlans(sample.lessonPlans)
    }
  }, [])

  useEffect(() => { if (students !== null) saveToStorage('students', students) }, [students])
  useEffect(() => { if (lessons  !== null) saveToStorage('lessons',  lessons)  }, [lessons])
  useEffect(() => { if (payments !== null) saveToStorage('payments', payments) }, [payments])
  useEffect(() => { if (homework !== null) saveToStorage('homework', homework) }, [homework])
  useEffect(() => { if (lessonPlans !== null) saveToStorage('lessonPlans', lessonPlans) }, [lessonPlans])

  // ─── Students ────────────────────────────────────────────────
  const addStudent = useCallback((data) => {
    const student = { ...data, id: generateId(), createdAt: todayISO() }
    setStudents(prev => [...(prev || []), student])
    return student
  }, [])

  const updateStudent = useCallback((id, data) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
  }, [])

  const deleteStudent = useCallback((id) => {
    setStudents(prev => prev.filter(s => s.id !== id))
    setLessons(prev => prev.filter(l => l.studentId !== id))
    setPayments(prev => prev.filter(p => p.studentId !== id))
    setHomework(prev => prev.filter(h => h.studentId !== id))
    setLessonPlans(prev => prev.filter(p => p.studentId !== id))
  }, [])

  // ─── Lessons ──────────────────────────────────────────────────
  const addLesson = useCallback((data) => {
    const lesson = { ...data, id: generateId(), createdAt: todayISO() }
    setLessons(prev => [...(prev || []), lesson])
    return lesson
  }, [])

  const updateLesson = useCallback((id, data) => {
    setLessons(prev => prev.map(l => l.id === id ? { ...l, ...data } : l))
  }, [])

  const deleteLesson = useCallback((id) => {
    setLessons(prev => prev.filter(l => l.id !== id))
  }, [])

  // Determine if a missed lesson in this position should be free (first in 12h block)
  const getMissType = useCallback((studentId, lessonId) => {
    const student = (students || []).find(s => s.id === studentId)
    if (!student) return 'paid'
    const durationHours = (student.lessonDurationMin || 60) / 60

    const studentLessons = (lessons || [])
      .filter(l => l.studentId === studentId)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.scheduledTime.localeCompare(b.scheduledTime))

    let cumulativeHours = 0
    for (const lesson of studentLessons) {
      if (lesson.id === lessonId) {
        const blockIndex = Math.floor(cumulativeHours / 12)
        const blockStartHours = blockIndex * 12
        const prevInBlock = studentLessons.filter(l => {
          if (l.id === lessonId) return false
          if (l.status !== 'missed_free' && l.status !== 'missed_paid' && l.status !== 'completed') return false
          // Check if this lesson falls in same block
          let h = 0
          for (const ll of studentLessons) {
            if (ll.id === l.id) break
            if (ll.status === 'completed' || ll.status === 'missed_free' || ll.status === 'missed_paid') {
              h += durationHours
            }
          }
          return Math.floor(h / 12) === blockIndex
        })
        const hasFreeMissInBlock = prevInBlock.some(l => l.status === 'missed_free')
        return hasFreeMissInBlock ? 'paid' : 'free'
      }
      if (lesson.status === 'completed' || lesson.status === 'missed_free' || lesson.status === 'missed_paid') {
        cumulativeHours += durationHours
      }
    }
    return 'paid'
  }, [students, lessons])

  const markLessonMissed = useCallback((id) => {
    const lesson = (lessons || []).find(l => l.id === id)
    if (!lesson) return
    const missType = getMissType(lesson.studentId, id)
    updateLesson(id, { status: missType === 'free' ? 'missed_free' : 'missed_paid' })
  }, [lessons, getMissType, updateLesson])

  // ─── Payments ────────────────────────────────────────────────
  const addPayment = useCallback((data) => {
    const payment = { ...data, id: generateId() }
    setPayments(prev => [...(prev || []), payment])
    return payment
  }, [])

  const deletePayment = useCallback((id) => {
    setPayments(prev => prev.filter(p => p.id !== id))
  }, [])

  // ─── Homework ─────────────────────────────────────────────────
  const addHomework = useCallback((data) => {
    const hw = { ...data, id: generateId(), createdAt: todayISO() }
    setHomework(prev => [...(prev || []), hw])
    return hw
  }, [])

  const updateHomework = useCallback((id, data) => {
    setHomework(prev => prev.map(h => h.id === id ? { ...h, ...data } : h))
  }, [])

  const deleteHomework = useCallback((id) => {
    setHomework(prev => prev.filter(h => h.id !== id))
  }, [])

  // ─── Lesson Plans ─────────────────────────────────────────────
  const addLessonPlan = useCallback((data) => {
    const plan = { ...data, id: generateId() }
    setLessonPlans(prev => [...(prev || []), plan])
    return plan
  }, [])

  const updateLessonPlan = useCallback((id, data) => {
    setLessonPlans(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
  }, [])

  const deleteLessonPlan = useCallback((id) => {
    setLessonPlans(prev => prev.filter(p => p.id !== id))
  }, [])

  // ─── Computed helpers ─────────────────────────────────────────
  const getStudentBalance = useCallback((studentId) => {
    const totalPaid = (payments || [])
      .filter(p => p.studentId === studentId)
      .reduce((sum, p) => sum + (p.lessonsCount || 0), 0)

    const consumed = (lessons || [])
      .filter(l => l.studentId === studentId && (l.status === 'completed' || l.status === 'missed_paid'))
      .length

    return { totalPaid, consumed, remaining: totalPaid - consumed }
  }, [payments, lessons])

  // Returns per-lesson payment color: 'green' | 'red' | 'none'
  const getLessonPaymentColor = useCallback((studentId, lessonId) => {
    const studentLessons = (lessons || [])
      .filter(l => l.studentId === studentId && (l.status === 'completed' || l.status === 'missed_paid' || l.status === 'scheduled'))
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.scheduledTime.localeCompare(b.scheduledTime))

    const { totalPaid } = getStudentBalance(studentId)
    const idx = studentLessons.findIndex(l => l.id === lessonId)
    if (idx === -1) return 'none'
    return idx < totalPaid ? 'green' : 'red'
  }, [lessons, getStudentBalance])

  const getStudentStats = useCallback((studentId) => {
    const sl = (lessons || []).filter(l => l.studentId === studentId)
    const completed  = sl.filter(l => l.status === 'completed').length
    const upcoming   = sl.filter(l => l.status === 'scheduled').length
    const missedFree = sl.filter(l => l.status === 'missed_free').length
    const missedPaid = sl.filter(l => l.status === 'missed_paid').length
    return { completed, upcoming, missedFree, missedPaid }
  }, [lessons])

  const getTotalRevenue = useCallback(() => {
    return (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
  }, [payments])

  const value = {
    students: students || [],
    lessons:  lessons  || [],
    payments: payments || [],
    homework: homework || [],
    lessonPlans: lessonPlans || [],
    // Students
    addStudent, updateStudent, deleteStudent,
    // Lessons
    addLesson, updateLesson, deleteLesson, markLessonMissed,
    // Payments
    addPayment, deletePayment,
    // Homework
    addHomework, updateHomework, deleteHomework,
    // Lesson Plans
    addLessonPlan, updateLessonPlan, deleteLessonPlan,
    // Computed
    getStudentBalance, getLessonPaymentColor, getStudentStats, getTotalRevenue,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
