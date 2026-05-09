import { getInitials, getAvatarColor } from '../../utils/helpers'

export default function Avatar({ name, colorIndex = 0, size = 'md' }) {
  const { bg } = getAvatarColor(colorIndex)
  const initials = getInitials(name)

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  )
}
