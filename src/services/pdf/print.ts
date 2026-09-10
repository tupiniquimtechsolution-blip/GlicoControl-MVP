/** Impressão real via expo-print no aparelho; download .html no web preview. */
import { buildReportHtml, ReportInput } from './html'

export type PrintResult = { uri: string; kind: 'pdf' | 'html' }

export async function generateReportFile(input: ReportInput): Promise<PrintResult> {
  const html = buildReportHtml(input)
  const isWeb = typeof window !== 'undefined' && !!window.document
  if (!isWeb) {
    try {
      const Print = require('expo-print')
      const { uri } = await Print.printToFileAsync({ html, base64: false })
      return { uri, kind: 'pdf' }
    } catch {
      // sem módulo nativo disponível: segue p/ caminho html
    }
  }
  if (isWeb) {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `glicocontrol-relatorio-${input.monthLabel}.html`
    a.click()
    return { uri: url, kind: 'html' }
  }
  // fallback aparelho sem expo-print (não esperado): grava via expo-file-system seria mais um módulo;
  // devolvemos erro amigável tratado pela UI.
  throw new Error('print-unavailable')
}

export async function shareFile(uri: string, dialogTitle: string): Promise<void> {
  const Sharing = require('expo-sharing')
  if (!(await Sharing.isAvailableAsync())) throw new Error('sharing-unavailable')
  await Sharing.shareAsync(uri, { dialogTitle, mimeType: uri.endsWith('.html') ? 'text/html' : 'application/pdf' })
}
