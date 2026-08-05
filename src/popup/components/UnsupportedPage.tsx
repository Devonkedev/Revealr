import { ShieldOff } from 'lucide-react'

export function UnsupportedPage() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <ShieldOff size={28} className="text-cg-muted" />
      <div>
        <p className="text-sm font-medium text-cg-text">Revealr can't scan this page</p>
        <p className="mt-1 text-xs text-cg-muted">
          Browser internal pages, the Chrome Web Store, and other extension pages aren't accessible to extensions. Open a regular website to
          start scanning.
        </p>
      </div>
    </div>
  )
}
