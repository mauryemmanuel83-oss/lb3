import { Wall, Beta, ActivityMatrixDay, WallType } from './types';

// ─── Sistemas de graduación ──────────────────────────────────
// Boulder usa escala V (Hueco). Deportiva usa escala francesa.
// Nunca se mezclan: el tipo de muro decide cuál se muestra.
export const BOULDER_GRADES = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9'];

export const SPORT_GRADES = [
  '5a', '5b', '5c',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a'
];

export const gradesForWallType = (type: WallType): string[] =>
  type === 'boulder' ? BOULDER_GRADES : SPORT_GRADES;

// ─── Muros reales del gimnasio (fotos en /public/walls) ──────
export const INITIAL_WALLS: Wall[] = [
  {
    id: 'zona-1-adentro',
    name: 'Zona 1 · Adentro',
    type: 'boulder',
    angle: '35°',
    description: 'Desplome interior con presas grandes y romos. Bloques físicos de resistencia.',
    imageUrl: '/walls/zona-1-adentro-boulder.jpg'
  },
  {
    id: 'zona-1-afuera',
    name: 'Zona 1 · Afuera',
    type: 'boulder',
    angle: '20°',
    description: 'Sección exterior con techo corto y volúmenes triangulares. Coordinación y bloqueos.',
    imageUrl: '/walls/zona-1-afuera-boulder.jpg'
  },
  {
    id: 'zona-2-afuera',
    name: 'Zona 2 · Afuera',
    type: 'boulder',
    angle: '15°',
    description: 'Muro exterior de inclinación media. Lecturas técnicas y cambios de ritmo.',
    imageUrl: '/walls/zona-2-afuera-boulder.jpg'
  },
  {
    id: 'zona-3-afuera',
    name: 'Zona 3 · Afuera',
    type: 'boulder',
    angle: '10°',
    description: 'Placa exterior de ángulo suave. Ideal para pulir pies y equilibrio.',
    imageUrl: '/walls/zona-3-afuera-boulder.jpg'
  },
  {
    id: 'deportivo',
    name: 'Muro Deportivo',
    type: 'deportiva',
    angle: '90°',
    description: 'Vías con cuerda de hasta 12 m. Vertical y ligeros desplomes, resistencia pura.',
    imageUrl: '/walls/deportivo.jpg'
  }
];


// ─── Matriz de consistencia calculada desde betas REALES ────
// Últimos 105 días; cada día cuenta las betas publicadas ese día.
export const buildActivityMatrix = (myBetas: Beta[]): ActivityMatrixDay[] => {
  const countsByDate = new Map<string, number>();
  for (const beta of myBetas) {
    const dateStr = beta.createdAtISO.split('T')[0];
    countsByDate.set(dateStr, (countsByDate.get(dateStr) || 0) + 1);
  }

  const days: ActivityMatrixDay[] = [];
  const now = new Date();
  for (let i = 105; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, count: Math.min(countsByDate.get(dateStr) || 0, 4) });
  }
  return days;
};
