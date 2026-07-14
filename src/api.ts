import { supabase } from './lib/supabase';
import {
  Beta,
  Comment,
  Marker,
  Stroke,
  TextLabel,
  BetaStatus,
  ReportReason,
  Ascent,
  AscentResult,
  AscentType,
  Discipline
} from './types';

// Umbral de consenso: cuántos usuarios distintos deben reportar el mismo
// cambio para que la beta cambie de estado sola. Debe coincidir con el
// `threshold` del trigger en supabase/migrations/002_beta_lifecycle.sql.
export const REPORT_THRESHOLD = 3;

// Los usuarios entran con nombre de usuario; Supabase Auth exige email,
// así que sintetizamos uno estable a partir del username.
const usernameToEmail = (username: string) => `${username.toLowerCase()}@escaladores.labeta.app`;

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// ─── Fechas relativas en español ─────────────────────────────
export const timeAgo = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
};

// ─── Autenticación ───────────────────────────────────────────
export interface SessionUser {
  id: string;
  username: string;
}

const translateAuthError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Usuario o contraseña incorrectos';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ese usuario ya existe. Prueba con otro o inicia sesión.';
  if (m.includes('at least 6 characters')) return 'La contraseña debe tener al menos 6 caracteres';
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
  if (m.includes('fetch')) return 'Sin conexión con el servidor. Revisa tu internet.';
  return message;
};

export const signUp = async (username: string, password: string): Promise<SessionUser> => {
  const { data, error } = await supabase.auth.signUp({
    email: usernameToEmail(username),
    password,
    options: { data: { username } }
  });
  if (error) throw new Error(translateAuthError(error.message));
  if (!data.session) {
    throw new Error(
      'La cuenta se creó pero falta desactivar la confirmación por email en Supabase (Authentication → Sign In / Providers → Email → apagar "Confirm email").'
    );
  }
  return { id: data.user!.id, username };
};

export const signIn = async (username: string, password: string): Promise<SessionUser> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password
  });
  if (error) throw new Error(translateAuthError(error.message));
  const metaUsername = (data.user.user_metadata?.username as string) || username;
  return { id: data.user.id, username: metaUsername };
};

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<SessionUser | null> => {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return {
    id: user.id,
    username: (user.user_metadata?.username as string) || user.email?.split('@')[0] || 'escalador'
  };
};

// ─── Betas ───────────────────────────────────────────────────
interface BetaRow {
  id: string;
  author_id: string;
  name: string;
  grade: string;
  wall_id: string;
  hold_color: string;
  styles: string[];
  notes: string;
  image_data: string;
  markers: Marker[];
  strokes: Stroke[];
  texts: TextLabel[];
  active_project: boolean;
  created_at: string;
  // Columnas de ciclo de vida (pueden faltar si aún no se corrió la migración 002)
  status?: string;
  version?: number;
  replaced_by?: string | null;
  replaces?: string | null;
  profiles: { username: string } | null;
  comments: {
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    profiles: { username: string } | null;
  }[];
  recommendations: { user_id: string }[];
}

interface ReportRow {
  beta_id: string;
  user_id: string;
  reason: ReportReason;
}

interface AscentRow {
  id: string;
  beta_id: string;
  user_id: string;
  discipline: Discipline;
  ascent_type: AscentType | null;
  result: AscentResult;
  grade: string;
  notes: string;
  created_at: string;
}

const rowToAscent = (row: AscentRow): Ascent => ({
  id: row.id,
  discipline: row.discipline,
  result: row.result,
  ascentType: row.ascent_type,
  grade: row.grade || '',
  notes: row.notes || '',
  createdAt: timeAgo(row.created_at)
});

