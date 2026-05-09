const variants = {
  green:  'bg-ios-green/15  text-ios-green',
  red:    'bg-ios-red/15    text-ios-red',
  orange: 'bg-ios-orange/15 text-ios-orange',
  blue:   'bg-ios-blue/15   text-ios-blue',
  gray:   'bg-ios-gray5     text-ios-gray',
  yellow: 'bg-ios-yellow/20 text-yellow-700',
}

export default function Badge({ label, variant = 'gray', size = 'sm' }) {
  const base = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${base} ${variants[variant]}`}>
      {label}
    </span>
  )
}
