import { Home, Users, Calendar, DollarSign } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Главная',   Icon: Home },
  { id: 'students',  label: 'Ученики',   Icon: Users },
  { id: 'schedule',  label: 'Расписание', Icon: Calendar },
  { id: 'finance',   label: 'Финансы',   Icon: DollarSign },
]

export default function BottomNav({ active, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 backdrop-blur border-t border-ios-gray5 z-50"
         style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
      <div className="flex">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="flex-1 flex flex-col items-center pt-2 pb-1 gap-0.5 active:opacity-60 transition-opacity"
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? 'text-ios-blue' : 'text-ios-gray2'}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-ios-blue' : 'text-ios-gray2'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
