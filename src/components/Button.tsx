import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: ReactNode
  children: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-cg-accent text-white hover:bg-cg-accent/90 shadow-sm shadow-cg-accent/20',
  secondary: 'bg-cg-surface-2 text-cg-text hover:bg-cg-surface-2/70 ring-1 ring-cg-border',
  ghost: 'bg-transparent text-cg-muted hover:text-cg-text hover:bg-cg-surface-2/60',
  danger: 'bg-cg-danger/15 text-cg-danger hover:bg-cg-danger/25 ring-1 ring-cg-danger/30',
}

export function Button({ variant = 'primary', icon, children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
