import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

/**
 * Manifest V3 definition for ChoiceGuard.
 * Built with @crxjs/vite-plugin so all referenced entry points
 * (background, content script, popup) are bundled by Vite/Rollup.
 */
export default defineManifest({
  manifest_version: 3,
  name: 'ChoiceGuard — Know What You’re Agreeing To',
  short_name: 'ChoiceGuard',
  description:
    "Tells you exactly what you're agreeing to before you click Continue — hidden subscriptions, pre-checked add-ons, buried cancel links — and helps you find your way out.",
  version: pkg.version,
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_popup: 'index.html',
    default_icon: {
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
    default_title: 'ChoiceGuard',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/main.tsx'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
  permissions: ['storage', 'activeTab', 'scripting', 'tabs'],
  host_permissions: ['http://*/*', 'https://*/*'],
  web_accessible_resources: [
    {
      resources: ['icons/*', 'dashboard.html'],
      matches: ['http://*/*', 'https://*/*'],
    },
  ],
  options_ui: {
    page: 'index.html#/options',
    open_in_tab: true,
  },
})
