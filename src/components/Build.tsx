import React, { useState, useRef, useEffect } from 'react';
import { Wall, Beta } from '../types';
import { gradesForWallType } from '../data';
import { BetaEditor, EditorSnapshot, EMPTY_SNAPSHOT } from './BetaEditor';
import { Mascot } from './Mascot';

interface BuildProps {
  walls: Wall[];
  initialWallId: string | null;
  onPublish: (beta: Omit<Beta, 'id' | 'createdAt' | 'author' | 'comments' | 'recommendations'>) => void;
}

type Step = 'wall' | 'photo' | 'draw' | 'details';

const STEPS: { id: Step; label: string }[] = [
  { id: 'wall', label: 'Muro' },
  { id: 'photo', label: 'Foto' },
  { id: 'draw', label: 'Dibuja' },
  { id: 'details', label: 'Publica' }
];

const STYLE_TAGS = ['CRIMP', 'JUG', 'SLOPER', 'DYNAMIC', 'PINCH', 'OVERHANG', 'ENDURANCE', 'VOLUME'];

const HOLD_COLORS = [
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Amarillo', hex: '#eab308' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Púrpura', hex: '#a855f7' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Negro', hex: '#27272a' },
  { name: 'Blanco', hex: '#f4f4f5' }
];

// Comprime la foto de cámara a un dataURL liviano para localStorage
const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 1400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('img'));
    };
    img.src = url;
  });

/**
 * Flujo de creación de Beta, sin desvíos:
 * Elegir muro → Tomar foto → Dibujar beta → Publicar.
 */
