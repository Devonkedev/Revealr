import { DoorOpen } from 'lucide-react'
import { Button } from './Button'

interface FindExitButtonProps {
  onClick: () => void
  disabled?: boolean
  label?: string
}

/**
 * "Find My Exit" — locates and scrolls to the real cancel/unsubscribe/reject-
 * cookies/account-deletion/privacy-controls link on the page, however
 * buried it is. Never clicks anything; only improves visibility.
 */
export function FindExitButton({ onClick, disabled, label = 'Find My Exit' }: FindExitButtonProps) {
  return (
    <Button variant="secondary" icon={<DoorOpen size={14} />} onClick={onClick} disabled={disabled} className="w-full">
      {label}
    </Button>
  )
}