const rowToBeta = (
  row: BetaRow,
  currentUserId: string | null,
  reports: ReportRow[],
  myAscentRows: AscentRow[]
): Beta => {
  const myReports = reports.filter((r) => r.beta_id === row.id);
  const myAscents = myAscentRows
    .filter((a) => a.beta_id === row.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(rowToAscent);
  return {
    id: row.id,
    authorId: row.author_id,
    name: row.name,
    grade: row.grade,
    wallId: row.wall_id,
    holdColor: row.hold_color,
    styles: row.styles || [],
    notes: row.notes || '',
    imageUrl: row.image_data,
    markers: row.markers || [],
    strokes: row.strokes || [],
    texts: row.texts || [],
    activeProject: row.active_project,
    createdAt: timeAgo(row.created_at),
    createdAtISO: row.created_at,
    author: row.profiles?.username || 'escalador',
    comments: (row.comments || [])
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(
        (c): Comment => ({
          id: c.id,
          author: c.profiles?.username || 'escalador',
          text: c.text,
          createdAt: timeAgo(c.created_at)
        })
      ),
    recommendations: (row.recommendations || []).length,
    recommendedByMe: currentUserId ? (row.recommendations || []).some((r) => r.user_id === currentUserId) : false,
    status: (row.status as BetaStatus) || 'active',
    version: row.version || 1,
    replacedById: row.replaced_by || null,
    replacesId: row.replaces || null,
    reportsHolds: myReports.filter((r) => r.reason === 'holds_changed').length,
    reportsRemoved: myReports.filter((r) => r.reason === 'removed').length,
    myReport: currentUserId ? myReports.find((r) => r.user_id === currentUserId)?.reason || null : null,
    myAscents
  };
};

const BETA_SELECT = `*,
  profiles:author_id (username),
  comments (id, text, created_at, author_id, profiles:author_id (username)),
  recommendations (user_id)`;

export const fetchBetas = async (currentUserId: string | null): Promise<Beta[]> => {
  const { data, error } = await supabase
    .from('betas')
    .select(BETA_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  // Los reportes viven en su propia tabla. Antes de correr la migración 002
  // esa tabla no existe: en ese caso seguimos sin reportes (degradación grácil).
  let reports: ReportRow[] = [];
  const reportRes = await supabase.from('beta_reports').select('beta_id, user_id, reason');
  if (!reportRes.error && reportRes.data) {
    reports = reportRes.data as ReportRow[];
  }

  // Mis ascensos (para estadísticas y para mostrar mi registro en cada beta).
  // Antes de la migración 003 la tabla no existe → seguimos sin ascensos.
  let myAscentRows: AscentRow[] = [];
  if (currentUserId) {
    const ascentRes = await supabase.from('ascents').select('*').eq('user_id', currentUserId);
    if (!ascentRes.error && ascentRes.data) {
      myAscentRows = ascentRes.data as AscentRow[];
    }
  }

  return (data as unknown as BetaRow[]).map((row) => rowToBeta(row, currentUserId, reports, myAscentRows));
};

export interface NewBetaInput {
  name: string;
  grade: string;
  wallId: string;
  holdColor: string;
  styles: string[];
  notes: string;
  imageData: string;
  markers: Marker[];
  strokes: Stroke[];
  texts: TextLabel[];
  replacesBetaId?: string | null; // si es una versión actualizada de otra beta
}

export const publishBeta = async (userId: string, input: NewBetaInput): Promise<void> => {
  const payload: Record<string, unknown> = {
    author_id: userId,
    name: input.name,
    grade: input.grade,
    wall_id: input.wallId,
    hold_color: input.holdColor,
    styles: input.styles,
    notes: input.notes,
    image_data: input.imageData,
    markers: input.markers,
    strokes: input.strokes,
    texts: input.texts
  };
  if (input.replacesBetaId) payload.replaces = input.replacesBetaId;

  const { error } = await supabase.from('betas').insert(payload);
  if (error) throw new Error(error.message);
};

// ─── Reportes de cambio de presas / ruta removida ────────────
export const reportBeta = async (userId: string, betaId: string, reason: ReportReason): Promise<void> => {
  const { error } = await supabase
    .from('beta_reports')
    .upsert({ beta_id: betaId, user_id: userId, reason }, { onConflict: 'beta_id,user_id' });
  if (error) {
    if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
      throw new Error('Falta correr la migración 002 en Supabase (SQL Editor).');
    }
    throw new Error(error.message);
  }
};

export const unreportBeta = async (userId: string, betaId: string): Promise<void> => {
  const { error } = await supabase.from('beta_reports').delete().eq('beta_id', betaId).eq('user_id', userId);
  if (error) throw new Error(error.message);
};

// ─── Ascensos ────────────────────────────────────────────────
export interface NewAscentInput {
  betaId: string;
  discipline: Discipline;
  result: AscentResult;
  ascentType: AscentType | null; // solo deportiva
  grade: string;
  notes: string;
}

export const logAscent = async (userId: string, input: NewAscentInput): Promise<void> => {
  const { error } = await supabase.from('ascents').insert({
    beta_id: input.betaId,
    user_id: userId,
    discipline: input.discipline,
    ascent_type: input.ascentType,
    result: input.result,
    grade: input.grade,
    notes: input.notes
  });
  if (error) {
    if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
      throw new Error('Falta correr la migración 003 en Supabase (SQL Editor).');
    }
    throw new Error(error.message);
  }
};

