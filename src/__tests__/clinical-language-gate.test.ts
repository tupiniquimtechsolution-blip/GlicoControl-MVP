/**
 * Gate de limites clínicos (§5/§11 do prompt mestre + AGENTS.md):
 * nenhum texto do app pode prescrever/ajustar/recomendar conduta. Varre strings literais
 * das fontes de UI/domínio. Falha = bloqueante.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(__dirname, '..', '..')
const DIRS = ['src/app', 'src/components', 'src/domain', 'src/features', 'src/services']
const FORBIDDEN: Array<{ name: string; re: RegExp }> = [
  { name: 'prescrição/receita', re: /\b(prescreva|prescri(?:ção|ções)|receita médica|posologia sugerida)\b/i },
  { name: 'cálculo/ajuste de dose', re: /\b(calcule|ajustar|aumente|reduza|diminua)\b[^.\n]{0,40}\b(dose|insulina|medicação|remédio|comprimido)/i },
  { name: 'suspensão de tratamento', re: /\b(suspenda|pare de tomar|interrompa o uso|descontinue)\b/i },
  { name: 'conselho emergencial/instrução clínica', re: /\b(procure (um )?(médico|emergência)|aplique insulina|tome [0-9]|vá ao hospital)\b/i },
  { name: 'diagnóstico/interpretação', re: /\b(hiperinsulinemia|hipo|hiperglicemia|diabetes|pré-diabetes|gestacional)\b/i },
]

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return walk(p)
    return /\.(tsx?|md)$/.test(e.name) ? [p] : []
  })
}

describe('gate clínico', () => {
  const files = DIRS.flatMap(walk)
  it(`varre ${files.length} arquivos-fonte`, () => {
    expect(files.length).toBeGreaterThan(30)
  })
  for (const rule of FORBIDDEN) {
    it(`nenhuma ocorrência de: ${rule.name}`, () => {
      const hits: string[] = []
      for (const f of files) {
        const text = fs.readFileSync(f, 'utf8')
        const lines = text.split('\n')
        lines.forEach((line, i) => {
          // ignora comentários de código (documentam a própria proibição)
          const code = line.trim()
          if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*')) return
          if (rule.re.test(line)) hits.push(`${path.relative(ROOT, f)}:${i + 1}: ${code.slice(0, 120)}`)
        })
      }
      expect(hits).toEqual([])
    })
  }
})