export const Build: React.FC<BuildProps> = ({ walls, initialWallId, onPublish }) => {
  const initialWall = walls.find((w) => w.id === initialWallId) || null;
  const [step, setStep] = useState<Step>(initialWall ? 'photo' : 'wall');
  const [wall, setWall] = useState<Wall | null>(initialWall);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [snapshot, setSnapshot] = useState<EditorSnapshot>(EMPTY_SNAPSHOT);

  // Detalles
  const [routeName, setRouteName] = useState('');
  const [grade, setGrade] = useState('');
  const [styles, setStyles] = useState<string[]>([]);
  const [holdColor, setHoldColor] = useState(HOLD_COLORS[0].hex);
  const [notes, setNotes] = useState('');

  const [publishState, setPublishState] = useState<null | 'publishing' | 'success'>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // El grado por defecto depende del sistema del muro (V-scale vs francesa)
  useEffect(() => {
    if (wall) {
      const grades = gradesForWallType(wall.type);
      setGrade((g) => (grades.includes(g) ? g : grades[Math.min(3, grades.length - 1)]));
    }
  }, [wall]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const goBack = () => {
    if (step === 'photo') setStep('wall');
    else if (step === 'draw') setStep('photo');
    else if (step === 'details') setStep('draw');
  };

  const handleSelectWall = (w: Wall) => {
    setWall(w);
    setStep('photo');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLoadingPhoto(true);
    try {
      const dataUrl = await compressImage(file);
      setPhoto(dataUrl);
      setSnapshot(EMPTY_SNAPSHOT);
      setStep('draw');
    } catch {
      alert('No se pudo procesar la foto. Intenta de nuevo.');
    } finally {
      setLoadingPhoto(false);
    }
  };

  const toggleStyle = (style: string) => {
    setStyles((prev) => (prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]));
  };

  const handlePublish = () => {
    if (!wall || !photo) return;
    setPublishState('publishing');

    // La mascota sube mientras "publica"; luego celebra
    setTimeout(() => {
      setPublishState('success');
      setTimeout(() => {
        const finalName = routeName.trim() || `Ruta ${grade} · ${wall.name}`;
        onPublish({
          name: finalName,
          grade,
          styles,
          holdColor,
          notes: notes.trim(),
          imageUrl: photo,
          markers: snapshot.markers,
          strokes: snapshot.strokes,
          texts: snapshot.texts,
          wallId: wall.id,
          activeProject: false
        });
      }, 1300);
    }, 1400);
  };

  const grades = wall ? gradesForWallType(wall.type) : [];

  return (
    <div className="w-full pb-10 max-w-3xl mx-auto">
      {/* ─── Overlay de publicación con mascota ─── */}
      {publishState && (
        <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center gap-6">
          <div className="bg-surface-container border-2 border-outline-variant rounded-2xl p-6 shadow-[6px_6px_0_0_#facc15] pop-in">
            <Mascot state={publishState} size={140} />
          </div>
          <p className="font-display font-black text-xl text-white tracking-tight pop-in">
            {publishState === 'publishing' ? 'Subiendo tu beta...' : '¡Beta publicada!'}
          </p>
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
            {publishState === 'publishing' ? 'La comunidad la verá en segundos' : '+150 pts de Beta Score'}
          </p>
        </div>
      )}

      {/* ─── Header con progreso ─── */}
      <div className="mb-6 mt-2">
        <div className="flex items-center gap-3">
          {step !== 'wall' && (
            <button
              onClick={goBack}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-on-surface hover:border-primary-container btn-punch"
              title="Volver"
              id="btn-build-back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <div className="min-w-0">
            <h2 className="font-display font-black text-2xl md:text-3xl text-primary-container tracking-tight">
              Crear Beta
            </h2>
            {wall && step !== 'wall' && (
              <p className="font-mono text-[10px] text-on-surface-variant mt-0.5 uppercase tracking-wider truncate">
                {wall.name} · {wall.type === 'boulder' ? 'Boulder (V)' : 'Deportiva (Fr)'}
              </p>
            )}
          </div>
        </div>

        {/* Barra de pasos */}
        <div className="flex items-center gap-1.5 mt-4">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold border-2 transition-all duration-300 ${
                    i < stepIndex
                      ? 'bg-primary-container border-primary-container text-on-primary'
                      : i === stepIndex
                        ? 'bg-primary-container/15 border-primary-container text-primary-container scale-110'
                        : 'bg-surface-container border-outline-variant text-outline'
                  }`}
                >
                  {i < stepIndex ? <span className="material-symbols-outlined text-[14px]">check</span> : i + 1}
                </div>
                <span
                  className={`font-mono text-[8px] uppercase tracking-wide ${
                    i === stepIndex ? 'text-primary-container font-bold' : 'text-outline'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mb-4 rounded transition-colors duration-300 ${
                    i < stepIndex ? 'bg-primary-container' : 'bg-outline-variant/40'
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ─── PASO 1: Elegir muro ─── */}
      {step === 'wall' && (
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1">
            ¿En qué muro está tu bloque?
          </p>
          {walls.map((w, i) => (
            <button
              key={w.id}
              onClick={() => handleSelectWall(w)}
              style={{ animationDelay: `${i * 60}ms` }}
              className="card-in btn-punch text-left bg-[#18181B] border border-[#3F3F46] hover:border-primary-container rounded-xl overflow-hidden flex items-center gap-4 shadow-[3px_3px_0_0_rgba(0,0,0,1)] group"
              id={`build-wall-${w.id}`}
            >
              <div className="w-24 h-20 shrink-0 overflow-hidden bg-surface-container-lowest">
                <img
                  src={w.imageUrl}
                  alt={w.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="min-w-0 py-2 pr-2 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-sm text-white group-hover:text-primary-container transition-colors truncate">
                    {w.name}
                  </h4>
                  <span
                    className={`shrink-0 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                      w.type === 'boulder'
                        ? 'text-orange-300 border-orange-500/50 bg-orange-950/30'
                        : 'text-sky-300 border-sky-500/50 bg-sky-950/30'
                    }`}
                  >
                    {w.type}
                  </span>
                </div>
                <p className="font-sans text-[11px] text-on-surface-variant line-clamp-1 mt-1">{w.description}</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container mr-3 transition-all group-hover:translate-x-0.5">
                chevron_right
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ─── PASO 2: Tomar foto ─── */}
      {step === 'photo' && wall && (
        <div className="flex flex-col items-center gap-6 card-in">
          <div className="w-full bg-[#18181B] border border-[#3F3F46] rounded-xl p-6 flex flex-col items-center gap-5 text-center">
            {loadingPhoto ? (
              <>
                <Mascot state="loading" size={110} />
                <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
                  Procesando foto...
                </p>
              </>
            ) : (
              <>
                <Mascot state="idle" size={110} />
                <div>
                  <h3 className="font-display font-black text-lg text-white">Fotografía tu bloque</h3>
                  <p className="font-sans text-xs text-on-surface-variant mt-2 leading-relaxed max-w-sm">
                    Toma una foto nueva de la ruta tal como está hoy. Sobre esa foto dibujarás tu beta: inicio,
                    secuencia, flechas y top.
                  </p>
                </div>

                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full max-w-xs h-16 bg-primary-container text-on-primary font-display font-black text-base tracking-wide rounded-xl flex items-center justify-center gap-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] btn-punch"
                  id="btn-open-camera"
                >
                  <span className="material-symbols-outlined text-[28px]">photo_camera</span>
                  ABRIR CÁMARA
                </button>

                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="font-mono text-[11px] text-on-surface-variant hover:text-primary-container transition-colors flex items-center gap-1.5"
                  id="btn-open-gallery"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_library</span>
                  o elegir de la galería
                </button>
              </>
            )}
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      )}

      {/* ─── PASO 3: Dibujar ─── */}
      {step === 'draw' && photo && (
        <div className="flex flex-col gap-4 card-in">
          <BetaEditor imageUrl={photo} initial={snapshot} onChange={setSnapshot} />

          <div className="flex gap-2.5">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="h-13 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface font-mono text-[10px] uppercase flex items-center gap-1.5 btn-punch"
              id="btn-retake-photo"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              Repetir foto
            </button>
            <button
              onClick={() => setStep('details')}
              className="flex-1 h-13 py-3 bg-primary-container text-on-primary font-display font-black text-sm tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] btn-punch"
              id="btn-to-details"
            >
              CONTINUAR
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── PASO 4: Detalles y publicar ─── */}
      {step === 'details' && wall && photo && (
        <div className="flex flex-col gap-5 card-in">
          {/* Mini-preview de lo dibujado */}
          <div className="flex items-center gap-4 bg-surface-container/60 border border-outline-variant/50 rounded-xl p-3">
            <img src={photo} alt="Tu foto" className="w-16 h-16 rounded-lg object-cover border border-outline-variant" />
            <div className="font-mono text-[10px] text-on-surface-variant leading-relaxed">
              <span className="text-white font-bold">{snapshot.markers.length}</span> marcadores ·{' '}
              <span className="text-white font-bold">{snapshot.strokes.length}</span> trazos ·{' '}
              <span className="text-white font-bold">{snapshot.texts.length}</span> textos
              <button
                onClick={() => setStep('draw')}
                className="block text-primary-container hover:underline mt-0.5"
              >
                ← Editar dibujo
              </button>
            </div>
          </div>

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="routeName">
              Nombre de la Ruta
            </label>
            <input
              type="text"
              id="routeName"
              className="w-full bg-surface-container border border-outline-variant rounded-lg p-3.5 text-sm text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none placeholder:text-outline-variant/50"
              placeholder={`Ej. Ruta ${grade} · ${wall.name}`}
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
            />
          </div>

          {/* Grado: SOLO el sistema del muro */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              Grado
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[9px] border ${
                  wall.type === 'boulder'
                    ? 'text-orange-300 border-orange-500/50 bg-orange-950/30'
                    : 'text-sky-300 border-sky-500/50 bg-sky-950/30'
                }`}
              >
                {wall.type === 'boulder' ? 'ESCALA V · BOULDER' : 'FRANCESA · DEPORTIVA'}
              </span>
            </label>
            <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar" id="grade-selector">
              {grades.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`flex-shrink-0 h-11 min-w-[52px] px-3 rounded-lg font-mono text-xs cursor-pointer transition-all btn-punch ${
                    grade === g
                      ? 'bg-primary-container text-on-primary border border-primary-container shadow-[3px_3px_0_0_rgba(0,0,0,1)] font-bold'
                      : 'bg-surface-container border border-outline-variant text-on-surface hover:border-primary-container'
                  }`}
                  id={`btn-grade-${g}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Color de presas */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
              Color de las Presas
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {HOLD_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setHoldColor(color.hex)}
                  style={{ backgroundColor: color.hex }}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                    holdColor === color.hex ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-background'
                  }`}
                  title={color.name}
                  id={`btn-color-${color.name}`}
                >
                  {holdColor === color.hex && (
                    <span
                      className={`material-symbols-outlined text-[18px] font-black ${
                        color.hex === '#f4f4f5' ? 'text-black' : 'text-white'
                      }`}
                    >
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Estilos */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
              Estilo (opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_TAGS.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleStyle(style)}
                  className={`h-9 px-3.5 rounded-full font-mono text-[10px] cursor-pointer transition-all btn-punch ${
                    styles.includes(style)
                      ? 'bg-primary-container border border-primary-container text-on-primary font-bold'
                      : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-bright'
                  }`}
                  id={`btn-tag-${style}`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="notes">
              Notas de la Beta (crux, pies clave...)
            </label>
            <textarea
              id="notes"
              className="w-full bg-surface-container border border-outline-variant rounded-lg p-3.5 font-sans text-sm text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none min-h-[90px] placeholder:text-on-surface-variant/50 leading-relaxed"
              placeholder="Describe el crux, la colocación de pies clave, agarres ocultos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Publicar */}
          <button
            onClick={handlePublish}
            className="w-full h-16 bg-primary-container text-on-primary font-display font-black text-base tracking-widest rounded-xl flex items-center justify-center gap-2.5 shadow-[4px_4px_0_0_#4d4632] btn-punch mt-1"
            id="btn-publish-beta"
          >
            <span className="material-symbols-outlined font-black text-[24px]">publish</span>
            PUBLICAR BETA
          </button>
        </div>
      )}

      {/* Inputs de archivo disponibles en todos los pasos (para repetir foto) */}
      {step !== 'photo' && (
        <>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </div>
  );
};
