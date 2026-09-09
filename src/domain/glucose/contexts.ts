/** Contextos/períodos de medição (§8 do prompt mestre). Estáveis: espelham o CHECK do banco. */
export const GLUCOSE_CONTEXTS = [
  'fasting',
  'before_breakfast',
  'after_breakfast',
  'before_lunch',
  'after_lunch',
  'before_dinner',
  'after_dinner',
  'before_bed',
  'midnight',
  'before_exercise',
  'after_exercise',
  'other',
] as const

export type GlucoseContext = (typeof GLUCOSE_CONTEXTS)[number]

export const CONTEXT_LABELS_PT: Record<GlucoseContext, string> = {
  fasting: 'Jejum',
  before_breakfast: 'Antes do café',
  after_breakfast: 'Depois do café',
  before_lunch: 'Antes do almoço',
  after_lunch: 'Depois do almoço',
  before_dinner: 'Antes do jantar',
  after_dinner: 'Depois do jantar',
  before_bed: 'Antes de dormir',
  midnight: 'Madrugada',
  before_exercise: 'Antes do exercício',
  after_exercise: 'Depois do exercício',
  other: 'Outro',
}

/** Ordem de agrupamento nos relatórios. */
export const CONTEXT_ORDER: GlucoseContext[] = [...GLUCOSE_CONTEXTS]

export function isGlucoseContext(v: unknown): v is GlucoseContext {
  return typeof v === 'string' && (GLUCOSE_CONTEXTS as readonly string[]).includes(v)
}
