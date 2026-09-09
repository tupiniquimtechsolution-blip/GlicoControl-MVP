import { useEffect } from 'react'
import { useApp } from '../../services/appContext'

/** utilitário: telas chamam para recarregar em toda mudança local (revision bump) */
export function useScreenRefresh(cb: () => void, deps: unknown[] = []) {
  const app = useApp()
  useEffect(cb, [app.revision, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps
}
