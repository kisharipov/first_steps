import {
  Ban, ShieldCheck, Dumbbell, BookOpen, Flame, Heart, Brain, Sun,
  Droplet, Moon, Wallet, Utensils, Cigarette, Smartphone, PenLine, Music,
} from 'lucide-react'

export const HABIT_ICONS = {
  Ban, ShieldCheck, Dumbbell, BookOpen, Flame, Heart, Brain, Sun,
  Droplet, Moon, Wallet, Utensils, Cigarette, Smartphone, PenLine, Music,
}

export const ICON_CHOICES = Object.keys(HABIT_ICONS)

export const COLOR_CHOICES = ['blue', 'green', 'orange', 'red', 'purple', 'indigo', 'yellow']

export const COLOR_HEX = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  indigo: '#5856D6',
  yellow: '#FFCC00',
}

export function getHabitIcon(name) {
  return HABIT_ICONS[name] || Flame
}
