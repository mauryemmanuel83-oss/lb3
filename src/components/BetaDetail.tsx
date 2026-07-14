import React, { useState } from 'react';
import { Beta, Wall, ReportReason, AscentResult, AscentType } from '../types';
import { BetaOverlay } from './BetaOverlay';
import { STATUS_META } from '../lib/betaStatus';
import { resultsForDiscipline, ASCENT_TYPES, resultLabel, resultIcon, typeLabel } from '../lib/ascents';
import { REPORT_THRESHOLD, NewAscentInput } from '../api';

interface BetaDetailProps {
  beta: Beta;
  walls: Wall[];
  username: string;
  hasReplacement: boolean; // ¿existe la beta que la reemplaza?
  onClose: () => void;
  onDelete?: (betaId: string) => void;
  onAddComment: (betaId: string, text: string) => void;
  onToggleRecommend: (betaId: string) => void;
  onReport: (betaId: string, reason: ReportReason) => void;
  onUnreport: (betaId: string) => void;
  onOpenReplacement: (betaId: string) => void;
  onCreateUpdatedVersion: (beta: Beta) => void;
  onLogAscent: (input: NewAscentInput) => void;
  onDeleteAscent: (ascentId: string) => void;
}

export const BetaDetail: React.FC<BetaDetailProps> = ({
  beta,
  walls,
  username,
  hasReplacement,
  onClose,
  onDelete,
  onAddComment,
  onToggleRecommend,
  onReport,
  onUnreport,
  onOpenReplacement,
  onCreateUpdatedVersion,
  onLogAscent,
  onDeleteAscent
}) => {
  const wall = walls.find((w) => w.id === beta.wallId);
  const discipline = wall?.type || 'boulder';
  const [commentText, setCommentText] = useState('');

  // Estado del formulario de ascenso
  const [ascentResult, setAscentResult] = useState<AscentResult | null>(null);
  const [ascentType, setAscentType] = useState<AscentType>('lead');
  const [ascentNotes, setAscentNotes] = useState('');
  const [showAscentForm, setShowAscentForm] = useState(false);

  const status = STATUS_META[beta.status];
  const isStale = beta.status !== 'active';
  // Progreso hacia el consenso (el mayor de los dos motivos)
  const reportCount = Math.max(beta.reportsHolds, beta.reportsRemoved);

  const submitComment = () => {
    const clean = commentText.trim();
    if (!clean) return;
    onAddComment(beta.id, clean);
    setCommentText('');
  };

  const submitAscent = () => {
    if (!ascentResult) return;
    onLogAscent({
      betaId: beta.id,
      discipline,
      result: ascentResult,
      ascentType: discipline === 'deportiva' ? ascentType : null,
      grade: beta.grade,
      notes: ascentNotes.trim()
    });
    setAscentResult(null);
    setAscentNotes('');
    setShowAscentForm(false);
  };

  return (
    <div
      className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 overflow-y-auto md:flex md:items-center md:justify-center md:p-4"
      onClick={onClose}
    >
      {/* Contenedor: hoja completa en móvil, tarjeta en desktop */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-outline-variant md:rounded-xl w-full max-w-4xl overflow-hidden relative shadow-[0_0_30px_rgba(0,0,0,0.8)] min-h-full md:min-h-0 pop-in"
        id="beta-detail-modal"
      >
        <div className="h-2 w-full bg-caution-tape"></div>

        <button
          onClick={onClose}
          className="absolute top-5 right-4 z-20 h-11 w-11 bg-background/80 hover:bg-surface border border-outline-variant text-on-surface-variant hover:text-white flex items-center justify-center rounded-full transition-colors backdrop-blur"
          title="Cerrar"
          id="btn-close-detail"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Foto anotada */}
          <div className="md:col-span-7 bg-surface-container-lowest relative border-b md:border-b-0 md:border-r border-outline-variant">
            <div className="relative w-full md:h-[640px]">
              <img
                alt={beta.name}
                className="w-full h-auto md:h-full md:object-cover block"
                src={beta.imageUrl}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0">
                <BetaOverlay markers={beta.markers} strokes={beta.strokes} texts={beta.texts} />
              </div>

              {wall && (
                <div className="absolute bottom-3 left-3 bg-background/90 border border-outline-variant px-3 py-1.5 rounded-lg backdrop-blur">
                  <span className="font-mono text-[10px] text-primary-container flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">terrain</span>
                    {wall.name} · {wall.angle}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Ficha técnica */}
          <div className="md:col-span-5 p-5 md:p-6 flex flex-col md:h-[640px] md:overflow-y-auto bg-surface-container-low">
            <div className="space-y-5 flex-1">
              {/* Grado + título + meta */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    style={{ borderColor: beta.holdColor }}
                    className="font-display font-black text-white text-xl bg-surface border-2 px-3 py-1 rounded-lg shadow"
                  >
                    {beta.grade}
                  </span>
                  {beta.version > 1 && (
                    <span className="font-mono text-[10px] text-primary-container bg-primary-container/10 border border-primary-container/30 px-2 py-1 rounded font-bold uppercase">
                      v{beta.version}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-mono text-[9px] text-on-surface-variant uppercase border border-outline-variant rounded px-2 py-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: beta.holdColor }}></span>
                    presas
                  </span>
                  {beta.activeProject && !isStale && (
                    <span className="font-mono text-[10px] text-blue-400 bg-blue-950/50 border border-blue-500/50 px-2.5 py-1 rounded font-bold uppercase animate-pulse">
                      Proyecto
                    </span>
                  )}
                  {isStale && (
                    <span
                      className={`flex items-center gap-1 font-mono text-[10px] px-2.5 py-1 rounded font-bold uppercase border ${status.chip}`}
                    >
                      <span className="material-symbols-outlined text-[13px]">{status.icon}</span>
                      {status.label}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-black text-2xl text-white tracking-tight leading-tight pr-10">
                  {beta.name}
                </h3>

                <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant uppercase">
                  <span>Por @{beta.author}</span>
                  <span className="text-[#3F3F46]">|</span>
                  <span>{beta.createdAt}</span>
                </div>
              </div>

              {/* ─── Aviso de ciclo de vida ─── */}
              {isStale && (
                <div className={`rounded-xl border p-3.5 flex flex-col gap-3 pop-in ${status.banner}`}>
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">{status.icon}</span>
                    <p className="text-xs leading-relaxed font-sans">{status.message}</p>
                  </div>
                  {hasReplacement && beta.replacedById && (
                    <button
                      onClick={() => onOpenReplacement(beta.replacedById!)}
                      className="w-full h-11 bg-primary-container text-on-primary font-display font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 btn-punch shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                      id="btn-view-replacement"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      Ver Beta actualizada
                    </button>
                  )}
                  {!hasReplacement && (
                    <button
                      onClick={() => onCreateUpdatedVersion(beta)}
                      className="w-full h-11 bg-surface-container border border-outline-variant text-on-surface font-display font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 btn-punch hover:border-primary-container"
                      id="btn-create-updated-version"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                      Crear Beta actualizada
                    </button>
                  )}
                </div>
              )}

              {/* Recomendar */}
              <button
                onClick={() => onToggleRecommend(beta.id)}
                className={`w-full h-12 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 btn-punch border transition-colors ${
                  beta.recommendedByMe
                    ? 'bg-primary-container text-on-primary border-primary-container shadow-[3px_3px_0_0_rgba(0,0,0,1)]'
                    : 'bg-surface-container border-outline-variant text-on-surface hover:border-primary-container'
                }`}
                id="btn-recommend"
              >
                <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                {beta.recommendedByMe ? 'Recomendada' : 'Recomendar esta beta'}
                <span
                  className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                    beta.recommendedByMe ? 'bg-black/15' : 'bg-surface-container-high'
                  }`}
                >
                  {beta.recommendations}
                </span>
              </button>

              {/* ─── Registrar mi ascenso (adaptado a la disciplina) ─── */}
              {beta.status !== 'removed' && (
                <div className="space-y-2.5 bg-surface-container/50 border border-outline-variant/60 rounded-xl p-3.5">
                  <h4 className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-primary-container">sports_score</span>
                    Tu ascenso · {discipline === 'boulder' ? 'Boulder' : 'Deportiva'}
                  </h4>

                  {/* Mis registros previos en esta beta */}
                  {beta.myAscents.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {beta.myAscents.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-2 bg-surface border border-outline-variant/50 rounded-lg px-2.5 py-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px] text-primary-container">
                            {resultIcon(a.result)}
                          </span>
                          <span className="font-mono text-[11px] text-white font-bold">{resultLabel(a.result)}</span>
                          {a.ascentType && (
                            <span className="font-mono text-[9px] text-sky-300 border border-sky-700/50 rounded px-1.5 py-0.5 uppercase">
                              {typeLabel(a.ascentType)}
                            </span>
                          )}
                          <span className="font-mono text-[9px] text-outline">{a.createdAt}</span>
                          <button
                            onClick={() => onDeleteAscent(a.id)}
                            className="ml-auto text-on-surface-variant hover:text-red-400 shrink-0"
                            title="Borrar registro"
                          >
                            <span className="material-symbols-outlined text-[15px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showAscentForm ? (
                    <button
                      onClick={() => setShowAscentForm(true)}
                      className="w-full h-11 bg-primary-container text-on-primary font-display font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 btn-punch shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                      id="btn-open-ascent-form"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      {beta.myAscents.length > 0 ? 'Registrar otro intento' : 'Registrar ascenso'}
                    </button>
                  ) : (
                    <div className="space-y-2.5 pop-in">
                      {/* Tipo de ascenso: solo deportiva */}
                      {discipline === 'deportiva' && (
                        <div className="space-y-1.5">
                          <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
                            Tipo de ascenso
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {ASCENT_TYPES.map((t) => (
                              <button
                                key={t.key}
                                onClick={() => setAscentType(t.key)}
                                className={`h-10 rounded-lg font-mono text-[11px] flex items-center justify-center gap-1.5 btn-punch border ${
                                  ascentType === t.key
                                    ? 'bg-primary-container text-on-primary border-primary-container font-bold'
                                    : 'bg-surface-container border-outline-variant text-on-surface'
                                }`}
                                id={`btn-ascent-type-${t.key}`}
                              >
                                <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resultado: opciones según disciplina, nunca mezcladas */}
                      <div className="space-y-1.5">
                        <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
                          Resultado
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {resultsForDiscipline(discipline).map((r) => (
                            <button
                              key={r.key}
                              onClick={() => setAscentResult(r.key)}
                              className={`h-10 rounded-lg font-mono text-[11px] flex items-center justify-center gap-1.5 btn-punch border ${
                                ascentResult === r.key
                                  ? 'bg-primary-container text-on-primary border-primary-container font-bold'
                                  : 'bg-surface-container border-outline-variant text-on-surface'
                              }`}
                              id={`btn-ascent-result-${r.key}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">{r.icon}</span>
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="text"
                        value={ascentNotes}
                        onChange={(e) => setAscentNotes(e.target.value)}
                        placeholder="Observaciones (opcional)"
                        maxLength={200}
                        className="w-full bg-background border border-outline-variant rounded-lg px-3 h-10 text-xs text-white focus:border-primary-container focus:outline-none placeholder:text-outline-variant/60"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowAscentForm(false);
                            setAscentResult(null);
                          }}
                          className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container text-on-surface-variant font-mono text-[11px] btn-punch"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={submitAscent}
                          disabled={!ascentResult}
                          className={`flex-1 h-10 rounded-lg font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 btn-punch ${
                            ascentResult
                              ? 'bg-primary-container text-on-primary shadow-[2px_2px_0_0_rgba(0,0,0,1)]'
                              : 'bg-surface-container text-outline-variant cursor-not-allowed'
                          }`}
                          id="btn-submit-ascent"
                        >
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          Guardar ascenso
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Estilos */}
              {beta.styles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {beta.styles.map((st) => (
                    <span
                      key={st}
                      className="font-mono text-[10px] text-primary-container bg-primary-container/10 border border-primary-container/20 px-2.5 py-1 rounded font-bold uppercase"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              )}

              {/* Notas técnicas */}
              <div className="space-y-2">
                <h4 className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Notas del Autor / Crux
                </h4>
                <div className="bg-background border border-outline-variant/60 rounded-lg p-3.5 leading-relaxed text-xs text-on-surface whitespace-pre-wrap font-sans">
                  {beta.notes || 'No hay comentarios técnicos registrados para este bloque.'}
                </div>
              </div>

              {/* ─── Reporte comunitario de cambio de presas ─── */}
              {beta.status !== 'removed' && (
                <div className="space-y-2.5">
                  <h4 className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">report</span>
                    Estado de la ruta
                  </h4>

                  {beta.myReport ? (
                    <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-amber-200 font-mono flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        Reportaste {beta.myReport === 'removed' ? 'ruta removida' : 'presas cambiadas'}
                      </span>
                      <button
                        onClick={() => onUnreport(beta.id)}
                        className="font-mono text-[10px] text-on-surface-variant hover:text-white underline shrink-0"
                        id="btn-unreport"
                      >
                        Deshacer
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onReport(beta.id, 'holds_changed')}
                        className="w-full h-11 bg-surface-container border border-amber-700/50 text-amber-200 font-mono text-xs rounded-lg flex items-center justify-center gap-2 btn-punch hover:border-amber-500"
                        id="btn-report-holds"
                      >
                        <span className="material-symbols-outlined text-[18px]">warning</span>
                        Las presas cambiaron
                      </button>
                      <button
                        onClick={() => onReport(beta.id, 'removed')}
                        className="w-full h-10 bg-surface-container border border-red-800/50 text-red-300 font-mono text-[11px] rounded-lg flex items-center justify-center gap-2 btn-punch hover:border-red-600"
                        id="btn-report-removed"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        La ruta fue removida
                      </button>
                    </div>
                  )}

                  {/* Progreso hacia el consenso */}
                  {reportCount > 0 && beta.status === 'active' && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((reportCount / REPORT_THRESHOLD) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-[9px] text-on-surface-variant whitespace-nowrap">
                        {reportCount} de {REPORT_THRESHOLD} reportes
                      </span>
                    </div>
                  )}
                  {beta.status === 'active' && (
                    <p className="font-mono text-[9px] text-on-surface-variant/60 leading-relaxed">
                      Se necesitan {REPORT_THRESHOLD} reportes de escaladores distintos para marcar la ruta como
                      cambiada. Así se evitan reportes falsos.
                    </p>
                  )}
                </div>
              )}

              {/* ─── Comentarios de la comunidad ─── */}
              <div className="space-y-3">
                <h4 className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">forum</span>
                  Comentarios ({beta.comments.length})
                </h4>

                {beta.comments.length === 0 ? (
                  <p className="text-xs text-on-surface-variant/60 italic">
                    Nadie ha comentado. ¿Encontraste otra solución? Compártela.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {beta.comments.map((c) => (
                      <div key={c.id} className="bg-surface-container border border-outline-variant/50 rounded-lg p-3 card-in">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-[10px] font-bold text-primary-container">@{c.author}</span>
                          <span className="font-mono text-[9px] text-outline">{c.createdAt}</span>
                        </div>
                        <p className="text-xs text-on-surface leading-relaxed">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nuevo comentario */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                    placeholder={`Comenta como @${username}...`}
                    maxLength={300}
                    className="flex-1 bg-background border border-outline-variant rounded-lg px-3 h-11 text-xs text-white focus:border-primary-container focus:outline-none min-w-0 placeholder:text-outline-variant/60"
                    id="input-comment"
                  />
                  <button
                    onClick={submitComment}
                    disabled={!commentText.trim()}
                    className={`h-11 w-12 rounded-lg flex items-center justify-center btn-punch ${
                      commentText.trim()
                        ? 'bg-primary-container text-on-primary shadow-[2px_2px_0_0_rgba(0,0,0,1)]'
                        : 'bg-surface-container text-outline-variant cursor-not-allowed'
                    }`}
                    title="Enviar comentario"
                    id="btn-send-comment"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Acciones del dueño */}
            <div className="pt-5 border-t border-outline-variant/40 flex flex-col gap-2 mt-6">
              <div className="flex gap-2">
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar la beta "${beta.name}"?`)) {
                        onDelete(beta.id);
                        onClose();
                      }
                    }}
                    className="flex-1 h-11 bg-red-900/20 hover:bg-red-900/40 border border-red-700/60 text-red-400 rounded-lg font-mono text-xs cursor-pointer transition-colors flex items-center justify-center gap-1"
                    id="btn-detail-delete"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Eliminar
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 h-11 bg-surface-container-high hover:bg-surface-bright border border-outline-variant text-on-surface font-mono text-xs rounded-lg cursor-pointer transition-colors"
                  id="btn-detail-close-bottom"
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
