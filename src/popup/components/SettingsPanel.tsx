import { useEffect, useState } from 'react'
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react'
import { Toggle } from '@/components'
import { useSettings } from '@/hooks/useSettings'

interface SettingsPanelProps {
  onBack?: () => void
  standalone?: boolean
}

/** Settings form shared by the popup's Settings view and the standalone extension Options page. */
export function SettingsPanel({ onBack, standalone }: SettingsPanelProps) {
  const { settings, update } = useSettings()
  const [apiKeyDraft, setApiKeyDraft] = useState(settings.openaiApiKey)

  useEffect(() => {
    setApiKeyDraft(settings.openaiApiKey)
  }, [settings.openaiApiKey])

  return (
    <div className={standalone ? 'mx-auto max-w-md px-6 py-10' : 'px-4 py-4'}>
      {onBack && (
        <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-xs font-medium text-cg-muted hover:text-cg-text">
          <ArrowLeft size={13} /> Back
        </button>
      )}

      <div className="flex flex-col gap-4">
        <Toggle
          checked={settings.showFloatingBadge}
          onChange={(v) => update({ showFloatingBadge: v })}
          label="Floating badge"
          description="Show the ChoiceGuard button on every page"
        />
        <Toggle
          checked={settings.autoExtractDetails}
          onChange={(v) => update({ autoExtractDetails: v })}
          label="Auto-extract details"
          description="Send a commitment's fine print to AI as soon as it's found, instead of only when you open it"
        />
        <Toggle
          checked={settings.registryOptIn}
          onChange={(v) => update({ registryOptIn: v })}
          label="Contribute to Registry"
          description="Anonymously share domain + commitment types found with the demo dashboard"
        />

        <div className="border-t border-cg-border pt-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-cg-muted" htmlFor="cg-openai-key">
            <KeyRound size={12} /> OpenAI API Key
          </label>
          <input
            id="cg-openai-key"
            type="password"
            value={apiKeyDraft}
            onChange={(e) => setApiKeyDraft(e.target.value)}
            onBlur={() => update({ openaiApiKey: apiKeyDraft })}
            placeholder="sk-…"
            className="w-full rounded-lg border border-cg-border bg-cg-surface-2 px-3 py-2 text-xs text-cg-text outline-none focus:border-cg-accent"
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-cg-muted">
            Stored locally in chrome.storage.local — never synced or sent anywhere except directly to OpenAI. Leave blank to use the
            locally-extracted summary instead of AI-enriched details.
          </p>
        </div>

        <div className="flex gap-2.5 rounded-xl bg-cg-surface-2/50 p-3">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-cg-good" />
          <p className="text-[11px] leading-relaxed text-cg-muted">
            Detection runs entirely on your device — full pages are never uploaded anywhere. Only a small snippet of the specific text you
            open is ever sent to AI, and only when detail extraction happens.
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-[10px] text-cg-muted">ChoiceGuard v1.0.0 · Built for the hackathon demo</p>
    </div>
  )
}
