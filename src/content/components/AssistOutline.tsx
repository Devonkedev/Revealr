import type { AssistTarget } from '@/types/detection'

interface AssistOutlineProps {
  assist: AssistTarget
}

/**
 * "Choice Assist" highlight — makes a helpful control (the real reject-cookies
 * button, a buried unsubscribe link, recurring-billing fine print) visually
 * obvious. Purely cosmetic: ChoiceGuard never clicks or modifies anything.
 */
export function AssistOutline({ assist }: AssistOutlineProps) {
  const rect = assist.element.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null

  return (
    <div
      className="pointer-events-none absolute animate-cg-pulse-ring rounded-md"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        outline: '2px dashed #5ee6a0',
        outlineOffset: 3,
      }}
    >
      <span
        className="absolute -top-6 left-0 whitespace-nowrap rounded-full bg-cg-good px-2 py-0.5 text-[10px] font-medium text-cg-bg shadow"
      >
        {assist.label}
      </span>
    </div>
  )
}
