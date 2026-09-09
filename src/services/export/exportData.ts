/** Exportação de dados do titular (LGPD art. 18 II): JSON completo do espelho local + metadados. */
import { Db, Row } from '../db/types'

export type ExportPayload = {
  gerado_em: string
  app: 'GlicoControl'
  versao: string
  dados: Record<string, Row[]>
}

export async function buildExportPayload(db: Db, profile: Row | null): Promise<ExportPayload> {
  const tables = ['glucose_measurements', 'reminders', 'medications', 'medication_schedules', 'medication_logs', 'glucose_targets'] as const
  const dados: Record<string, Row[]> = { profile: profile ? [profile] : [] }
  for (const t of tables) dados[t] = await db.select(t, { where: [{ col: 'deleted_at', op: 'isNull' }] })
  return { gerado_em: new Date().toISOString(), app: 'GlicoControl', versao: '0.1.0', dados }
}

export async function exportToFile(payload: ExportPayload): Promise<string> {
  const isWeb = typeof window !== 'undefined' && !!window.document
  const text = JSON.stringify(payload, null, 2)
  if (isWeb) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'glicocontrol-exportacao.json'
    a.click()
    return url
  }
  const FS = require('expo-file-system/legacy') as typeof import('expo-file-system/legacy')
  const uri = `${FS.cacheDirectory}glicocontrol-exportacao.json`
  await FS.writeAsStringAsync(uri, text, { encoding: 'utf8' } as never)
  return uri
}
