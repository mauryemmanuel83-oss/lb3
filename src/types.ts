export type WallType = 'boulder' | 'deportiva';

export type MarkerType = 'START' | 'TOP' | 'SEQ';

export type EditorTool = 'PEN' | 'ARROW' | 'START' | 'TOP' | 'SEQ' | 'TEXT';

// Coordenadas siempre en porcentaje (0-100) relativas a la foto,
// para que el dibujo escale idéntico en cualquier pantalla.
export interface Point {
  x: number;
  y: number;
}

export interface Marker {
  id: string;
  x: number;
  y: number;
  type: MarkerType;
  label?: string; // "1", "2"... para secuencias
}

export interface Stroke {
  id: string;
  tool: 'PEN' | 'ARROW';
  color: string;
  points: Point[]; // PEN: polilínea libre. ARROW: [origen, destino]
}

export interface TextLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

// Ciclo de vida de una beta según el consenso de la comunidad
export type BetaStatus = 'active' | 'holds_changed' | 'removed';

// Motivo de un reporte de cambio
export type ReportReason = 'holds_changed' | 'removed';

// ─── Ascensos ────────────────────────────────────────────────
export type Discipline = 'boulder' | 'deportiva';
export type AscentType = 'top_rope' | 'lead'; // solo deportiva

// boulder: flash | onsight | al_ojo | completed | project
// deportiva: flash | onsight | redpoint | attempt | project
export type AscentResult =
  | 'flash'
  | 'onsight'
  | 'al_ojo'
  | 'completed'
  | 'project'
  | 'redpoint'
  | 'attempt';

export interface Ascent {
  id: string;
  discipline: Discipline;
  result: AscentResult;
  ascentType: AscentType | null;
  grade: string; // snapshot del grado al registrarse
  notes: string;
  createdAt: string;
}

export interface Beta {
  id: string;
  name: string;
  grade: string; // V0-V9 (boulder) o 5a-8a (deportiva) según el muro
  styles: string[];
  holdColor: string;
  notes: string;
  imageUrl: string; // foto tomada por el usuario (dataURL)
  markers: Marker[];
  strokes: Stroke[];
  texts: TextLabel[];
  createdAt: string; // texto relativo: "Hace 2 días"
  createdAtISO: string; // timestamp real para cálculos
  wallId: string;
  author: string; // username del autor
  authorId: string; // uuid del autor en Supabase
  activeProject?: boolean;
  comments: Comment[];
  recommendations: number;
  recommendedByMe?: boolean;
  // Ciclo de vida y versionado
  status: BetaStatus;
  version: number;
  replacedById: string | null; // id de la beta más nueva que la reemplaza
  replacesId: string | null; // id de la beta anterior que esta reemplaza
  reportsHolds: number; // reportes de "presas cambiadas"
  reportsRemoved: number; // reportes de "ruta removida"
  myReport: ReportReason | null; // qué reportó el usuario actual (si acaso)
  // Ascensos del usuario actual sobre esta beta (más recientes primero)
  myAscents: Ascent[];
}

export interface Wall {
  id: string;
  name: string;
  type: WallType;
  angle: string;
  description: string;
  imageUrl: string; // foto real del muro (solo para identificarlo)
}

// Stats calculadas desde datos reales (nada inventado)
export interface ClimberStats {
  globalBetaScore: number;
  betasPublished: number;
  activeProjects: number;
  recsReceived: number;
  level: number;
}

export interface ActivityMatrixDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export type MascotState = 'idle' | 'loading' | 'publishing' | 'success' | 'error' | 'empty';

export type Tab = 'home' | 'explore' | 'build' | 'dashboard';
