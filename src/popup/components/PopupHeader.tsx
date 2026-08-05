import { Settings as SettingsIcon, ShieldCheck } from 'lucide-react'
import { Toggle } from '@/components'

interface PopupHeaderProps {
  enabled: boolean
  onToggleEnabled: (value: boolean) => void
  onOpenSettings: () => void
}

export function PopupHeader({ enabled, onToggleEnabled, onOpenSettings }: PopupHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-cg-border px-4 py-3">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-cg-accent" />
        <span className="text-sm font-semibold text-cg-text">Revealr</span>
      </div>
      <div className="flex items-center gap-3">
        <Toggle checked={enabled} onChange={onToggleEnabled} />
        <button
          onClick={onOpenSettings}
          className="rounded-md p-1.5 text-cg-muted transition-colors hover:bg-cg-surface-2 hover:text-cg-text"
          aria-label="Settings"
        >
          <SettingsIcon size={16} />
        </button>
      </div>
    </div>
  )
}
