import { Ascent, AscentResult, AscentType, Discipline } from '../types';
import { BOULDER_GRADES, SPORT_GRADES } from '../data';

export interface ResultOption {
  key: AscentResult;
  label: string;
  icon: string; // material symbol
  isSend: boolean; // ¿cuenta como encadene/envío?
}

// Opciones de resultado según la disciplina. Nunca se mezclan.
export const BOULDER_RESULTS: ResultOption[] = [
  { key: 'flash', label: 'Flash', icon: 'bolt', isSend: true },
  { key: 'onsight', label: 'Onsight', icon: 'visibility', isSend: true },
  { key: 'al_ojo', label: 'Al ojo', icon: 'target', isSend: true },
  { key: 'completed', label: 'Completada', icon: 'check_circle', isSend: true },
  { key: 'project', label: 'Proyecto', icon: 'construction', isSend: false }
];

export const SPORT_RESULTS: ResultOption[] = [
  { key: 'flash', label: 'Flash', icon: 'bolt', isSend: true },
  { key: 'onsight', label: 'Onsight', icon: 'visibility', isSend: true },
  { key: 'redpoint', label: 'Redpoint', icon: 'target', isSend: true },
  { key: 'attempt', label: 'Intento', icon: 'trending_up', isSend: false },
  { key: 'project', label: 'Proyecto', icon: 'construction', isSend: false }
];

export const ASCENT_TYPES: { key: AscentType; label: string; icon: string }[] = [
  { key: 'top_rope', label: 'Top Rope', icon: 'vertical_align_top' },
  { key: 'lead', label: 'Lead', icon: 'moving' }
];

export const resultsForDiscipline = (d: Discipline): ResultOption[] =>
  d === 'boulder' ? BOULDER_RESULTS : SPORT_RESULTS;

const ALL_RESULTS = [...BOULDER_RESULTS, ...SPORT_RESULTS];

export const resultLabel = (result: AscentResult): string =>
  ALL_RESULTS.find((r) => r.key === result)?.label || result;

export const resultIcon = (result: AscentResult): string =>
  ALL_RESULTS.find((r) => r.key === result)?.icon || 'sports_score';

export const isSendResult = (result: AscentResult): boolean =>
  ALL_RESULTS.find((r) => r.key === result)?.isSend ?? false;

export const typeLabel = (t: AscentType | null): string =>
  t ? ASCENT_TYPES.find((x) => x.key === t)?.label || t : '';

// Índice de dificultad del grado (mayor = más difícil). -1 si no se reconoce.
const gradeIndex = (grade: string, discipline: Discipline): number =>
  (discipline === 'boulder' ? BOULDER_GRADES : SPORT_GRADES).indexOf(grade);

// ─── Estadísticas por disciplina desde los ascensos ─────────
export interface DisciplineStats {
  hasAny: boolean;
  maxGrade: string | null;
  sends: number; // betas distintas encadenadas
  flash: number; // betas distintas en flash
  projects: number; // betas distintas en proyecto (sin encadenar aún)
  // solo deportiva:
  redpoints: number;
  lead: number;
  topRope: number;
}

const emptyStats = (): DisciplineStats => ({
  hasAny: false,
  maxGrade: null,
  sends: 0,
  flash: 0,
  projects: 0,
  redpoints: 0,
  lead: 0,
  topRope: 0
});

const countDistinctBetas = (rows: { betaId: string }[]): number =>
  new Set(rows.map((r) => r.betaId)).size;

// Recibe pares (ascent + betaId) porque un ascenso pertenece a una beta.
export interface AscentWithBeta extends Ascent {
  betaId: string;
}

export const computeDisciplineStats = (ascents: AscentWithBeta[], discipline: Discipline): DisciplineStats => {
  const rows = ascents.filter((a) => a.discipline === discipline);
  if (rows.length === 0) return emptyStats();

  const sends = rows.filter((a) => isSendResult(a.result));
  const sentBetaIds = new Set(sends.map((a) => a.betaId));

  // máximo grado entre los envíos
  let maxGrade: string | null = null;
  let maxIdx = -1;
  for (const a of sends) {
    const idx = gradeIndex(a.grade, discipline);
    if (idx > maxIdx) {
      maxIdx = idx;
      maxGrade = a.grade;
    }
  }

  // proyectos: betas con intento/proyecto pero sin ningún envío
  const projectBetaIds = new Set(
    rows.filter((a) => !isSendResult(a.result)).map((a) => a.betaId)
  );
  for (const id of sentBetaIds) projectBetaIds.delete(id);

  return {
    hasAny: true,
    maxGrade,
    sends: sentBetaIds.size,
    flash: countDistinctBetas(rows.filter((a) => a.result === 'flash')),
    projects: projectBetaIds.size,
    redpoints: countDistinctBetas(rows.filter((a) => a.result === 'redpoint')),
    lead: countDistinctBetas(sends.filter((a) => a.ascentType === 'lead')),
    topRope: countDistinctBetas(sends.filter((a) => a.ascentType === 'top_rope'))
  };
};
