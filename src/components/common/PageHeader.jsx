import { ChevronLeft } from 'lucide-react'

export default function PageHeader({ title, subtitle, onBack, action }) {
  return (
    <header className="bg-white/90 backdrop-blur sticky top-0 z-40 border-b border-ios-gray5">
      <div className="flex items-center px-4 py-3 gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-ios-blue -ml-1 active:opacity-60 transition-opacity"
          >
            <ChevronLeft size={28} strokeWidth={2} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className={`font-semibold text-gray-900 truncate leading-tight ${subtitle ? 'text-base' : 'text-xl'}`}>
            {title}
          </h1>
          {subtitle && <p className="text-xs text-ios-gray truncate">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}
