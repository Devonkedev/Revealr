/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
