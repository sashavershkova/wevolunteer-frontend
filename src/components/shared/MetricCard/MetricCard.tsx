import type { LucideIcon } from 'lucide-react'
import './MetricCard.css'

type MetricCardProps = {
  label: string
  value: string | number
  hint: string
  icon?: LucideIcon
}

function MetricCard({ label, value, hint, icon: Icon }: MetricCardProps) {
  return (
    <div className="metric-card">
      <p className="metric-card-label">
        {Icon && <Icon className="metric-card-icon" aria-hidden="true" />}
        {label}
      </p>
      <p className="metric-card-value">{value}</p>
      <p className="metric-card-hint">{hint}</p>
    </div>
  )
}

export default MetricCard