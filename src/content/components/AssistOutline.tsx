import type { AssistTarget } from '@/types/detection'

interface AssistOutlineProps {
  assist: AssistTarget
  /** True for a few seconds right after "Find My Exit" targets this one — stronger emphasis. */
  focused?: boolean
}

/**
 * "Find My Exit" highlight — makes a helpful control (the real reject-
 * cookies button, a buried unsubscribe/cancel link, account deletion,
 * privacy controls) visually obvious. Purely cosmetic: ChoiceGuard never
 * clicks or modifies anything.
 */
export function AssistOutline({ assist, focused }: AssistOutlineProps) {
  const rect = assist.element.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null

  return (
    <div
      className={`pointer-events-none absolute rounded-md transition-all duration-300 ${focused ? '' : 'animate-cg-pulse-ring'}`}
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        outline: focused ? '3px solid #5ee6a0' : '2px dashed #5ee6a0',
        outlineOffset: focused ? 4 : 3,
        boxShadow: focused ? '0 0 0 6px rgba(94, 230, 160, 0.25)' : 'none',
      }}
    >
      <span className="absolute -top-6 left-0 whitespace-nowrap rounded-full bg-cg-good px-2 py-0.5 text-[10px] font-medium text-cg-bg shadow">
        {assist.label}
      </span>
    </div>
  )
}
