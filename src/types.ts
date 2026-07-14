export type MarkerType = 'START' | 'TOP' | 'SEQ' | 'ARROW';

export interface Marker {
  id: string;
  x: number; // percentage from left (0 - 100)
  y: number; // percentage from top (0 - 100)
  type: MarkerType;
  label?: string; // e.g. "1", "2" for sequences
}

export interface Beta {
  id: string;
  name: string;
  grade: string; // V0, V1, V2, V3, etc.
  styles: string[]; // CRIMP, JUG, SLOPER, DYNAMIC, PINCH, OVERHANG, STEMMING, etc.
  holdColor: string; // red, blue, yellow, green, purple
  notes: string;
  imageUrl: string;
  markers: Marker[];
  createdAt: string; // "2 days ago", "5 days ago", "today", etc.
  sectorId: string;
  author: string;
  activeProject?: boolean;
}

export interface Sector {
  id: string;
  name: string;
  angle: string; // "45°", "0°", "15°", etc.
  description: string;
  imageUrl: string;
}

export interface ClimberStats {
  globalBetaScore: number;
  sendsThisWeek: number;
  activeProjects: number;
  flashesCount: number;
  level: number;
  title: string;
  sector: string;
}

export interface ActivityMatrixDay {
  date: string; // YYYY-MM-DD
  count: number; // 0 to 4+ sessions/sends
}
