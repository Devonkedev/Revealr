import { useState } from 'react'
import { PopupHeader } from './components/PopupHeader'
import { PopupHome } from './components/PopupHome'
import { SettingsPanel } from './components/SettingsPanel'
import { UnsupportedPage } from './components/UnsupportedPage'
import { useActiveTabState } from './hooks/useActiveTabState'
import { useSettings } from '@/hooks/useSettings'
import { sendMessage } from '@/services/messaging'

function isUnsupportedUrl(url: string | null): boolean {
  if (!url) return true
  return /^(chrome|chrome-extension|about|edge|devtools):/.test(url)
}

/** Root popup component. Also doubles as the standalone Options page when opened at `#/options`. */
export function Popup() {
  const isOptionsPage = window.location.hash.includes('options')
  const [view, setView] = useState<'home' | 'settings'>(isOptionsPage ? 'settings' : 'home')
  const { settings, update } = useSettings()
  const { url, tabState, loading, rescan, focusPattern, findExit } = useActiveTabState()

  if (isOptionsPage) {
    return (
      <div className="min-h-screen bg-cg-bg text-cg-text">
        <SettingsPanel standalone />
      </div>
    )
  }

  const unsupported = isUnsupportedUrl(url)

  return (
    <div className="flex min-h-[420px] w-[380px] flex-col bg-cg-bg text-cg-text">
      <PopupHeader
        enabled={settings.enabled}
        onToggleEnabled={(v) => update({ enabled: v })}
        onOpenSettings={() => setView((v) => (v === 'settings' ? 'home' : 'settings'))}
      />
      {view === 'settings' ? (
        <SettingsPanel onBack={() => setView('home')} />
      ) : unsupported ? (
        <UnsupportedPage />
      ) : (
        <PopupHome
          tabState={tabState}
          loading={loading}
          onRescan={rescan}
          onSelectPattern={focusPattern}
          onFindExit={findExit}
          onOpenDashboard={() => void sendMessage({ type: 'CG_OPEN_DASHBOARD' })}
        />
      )}
    </div>
  )
}
