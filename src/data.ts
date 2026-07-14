import { Wall, Beta, ClimberStats, ActivityMatrixDay, WallType } from './types';

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

// ─── Betas de ejemplo de la comunidad ────────────────────────
export const INITIAL_BETAS: Beta[] = [
  {
    id: 'pink-menace',
    name: 'The Pink Menace',
    grade: 'V5',
    styles: ['CRIMP', 'OVERHANG'],
    holdColor: '#ec4899',
    notes: 'El crux es juntar manos en la tercera regleta muy fina. Asegura pies altos y un dropknee técnico con la derecha para estabilizar el centro de gravedad.',
    imageUrl: '/walls/zona-1-adentro-boulder.jpg',
    markers: [
      { id: '1', x: 62, y: 78, type: 'START' },
      { id: '2', x: 58, y: 60, type: 'SEQ', label: '1' },
      { id: '3', x: 52, y: 45, type: 'SEQ', label: '2' },
      { id: '4', x: 46, y: 32, type: 'SEQ', label: '3' },
      { id: '5', x: 40, y: 18, type: 'TOP' }
    ],
    strokes: [
      {
        id: 's1',
        tool: 'ARROW',
        color: '#facc15',
        points: [{ x: 60, y: 74 }, { x: 56, y: 63 }]
      }
    ],
    texts: [],
    createdAt: 'Hace 2 días',
    wallId: 'zona-1-adentro',
    author: 'mauryemmanuel83',
    comments: [
      {
        id: 'c1',
        author: 'anka.climbs',
        text: 'El dropknee me salvó, buena beta. Yo llego a la regleta con la izquierda primero.',
        createdAt: 'Hace 1 día'
      }
    ],
    recommendations: 7
  },
  {
    id: 'yellow-dyno',
    name: 'Yellow Dyno',
    grade: 'V7',
    styles: ['DYNAMIC', 'VOLUME', 'JUG'],
    holdColor: '#eab308',
    notes: 'Lance coordinado explosivo hacia el volumen romo superior. Mantén la tensión del core activa y balancea las piernas para controlar el péndulo.',
    imageUrl: '/walls/zona-1-afuera-boulder.jpg',
    markers: [
      { id: '1', x: 30, y: 80, type: 'START' },
      { id: '2', x: 38, y: 55, type: 'SEQ', label: '1' },
      { id: '3', x: 52, y: 25, type: 'TOP' }
    ],
    strokes: [],
    texts: [],
    createdAt: 'Hace 5 días',
    wallId: 'zona-1-afuera',
    author: 'mauryemmanuel83',
    comments: [],
    recommendations: 12
  },
  {
    id: 'resistencia-6b',
    name: 'Vía de la Grieta',
    grade: '6b+',
    styles: ['ENDURANCE', 'CRIMP'],
    holdColor: '#3b82f6',
    notes: 'Vía continua sin reposos claros hasta la mitad. Administra el pump: chapea rápido en la 3ra y descansa en la repisa antes del techo final.',
    imageUrl: '/walls/deportivo.jpg',
    markers: [
      { id: '1', x: 40, y: 88, type: 'START' },
      { id: '2', x: 42, y: 60, type: 'SEQ', label: '1' },
      { id: '3', x: 45, y: 35, type: 'SEQ', label: '2' },
      { id: '4', x: 47, y: 12, type: 'TOP' }
    ],
    strokes: [],
    texts: [],
    createdAt: 'Proyecto Activo',
    wallId: 'deportivo',
    author: 'mauryemmanuel83',
    activeProject: true,
    comments: [
      {
        id: 'c2',
        author: 'lena_v',
        text: 'Ese reposo en la repisa es clave, gracias!',
        createdAt: 'Hace 3 horas'
      }
    ],
    recommendations: 4
  }
];

export const INITIAL_STATS: ClimberStats = {
  globalBetaScore: 4092,
  sendsThisWeek: 24,
  activeProjects: 3,
  flashesCount: 12,
  level: 42,
  title: 'Climber',
  sector: 'Pirqa Lima'
};

// Genera fechas para la matriz de consistencia
export const generateActivityMatrix = (): ActivityMatrixDay[] => {
  const days: ActivityMatrixDay[] = [];
  const now = new Date();

  // 15 semanas * 7 días de actividad (últimos 105 días)
  for (let i = 105; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Actividad pseudo-aleatoria favoreciendo findes y miércoles
    const dayOfWeek = d.getDay();
    let count = 0;
    const rand = Math.random();

    if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 3) {
      if (rand > 0.8) count = 4;
      else if (rand > 0.5) count = 3;
      else if (rand > 0.2) count = 2;
    } else {
      if (rand > 0.9) count = 2;
      else if (rand > 0.75) count = 1;
    }

    days.push({ date: dateStr, count });
  }

  return days;
};
