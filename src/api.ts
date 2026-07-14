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
  Discipline,
  UserRole,
  UserStats,
  RankingRow
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
  role: UserRole;
}

// El rol vive en profiles. Si aún no se corrió la migración 004, todos
// son 'user' (degradación grácil).
const fetchRole = async (userId: string): Promise<UserRole> => {
  const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single();
  if (error || !data?.role) return 'user';
  return data.role as UserRole;
};

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
  const id = data.user!.id;
  return { id, username, role: await fetchRole(id) };
};

export const signIn = async (username: string, password: string): Promise<SessionUser> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password
  });
  if (error) throw new Error(translateAuthError(error.message));
  const metaUsername = (data.user.user_metadata?.username as string) || username;
  return { id: data.user.id, username: metaUsername, role: await fetchRole(data.user.id) };
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
    username: (user.user_metadata?.username as string) || user.email?.split('@')[0] || 'escalador',
    role: await fetchRole(user.id)
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
  // Moderación (migración 004)
  official?: boolean;
  hidden?: boolean;
  banned?: boolean;
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
    myAscents,
    official: row.official ?? false,
    hidden: row.hidden ?? false,
    banned: row.banned ?? false
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

export const publishBeta = async (
  userId: string,
  input: NewBetaInput,
  role: UserRole = 'user'
): Promise<void> => {
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
  // Las betas del moderador (el gimnasio) nacen como rutas oficiales
  if (role === 'moderator' || role === 'admin') payload.official = true;

  const { error } = await supabase.from('betas').insert(payload);
  if (error) throw new Error(error.message);
};

// ─── Acciones de moderación (autorizadas por RLS según el rol) ──
// Nunca borran: conservan el historial marcando banderas.
type ModerationFlag = 'official' | 'hidden' | 'banned';

export const moderateBeta = async (
  moderatorId: string,
  betaId: string,
  flag: ModerationFlag,
  value: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('betas')
    .update({ [flag]: value, moderated_by: moderatorId, moderated_at: new Date().toISOString() })
    .eq('id', betaId);
  if (error) {
    if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
      throw new Error('Falta correr la migración 004 en Supabase (SQL Editor).');
    }
    throw new Error(error.message);
  }
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

// ─── Estadísticas y ranking (calculados en la base de datos) ──
// Vienen de las vistas user_stats y ranking (migración 005). Si aún no
// se corrió el SQL, devolvemos null y la UI usa el cálculo local.

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapStats = (r: any): UserStats => ({
  userId: r.user_id,
  username: r.username,
  role: (r.role as UserRole) || 'user',
  betaScore: r.beta_score ?? 0,
  betasCompleted: r.betas_completed ?? 0,
  flashCount: r.flash_count ?? 0,
  onsightCount: r.onsight_count ?? 0,
  redpointCount: r.redpoint_count ?? 0,
  leadCount: r.lead_count ?? 0,
  topRopeCount: r.top_rope_count ?? 0,
  maxBoulderIndex: r.max_boulder_index ?? -1,
  maxSportIndex: r.max_sport_index ?? -1,
  activeProjects: r.active_projects ?? 0,
  betasPublished: r.betas_published ?? 0,
  lastAscentAt: r.last_ascent_at ?? null
});

export const fetchUserStats = async (userId: string): Promise<UserStats | null> => {
  const { data, error } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
  if (error || !data) return null; // vista aún no creada → la UI calcula localmente
  return mapStats(data);
};

export const fetchRanking = async (): Promise<RankingRow[] | null> => {
  const { data, error } = await supabase.from('ranking').select('*').order('position', { ascending: true });
  if (error || !data) return null;
  // La vista ya excluye moderadores y ya viene ordenada con desempates
  return data.map((r: any) => ({ ...mapStats(r), role: 'user' as UserRole, position: r.position }));
};