export const deleteAscent = async (ascentId: string): Promise<void> => {
  const { error } = await supabase.from('ascents').delete().eq('id', ascentId);
  if (error) throw new Error(error.message);
};

export const deleteBeta = async (betaId: string): Promise<void> => {
  const { error } = await supabase.from('betas').delete().eq('id', betaId);
  if (error) throw new Error(error.message);
};

// ─── Comentarios y recomendaciones ───────────────────────────
export const addComment = async (userId: string, betaId: string, text: string): Promise<void> => {
  const { error } = await supabase.from('comments').insert({ beta_id: betaId, author_id: userId, text });
  if (error) throw new Error(error.message);
};

export const setRecommendation = async (userId: string, betaId: string, recommend: boolean): Promise<void> => {
  if (recommend) {
    const { error } = await supabase.from('recommendations').insert({ beta_id: betaId, user_id: userId });
    if (error && !error.message.includes('duplicate')) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('recommendations').delete().eq('beta_id', betaId).eq('user_id', userId);
    if (error) throw new Error(error.message);
  }
};

// ─── Ranking del gym ─────────────────────────────────────────
export interface RankingEntry {
  userId: string;
  username: string;
  betasCount: number;
  recsReceived: number;
  score: number;
}

export const fetchRanking = async (): Promise<RankingEntry[]> => {
  const [profilesRes, betasRes, recsRes] = await Promise.all([
    supabase.from('profiles').select('id, username'),
    supabase.from('betas').select('id, author_id'),
    supabase.from('recommendations').select('beta_id')
  ]);
  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (betasRes.error) throw new Error(betasRes.error.message);
  if (recsRes.error) throw new Error(recsRes.error.message);

  const betaAuthor = new Map<string, string>();
  const betasCount = new Map<string, number>();
  for (const b of betasRes.data) {
    betaAuthor.set(b.id, b.author_id);
    betasCount.set(b.author_id, (betasCount.get(b.author_id) || 0) + 1);
  }

  const recsReceived = new Map<string, number>();
  for (const r of recsRes.data) {
    const author = betaAuthor.get(r.beta_id);
    if (author) recsReceived.set(author, (recsReceived.get(author) || 0) + 1);
  }

  return profilesRes.data
    .map((p) => {
      const betas = betasCount.get(p.id) || 0;
      const recs = recsReceived.get(p.id) || 0;
      return {
        userId: p.id,
        username: p.username,
        betasCount: betas,
        recsReceived: recs,
        score: betas * 150 + recs * 25
      };
    })
    .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));
};
