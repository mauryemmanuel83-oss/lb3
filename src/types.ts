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
