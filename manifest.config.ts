import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

/**
 * Manifest V3 definition for ChoiceGuard.
 * Built with @crxjs/vite-plugin so all referenced entry points
 * (background, content script, popup) are bundled by Vite/Rollup.
 */
export default defineManifest({
  manifest_version: 3,
  name: 'ChoiceGuard — Dark Pattern Detector',
  short_name: 'ChoiceGuard',
  description:
    'Detects manipulative UX ("dark patterns") in real time — fake urgency, confirmshaming, hidden cancel links, and more — and explains why they work.',
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
