import './BrandMark.css'

type BrandMarkProps = {
  className?: string
}

function BrandMark({ className }: BrandMarkProps) {
  const classes = ['brand-mark', className].filter(Boolean).join(' ')

  return (
    <svg className={classes} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="16" className="brand-mark-bg" />
      <path
        d="M16 22.3c-2.8-2.6-7.6-5.9-7.6-9.8 0-2.2 1.7-3.7 3.8-3.7 1.5 0 2.7.9 3.3 2z"
        className="brand-mark-fill"
      />
      <path
        d="M16 22.3c2.8-2.6 7.6-5.9 7.6-9.8 0-2.2-1.7-3.7-3.8-3.7-1.5 0-2.7.9-3.3 2z"
        className="brand-mark-fill brand-mark-fill-light"
      />
    </svg>
  )
}

export default BrandMark
