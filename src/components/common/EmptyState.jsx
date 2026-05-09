export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-ios-gray5 flex items-center justify-center mb-4">
          <Icon size={28} className="text-ios-gray2" />
        </div>
      )}
      <p className="font-semibold text-gray-800 mb-1">{title}</p>
      {description && <p className="text-sm text-ios-gray mb-4">{description}</p>}
      {action}
    </div>
  )
}
