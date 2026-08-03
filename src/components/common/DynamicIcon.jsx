export default function DynamicIcon({ icon: IconComponent, ...props }) {
  return <IconComponent {...props} />
}
