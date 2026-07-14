import React, { useState, useRef, useCallback } from 'react';
import { Marker, Stroke, TextLabel, EditorTool, Point } from '../types';
import { BetaOverlay } from './BetaOverlay';

export interface EditorSnapshot {
  markers: Marker[];
  strokes: Stroke[];
  texts: TextLabel[];
}

export const EMPTY_SNAPSHOT: EditorSnapshot = { markers: [], strokes: [], texts: [] };

interface BetaEditorProps {
  imageUrl: string;
  initial?: EditorSnapshot;
  onChange: (snapshot: EditorSnapshot) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const DRAW_COLORS = ['#facc15', '#ef4444', '#3b82f6', '#22c55e', '#ffffff', '#ec4899'];

const TOOLS: { id: EditorTool; label: string; icon: string }[] = [
  { id: 'PEN', label: 'Lápiz', icon: 'stylus_note' },
  { id: 'ARROW', label: 'Flecha', icon: 'north_east' },
  { id: 'START', label: 'Inicio', icon: 'play_circle' },
  { id: 'TOP', label: 'Top', icon: 'flag' },
  { id: 'SEQ', label: 'Secuencia', icon: 'format_list_numbered' },
  { id: 'TEXT', label: 'Texto', icon: 'text_fields' }
];

/**
 * Editor de betas: dibujo manual sobre la foto tomada.
 * Todas las herramientas visibles, sin menús ocultos.
 * Trazos en coordenadas % → escalan idéntico en todas las pantallas.
 */
export const BetaEditor: React.FC<BetaEditorProps> = ({ imageUrl, initial, onChange }) => {
  const [snapshot, setSnapshot] = useState<EditorSnapshot>(initial || EMPTY_SNAPSHOT);
  const [tool, setTool] = useState<EditorTool>('PEN');
  const [drawColor, setDrawColor] = useState(DRAW_COLORS[0]);
  const [draft, setDraft] = useState<Stroke | null>(null);
  const [pendingText, setPendingText] = useState<Point | null>(null);
  const [textInput, setTextInput] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<EditorSnapshot[]>([]);
  const futureRef = useRef<EditorSnapshot[]>([]);
  const drawingRef = useRef(false);

  const commit = useCallback(
    (next: EditorSnapshot) => {
      historyRef.current.push(snapshot);
      if (historyRef.current.length > 60) historyRef.current.shift();
      futureRef.current = [];
      setSnapshot(next);
      onChange(next);
    },
    [snapshot, onChange]
  );

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push(snapshot);
    setSnapshot(prev);
    onChange(prev);
  };

