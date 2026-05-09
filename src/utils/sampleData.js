import { generateId, todayISO } from './helpers'
import { format, subDays, addDays } from 'date-fns'

function d(offset) {
  return format(offset >= 0 ? addDays(new Date(), offset) : subDays(new Date(), -offset), 'yyyy-MM-dd')
}

export function createSampleData() {
  const s1 = generateId()
  const s2 = generateId()
  const s3 = generateId()

  const l1 = generateId()
  const l2 = generateId()
  const l3 = generateId()
  const l4 = generateId()
  const l5 = generateId()
  const l6 = generateId()
  const l7 = generateId()
  const l8 = generateId()
  const l9 = generateId()
  const l10 = generateId()

  const students = [
    { id: s1, name: 'Анна Смирнова',  subject: 'Математика', phone: '+7 916 123-45-67', email: 'anna@example.com', ratePerLesson: 1500, lessonDurationMin: 60, colorIndex: 0, notes: 'Готовится к ЕГЭ', createdAt: d(-30) },
    { id: s2, name: 'Дмитрий Козлов', subject: 'Английский', phone: '+7 926 234-56-78', email: 'dima@example.com',  ratePerLesson: 1800, lessonDurationMin: 60, colorIndex: 2, notes: 'Уровень B2, цель — C1', createdAt: d(-20) },
    { id: s3, name: 'Мария Иванова',  subject: 'Физика',     phone: '+7 936 345-67-89', email: '',                  ratePerLesson: 1200, lessonDurationMin: 90, colorIndex: 3, notes: '', createdAt: d(-10) },
  ]

  const lessons = [
    // Anna — past completed lessons
    { id: l1, studentId: s1, scheduledDate: d(-14), scheduledTime: '10:00', actualDate: d(-14), actualTime: '10:00', durationMin: 60, status: 'completed', notes: 'Квадратные уравнения', createdAt: d(-14) },
    { id: l2, studentId: s1, scheduledDate: d(-7),  scheduledTime: '10:00', actualDate: d(-7),  actualTime: '10:05', durationMin: 60, status: 'completed', notes: 'Задачи на проценты',   createdAt: d(-7) },
    { id: l3, studentId: s1, scheduledDate: d(-3),  scheduledTime: '10:00', actualDate: d(-3),  actualTime: '10:00', durationMin: 60, status: 'missed_free', notes: 'Не пришла (первый пропуск в блоке)', createdAt: d(-3) },
    { id: l4, studentId: s1, scheduledDate: d(1),   scheduledTime: '10:00', actualDate: d(1),   actualTime: '10:00', durationMin: 60, status: 'scheduled', notes: '', createdAt: todayISO() },
    { id: l5, studentId: s1, scheduledDate: d(8),   scheduledTime: '10:00', actualDate: d(8),   actualTime: '10:00', durationMin: 60, status: 'scheduled', notes: '', createdAt: todayISO() },

    // Dima — past lessons
    { id: l6,  studentId: s2, scheduledDate: d(-10), scheduledTime: '14:00', actualDate: d(-10), actualTime: '14:00', durationMin: 60, status: 'completed', notes: 'Present Perfect',     createdAt: d(-10) },
    { id: l7,  studentId: s2, scheduledDate: d(-3),  scheduledTime: '14:00', actualDate: d(-3),  actualTime: '14:00', durationMin: 60, status: 'completed', notes: 'Conditionals',        createdAt: d(-3) },
    { id: l8,  studentId: s2, scheduledDate: d(2),   scheduledTime: '14:00', actualDate: d(2),   actualTime: '14:00', durationMin: 60, status: 'scheduled', notes: '', createdAt: todayISO() },

    // Maria
    { id: l9,  studentId: s3, scheduledDate: d(-5),  scheduledTime: '16:00', actualDate: d(-5),  actualTime: '16:00', durationMin: 90, status: 'completed', notes: 'Механика',          createdAt: d(-5) },
    { id: l10, studentId: s3, scheduledDate: d(3),   scheduledTime: '16:00', actualDate: d(3),   actualTime: '16:00', durationMin: 90, status: 'scheduled', notes: '', createdAt: todayISO() },
  ]

  const payments = [
    { id: generateId(), studentId: s1, amount: 7500,  lessonsCount: 5, date: d(-15), note: 'Аванс за 5 уроков' },
    { id: generateId(), studentId: s2, amount: 9000,  lessonsCount: 5, date: d(-11), note: '' },
    { id: generateId(), studentId: s2, amount: 1800,  lessonsCount: 1, date: d(-2),  note: 'Доплата' },
    { id: generateId(), studentId: s3, amount: 3600,  lessonsCount: 3, date: d(-6),  note: '' },
  ]

  const homework = [
    { id: generateId(), studentId: s1, title: 'Задачник стр. 45–48',         description: 'Упражнения №1–12 на квадратные уравнения', status: 'done',    dueDate: d(-7),  createdAt: d(-14) },
    { id: generateId(), studentId: s1, title: 'Тест по процентам',           description: 'Пробный вариант ЕГЭ, задания 1–12',          status: 'pending', dueDate: d(1),   createdAt: d(-7) },
    { id: generateId(), studentId: s2, title: 'Write essay "My Future"',     description: '200–250 слов, Present Perfect + Past Simple',  status: 'pending', dueDate: d(2),   createdAt: d(-3) },
    { id: generateId(), studentId: s2, title: 'Vocabulary Unit 7',           description: 'Выучить 20 новых слов',                        status: 'done',    dueDate: d(-3),  createdAt: d(-10) },
    { id: generateId(), studentId: s3, title: 'Задачи по механике №1–5',     description: 'Из сборника Чертова',                          status: 'pending', dueDate: d(3),   createdAt: d(-5) },
  ]

  const lessonPlans = [
    { id: generateId(), studentId: s1, title: 'Тригонометрия — основные формулы', done: false, order: 0 },
    { id: generateId(), studentId: s1, title: 'Геометрия — площади фигур',        done: false, order: 1 },
    { id: generateId(), studentId: s1, title: 'Пробный ЕГЭ (часть 1)',            done: false, order: 2 },
    { id: generateId(), studentId: s2, title: 'Modal verbs',                       done: false, order: 0 },
    { id: generateId(), studentId: s2, title: 'Speaking: IELTS topics',            done: false, order: 1 },
    { id: generateId(), studentId: s3, title: 'Термодинамика',                     done: false, order: 0 },
    { id: generateId(), studentId: s3, title: 'Электростатика',                    done: false, order: 1 },
  ]

  return { students, lessons, payments, homework, lessonPlans }
}
