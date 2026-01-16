/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_SHOW_COMING_SOON: string
  readonly VITE_APP_COMING_SOON_MESSAGE: string
  readonly VITE_APP_BACKGROUND_COLOR: string
  readonly VITE_APP_TEXT_COLOR: string
  readonly VITE_KCC_RPC_URL: string
  readonly VITE_KCC_EXPLORER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