  const redo = () => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(snapshot);
    setSnapshot(next);
    onChange(next);
  };

  const clearAll = () => {
    if (snapshot.markers.length + snapshot.strokes.length + snapshot.texts.length === 0) return;
    commit(EMPTY_SNAPSHOT);
  };

  const getPos = (e: React.PointerEvent): Point | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return null;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  // ─── Dibujo continuo (lápiz y flecha) ───────────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    const pos = getPos(e);
    if (!pos) return;

    if (tool === 'PEN' || tool === 'ARROW') {
      e.currentTarget.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      setDraft({ id: uid(), tool, color: drawColor, points: [pos, pos] });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || !draft) return;
    const pos = getPos(e);
    if (!pos) return;

    if (draft.tool === 'PEN') {
      const last = draft.points[draft.points.length - 1];
      const dist = Math.hypot(pos.x - last.x, pos.y - last.y);
      if (dist < 0.7) return; // simplificar trazo
      setDraft({ ...draft, points: [...draft.points, pos] });
    } else {
      // ARROW: origen fijo, destino sigue el dedo
      setDraft({ ...draft, points: [draft.points[0], pos] });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (drawingRef.current && draft) {
      drawingRef.current = false;
      const [a, b] = [draft.points[0], draft.points[draft.points.length - 1]];
      const moved = Math.hypot(b.x - a.x, b.y - a.y) > 1.2;
      if (moved && draft.points.length >= 2) {
        commit({ ...snapshot, strokes: [...snapshot.strokes, draft] });
      }
      setDraft(null);
      return;
    }

    // Herramientas de tap: marcadores y texto
    const pos = getPos(e);
    if (!pos) return;

    if (tool === 'START' || tool === 'TOP') {
      const marker: Marker = { id: uid(), x: pos.x, y: pos.y, type: tool };
      commit({ ...snapshot, markers: [...snapshot.markers, marker] });
    } else if (tool === 'SEQ') {
      const nextNum = snapshot.markers.filter((m) => m.type === 'SEQ').length + 1;
      const marker: Marker = { id: uid(), x: pos.x, y: pos.y, type: 'SEQ', label: String(nextNum) };
      commit({ ...snapshot, markers: [...snapshot.markers, marker] });
    } else if (tool === 'TEXT') {
      setPendingText(pos);
      setTextInput('');
    }
  };

  const removeMarker = (markerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = snapshot.markers.filter((m) => m.id !== markerId);
    // Reindexar secuencias para que sigan 1,2,3...
    let seq = 1;
    const reindexed = filtered.map((m) => (m.type === 'SEQ' ? { ...m, label: String(seq++) } : m));
    commit({ ...snapshot, markers: reindexed });
  };

  const removeText = (textId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    commit({ ...snapshot, texts: snapshot.texts.filter((t) => t.id !== textId) });
  };

  const confirmText = () => {
    const clean = textInput.trim();
    if (!clean || !pendingText) {
      setPendingText(null);
      return;
    }
    const label: TextLabel = { id: uid(), x: pendingText.x, y: pendingText.y, text: clean, color: drawColor };
    commit({ ...snapshot, texts: [...snapshot.texts, label] });
    setPendingText(null);
    setTextInput('');
  };

  const canUndo = historyRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* ─── Lienzo: foto + anotaciones ─── */}
      <div className="relative w-full rounded-lg border border-outline-variant overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-surface-container-lowest">
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full select-none cursor-crosshair"
          style={{ touchAction: 'none' }}
        >
          <img src={imageUrl} alt="Foto del muro para dibujar la beta" className="w-full h-auto block pointer-events-none" draggable={false} />

          <BetaOverlay
            markers={snapshot.markers}
            strokes={draft ? [...snapshot.strokes, draft] : snapshot.strokes}
            texts={snapshot.texts}
            onRemoveMarker={removeMarker}
            onRemoveText={removeText}
          />

          {/* Indicador de herramienta activa */}
          <div className="absolute top-2 left-2 bg-background/90 backdrop-blur border border-outline-variant rounded px-2 py-1 font-mono text-[10px] text-on-surface-variant pointer-events-none flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full pop-in" style={{ backgroundColor: drawColor }}></span>
            <span className="uppercase font-bold text-white">{TOOLS.find((t) => t.id === tool)?.label}</span>
          </div>
        </div>

        {/* Input flotante para la herramienta de texto */}
        {pendingText && (
          <div className="absolute bottom-3 left-3 right-3 bg-surface border-2 border-primary-container rounded-lg p-2 flex gap-2 items-center z-20 pop-in shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <input
              autoFocus
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmText()}
              placeholder="Ej: pie izquierdo aquí, reposo..."
              className="flex-1 bg-background border border-outline-variant rounded px-3 h-11 text-sm text-white focus:border-primary-container focus:outline-none min-w-0"
              maxLength={40}
            />
            <button
              onClick={confirmText}
              className="h-11 px-4 bg-primary-container text-on-primary rounded font-mono text-xs font-bold btn-punch shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              OK
            </button>
            <button
              onClick={() => setPendingText(null)}
              className="h-11 w-11 flex items-center justify-center text-on-surface-variant hover:text-white"
              title="Cancelar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Barra de herramientas: SIEMPRE visible, botones grandes ─── */}
      <div className="bg-surface-container border border-outline-variant rounded-lg p-2.5 flex flex-col gap-2.5">
        {/* Herramientas de dibujo */}
        <div className="grid grid-cols-6 gap-1.5">
          {TOOLS.map((t) => {
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`h-14 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all btn-punch ${
                  active
                    ? 'bg-primary-container text-on-primary shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-white border border-outline-variant/50'
                }`}
                title={t.label}
              >
                <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                <span className="font-mono text-[8px] uppercase tracking-tight">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Colores + acciones */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1.5">
            {DRAW_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setDrawColor(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition-transform ${
                  drawColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-container scale-110' : 'hover:scale-110'
                }`}
                title={`Color ${c}`}
              />
            ))}
          </div>

          <div className="flex gap-1.5 ml-auto">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`h-10 w-12 flex items-center justify-center rounded-lg border btn-punch ${
                canUndo
                  ? 'bg-surface-container-high border-outline-variant text-white'
                  : 'bg-surface-container-low border-outline-variant/30 text-outline-variant cursor-not-allowed'
              }`}
              title="Deshacer"
            >
              <span className="material-symbols-outlined text-[20px]">undo</span>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`h-10 w-12 flex items-center justify-center rounded-lg border btn-punch ${
                canRedo
                  ? 'bg-surface-container-high border-outline-variant text-white'
                  : 'bg-surface-container-low border-outline-variant/30 text-outline-variant cursor-not-allowed'
              }`}
              title="Rehacer"
            >
              <span className="material-symbols-outlined text-[20px]">redo</span>
            </button>
            <button
              onClick={clearAll}
              className="h-10 w-12 flex items-center justify-center rounded-lg border border-red-800/60 bg-red-950/30 text-red-400 btn-punch"
              title="Limpiar todo"
            >
              <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
            </button>
          </div>
        </div>
      </div>

      <p className="font-mono text-[10px] text-on-surface-variant/70 text-center">
        Dibuja con el dedo · Toca un marcador o texto para borrarlo
      </p>
    </div>
  );
};
