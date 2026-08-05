interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm text-cg-text">{label}</span>}
          {description && <span className="text-xs text-cg-muted">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${checked ? 'bg-cg-accent' : 'bg-cg-surface-2 ring-1 ring-cg-border'}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-150 ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
        />
      </button>
    </label>
  )
}
