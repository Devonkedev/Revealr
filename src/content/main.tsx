import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ContentApp } from './components/ContentApp'
import { isCurrentTopFrame } from '@/utils/domUtils'
// `?inline` returns the fully-compiled Tailwind CSS as a string instead of injecting a <link>,
// which is what lets us load it into a shadow root (a regular Vite CSS import can't reach there).
import contentStyles from '@/styles/globals.css?inline'

const HOST_ID = 'choiceguard-host'

/**
 * `:root` selectors inside a shadow tree's stylesheet don't match anything
 * (the tree has no root element of its own), so Tailwind's `@theme` custom
 * properties would otherwise never resolve in the overlay/drawer. Re-declare
 * them on `:host` — which *does* match from inside the shadow tree and
 * cascades down to every element we render — as a small, deliberate patch
 * on top of the generated stylesheet.
 */
const HOST_THEME_VARS = `
:host {
  all: initial;
  --color-cg-bg: #0b0b0f;
  --color-cg-surface: #131318;
  --color-cg-surface-2: #1a1a22;
  --color-cg-border: #26262f;
  --color-cg-text: #f2f2f5;
  --color-cg-muted: #9797a6;
  --color-cg-accent: #7c6cf6;
  --color-cg-accent-2: #5ee6c8;
  --color-cg-danger: #ff5d5d;
  --color-cg-warn: #ffb84d;
  --color-cg-good: #5ee6a0;
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  color-scheme: dark;
}
`

function mount(): void {
  if (!isCurrentTopFrame()) return // skip inside ads/tracking iframes
  if (document.getElementById(HOST_ID)) return

  const host = document.createElement('div')
  host.id = HOST_ID
  document.documentElement.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = HOST_THEME_VARS + contentStyles
  shadow.appendChild(style)

  const appRoot = document.createElement('div')
  shadow.appendChild(appRoot)

  createRoot(appRoot).render(
    <StrictMode>
      <ContentApp />
    </StrictMode>,
  )
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}
