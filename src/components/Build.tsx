import React, { useState, useRef } from 'react';
import { Sector, Beta, Marker, MarkerType } from '../types';

interface BuildProps {
  sectors: Sector[];
  initialSectorId: string | null;
  onPublish: (beta: Omit<Beta, 'id' | 'createdAt' | 'author'>) => void;
}

export const Build: React.FC<BuildProps> = ({
  sectors,
  initialSectorId,
  onPublish
}) => {
  // Input fields state
  const [routeName, setRouteName] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState(initialSectorId || sectors[0]?.id || 'cueva');
  const [selectedGrade, setSelectedGrade] = useState('V3');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['JUG', 'DYNAMIC']);
  const [selectedHoldColor, setSelectedHoldColor] = useState('#eab308'); // Default yellow
  const [notes, setNotes] = useState('');
  
  // Custom image selection or Preset preset
  const presetImages = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD5b2JWPJa-cwssKYfkw05X2LcyCVhtnuNV3FEacTadR9SW162Jan_ZV-c0zG6dnYJwrvtUaqKtwJZHSPAyUNY5W256ZcT38f3SJsWDp2Pd4ebAYZ_Gtz0QLr0Prf6DLda7wQyx0iAt4uV4g4tuLbkjtyKehpmHxAQwT-GGvjWHAPaSvp61eYu_w7swtzVSLaQalSJ9E8YxweBFlHOtwEKiKHvvNz-sagJxEYO-lR7BO1sJqJ1elv9yHhSb0dM_CK4EPTOHWwER_0-G',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBKVhw-jksVTj69fhU_ftDWaMiyDnw2XPb4KpPpN5Nx1OAV6kn5O7BXlj0dVqjUI0JoCaCIN_6zFZhrC8Sz2YlJfQMMhEQgML6AK8x_0rIasUTpzh4jLerc46e-GaPHvRTfBxnPELwmVXZeKUR1Q3C550-Ih9Psyeirh-Pr3oNoZcETAhOAKCtKarttBT9fvOcYCt51gN5Nbn2q0MHlRrGcFM5GMr0Iw4zKYW0B_VQlXhNRpBgh9BjDyjOmKZoXHTRtWWNqc_GTre_g',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAXbX6i_PTHXvdkQS4XfNE3HCGr0_9MfLHY55tlJGSuepodWHzPEMlye3xlJQHmRrCw3p1h5aHMil2ojAPDyMoyNyvInlypQXpyz1zQBvIZxJ8t4y4qAYuOxLfMG7oh8glAxe-8bar2KINuVy3dBdqbb2yG1F4xfxB3C89nk0ZXorDTTm5kWEskw3nqrjdW8kyftzCnC88eRUmORHJg0i7wloW6eFTsQM6SMMg5cEghMwSdRxCaul9EYbPopWgRbQ6qQOWzIy1COizB'
  ];
  const [selectedImage, setSelectedImage] = useState(presetImages[0]);
  const [customImageInput, setCustomImageInput] = useState('');
  const [showImageDropdown, setShowImageDropdown] = useState(false);

  // Markers state and drawing mode
  const [markers, setMarkers] = useState<Marker[]>([
    { id: 'm1', x: 50, y: 82, type: 'START' },
    { id: 'm2', x: 50, y: 55, type: 'SEQ', label: '1' },
    { id: 'm3', x: 32, y: 25, type: 'TOP' }
  ]);
  const [currentTool, setCurrentTool] = useState<MarkerType>('SEQ');
  const imageRef = useRef<HTMLImageElement>(null);

  // Styling categories matching screenshot tags
  const styleTags = ['CRIMP', 'JUG', 'SLOPER', 'DYNAMIC', 'PINCH', 'OVERHANG', 'STEMMING', 'VOLUME'];

  // Color circles matching screenshot selectors
  const holdColors = [
    { name: 'Rojo', hex: '#ef4444' },
    { name: 'Azul', hex: '#3b82f6' },
    { name: 'Amarillo', hex: '#eab308' },
    { name: 'Verde', hex: '#22c55e' },
    { name: 'Púrpura', hex: '#a855f7' }
  ];

  // Grade levels V0 to V9
  const grades = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9'];

  // Handle styles selection toggle
  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  // Click on climbing image to place marker
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    // Get click position percentage coordinates relative to the image element
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;

    // Check bounds safety
    if (x < 0 || x > 100 || y < 0 || y > 100) return;

    // Build the marker
    let markerLabel: string | undefined = undefined;
    
    if (currentTool === 'SEQ') {
      // Find the next sequence number dynamically
      const seqMarkers = markers.filter(m => m.type === 'SEQ');
      const nextNum = seqMarkers.length + 1;
      markerLabel = nextNum.toString();
    }

    const newMarker: Marker = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      type: currentTool,
      label: markerLabel
    };

    setMarkers([...markers, newMarker]);
  };

  // Remove individual marker
  const removeMarker = (markerId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid placing another marker on click
    const filtered = markers.filter(m => m.id !== markerId);
    
    // Re-index sequence numbers to keep them sequential starting from 1
    let seqCount = 1;
    const reindexed = filtered.map(m => {
      if (m.type === 'SEQ') {
        const updated = { ...m, label: seqCount.toString() };
        seqCount++;
        return updated;
      }
      return m;
    });

    setMarkers(reindexed);
  };

  // Clear all holds
  const clearAllMarkers = () => {
    setMarkers([]);
  };

  // Submit route form to publish
  const handlePublish = () => {
    const finalRouteName = routeName.trim() || `Ruta ${selectedGrade} ${sectors.find(s => s.id === selectedSectorId)?.name || 'Cueva'}`;
    
    onPublish({
      name: finalRouteName,
      grade: selectedGrade,
      styles: selectedStyles,
      holdColor: selectedHoldColor,
      notes: notes.trim(),
      imageUrl: selectedImage,
      markers: markers,
      sectorId: selectedSectorId,
      activeProject: false
    });
  };

  return (
    <div className="w-full pb-10">
      {/* Build Header */}
      <div className="mb-6 mt-2">
        <h2 className="font-display font-black text-3xl md:text-4xl text-primary-container tracking-tight" id="build-title">
          Crear Beta
        </h2>
        <p className="font-mono text-xs text-on-surface-variant mt-2 uppercase tracking-wider">
          Marca las presas y diseña el bloque técnico de la comunidad
        </p>
      </div>

      {/* Main Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Interactive Drawing Wall (span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
            <span>DIBUJA LAS PRESAS (Toca la imagen para marcar)</span>
            <button 
              onClick={clearAllMarkers}
              className="text-red-400 font-mono text-[10px] hover:underline flex items-center gap-1"
              id="btn-clear-markers"
            >
              <span className="material-symbols-outlined text-[12px]">delete_sweep</span>
              Limpiar todo
            </button>
          </label>

          {/* Interactive Climb Wall Frame */}
          <div 
            className="relative w-full aspect-[4/5] bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,1)] group"
            id="climbing-canvas-container"
          >
            {/* The interactive click container */}
            <div 
              onClick={handleImageClick}
              className="w-full h-full relative cursor-crosshair select-none"
            >
              <img
                ref={imageRef}
                alt="Fondo de Muro de Escalada"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                src={selectedImage}
                referrerPolicy="no-referrer"
              />

              {/* Rendering Markers overlay */}
              {markers.map((marker) => {
                let markerBgColor = 'border-primary-container bg-surface/80 text-primary-container';
                let markerSymbol = 'circle';
                
                if (marker.type === 'START') {
                  markerBgColor = 'border-primary-container bg-primary-container/20 text-primary-container shadow-[0_0_12px_#facc15]';
                } else if (marker.type === 'TOP') {
                  markerBgColor = 'border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.7)]';
                } else if (marker.type === 'SEQ') {
                  markerBgColor = 'border-yellow-500 bg-yellow-500/10 text-yellow-400 font-black';
                } else if (marker.type === 'ARROW') {
                  markerBgColor = 'border-purple-500 bg-purple-500/20 text-purple-400';
                  markerSymbol = 'navigation';
                }

                return (
                  <div
                    key={marker.id}
                    onClick={(e) => removeMarker(marker.id, e)}
                    style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                    className={`absolute w-8 h-8 -ml-4 -mt-4 border-2 rounded-full flex items-center justify-center text-xs backdrop-blur-sm transition-all duration-150 hover:scale-110 cursor-pointer ${markerBgColor}`}
                    title="Haz clic para eliminar este hold"
                    id={`marker-${marker.id}`}
                  >
                    {marker.type === 'SEQ' ? (
                      <span className="font-mono text-[11px] font-bold">{marker.label}</span>
                    ) : marker.type === 'ARROW' ? (
                      <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                    ) : (
                      <span className="font-mono text-[9px] font-semibold">{marker.type}</span>
                    )}

                    {/* Small close tag shown on hover */}
                    <div className="absolute -top-1 -right-1 bg-red-600 border border-red-400 rounded-full w-3.5 h-3.5 items-center justify-center hidden group-hover:flex text-[8px] text-white">
                      ×
                    </div>
                  </div>
                );
              })}

              {/* Draw Tool overlay instructions */}
              <div className="absolute top-3 left-3 bg-background/90 backdrop-blur border border-outline-variant rounded px-2.5 py-1 text-[10px] font-mono text-on-surface-variant flex items-center gap-1.5 pointer-events-none">
                <span className="material-symbols-outlined text-[12px] text-primary-container animate-pulse">help_outline</span>
                <span>Modo actual: <strong className="text-white uppercase">{currentTool}</strong>. Toca hold para borrar.</span>
              </div>
            </div>

            {/* Drawing Toolbar Overlay fixed on bottom */}
            <div className="absolute bottom-4 left-4 right-4 bg-surface/95 backdrop-blur-sm border border-outline rounded-lg p-2 flex justify-between items-center z-10 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
              {/* START TOOL */}
              <button
                onClick={() => setCurrentTool('START')}
                className={`h-11 px-3 flex flex-col items-center justify-center gap-0.5 rounded cursor-pointer transition-colors ${
                  currentTool === 'START'
                    ? 'text-primary-container bg-surface-container-high border border-primary-container/40'
                    : 'text-on-surface-variant hover:text-primary-container'
                }`}
                title="Marcar inicio de ruta (holds iniciales)"
                id="btn-tool-start"
              >
                <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-container bg-primary-container/20 shadow-[0_0_6px_#facc15]"></div>
                <span className="font-mono text-[9px] tracking-wider uppercase font-semibold">START</span>
              </button>

              {/* TOP TOOL */}
              <button
                onClick={() => setCurrentTool('TOP')}
                className={`h-11 px-3 flex flex-col items-center justify-center gap-0.5 rounded cursor-pointer transition-colors ${
                  currentTool === 'TOP'
                    ? 'text-red-400 bg-surface-container-high border border-red-500/40'
                    : 'text-on-surface-variant hover:text-red-400'
                }`}
                title="Marcar presa final (top hold)"
                id="btn-tool-top"
              >
                <div className="w-3.5 h-3.5 rounded-full border-2 border-red-500 bg-red-500/20 shadow-[0_0_6px_rgba(239,68,68,0.7)]"></div>
                <span className="font-mono text-[9px] tracking-wider uppercase font-semibold">TOP</span>
              </button>

              {/* SEQ TOOL */}
              <button
                onClick={() => setCurrentTool('SEQ')}
                className={`h-11 px-3 flex flex-col items-center justify-center gap-0.5 rounded cursor-pointer transition-colors ${
                  currentTool === 'SEQ'
                    ? 'text-yellow-400 bg-surface-container-high border border-yellow-500/40'
                    : 'text-on-surface-variant hover:text-yellow-400'
                }`}
                title="Marcar holds de secuencia intermedia (auto-incremento)"
                id="btn-tool-seq"
              >
                <span className="material-symbols-outlined text-[18px]">timeline</span>
                <span className="font-mono text-[9px] tracking-wider uppercase font-semibold">SEQ</span>
              </button>

              {/* ARROW TOOL */}
              <button
                onClick={() => setCurrentTool('ARROW')}
                className={`h-11 px-3 flex flex-col items-center justify-center gap-0.5 rounded cursor-pointer transition-colors ${
                  currentTool === 'ARROW'
                    ? 'text-purple-400 bg-surface-container-high border border-purple-500/40'
                    : 'text-on-surface-variant hover:text-purple-400'
                }`}
                title="Marcar un puntero o hold auxiliar"
                id="btn-tool-arrow"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                <span className="font-mono text-[9px] tracking-wider uppercase font-semibold">ARROW</span>
              </button>
            </div>

            {/* Change Image Button overlay */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setShowImageDropdown(!showImageDropdown)}
                className="bg-surface-container-highest/90 backdrop-blur border border-outline-variant hover:bg-surface-bright px-2.5 py-1.5 rounded flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-on-surface"
                id="btn-change-image-dropdown"
              >
                <span className="material-symbols-outlined text-[14px] text-primary-container">add_photo_alternate</span>
                <span>CAMBIAR IMAGEN</span>
              </button>

              {showImageDropdown && (
                <div className="absolute right-0 mt-1 bg-surface-container border border-outline-variant rounded p-2.5 w-64 flex flex-col gap-2 shadow-[4px_4px_0_0_#000] z-50">
                  <span className="font-mono text-[9px] text-outline uppercase tracking-wider">Presets de Muros</span>
                  <div className="flex gap-1.5 justify-between">
                    {presetImages.map((p, idx) => (
                      <button
                        key={p}
                        onClick={() => {
                          setSelectedImage(p);
                          setShowImageDropdown(false);
                        }}
                        className={`w-14 h-14 rounded overflow-hidden border cursor-pointer ${
                          selectedImage === p ? 'border-primary-container border-2' : 'border-outline-variant'
                        }`}
                        id={`btn-preset-image-${idx}`}
                      >
                        <img src={p} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>

                  <span className="font-mono text-[9px] text-outline uppercase tracking-wider mt-1.5">O introduce URL de foto</span>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      className="bg-background border border-outline-variant text-[10px] px-1.5 py-1 rounded w-full text-white"
                      placeholder="https://..."
                      value={customImageInput}
                      onChange={(e) => setCustomImageInput(e.target.value)}
                      id="input-custom-image-url"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customImageInput.trim().startsWith('http')) {
                          setSelectedImage(customImageInput.trim());
                          setCustomImageInput('');
                          setShowImageDropdown(false);
                        }
                      }}
                      className="bg-primary-container hover:bg-yellow-400 text-on-primary text-[10px] px-2 rounded font-mono font-bold"
                      id="btn-apply-custom-image"
                    >
                      Ir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Technical Metadata and Fields (span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <h2 className="font-display font-bold text-lg text-on-background border-b border-outline-variant pb-2 uppercase tracking-wide">
            TECH SPECS
          </h2>

          {/* Route Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="routeName">
              Nombre de la Ruta
            </label>
            <input
              type="text"
              id="routeName"
              className="w-full bg-surface-container border border-outline-variant rounded p-3 text-sm text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none placeholder:text-outline-variant/50"
              placeholder="Ej. The Pink Menace, Yellow Dyno..."
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
            />
          </div>

          {/* Sector Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="sectorSelector">
              Sector del Muro
            </label>
            <select
              id="sectorSelector"
              className="w-full bg-surface-container border border-outline-variant rounded p-3 text-sm text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none cursor-pointer"
              value={selectedSectorId}
              onChange={(e) => setSelectedSectorId(e.target.value)}
            >
              {sectors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.angle} desplome)
                </option>
              ))}
            </select>
          </div>

          {/* Grade Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
              GRADO (V-SCALE)
            </label>
            <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar" id="grade-selector-container">
              {grades.map((grade) => {
                const isActive = selectedGrade === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setSelectedGrade(grade)}
                    className={`flex-shrink-0 h-10 px-4 rounded font-mono text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-primary-container text-on-primary border border-primary-container shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-0.5 font-bold'
                        : 'bg-surface-container border border-outline-variant text-on-surface hover:border-primary-container'
                    }`}
                    id={`btn-select-grade-${grade}`}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route Styles Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
              Estilo de la Ruta (ROUTE STYLE)
            </label>
            <div className="flex flex-wrap gap-2" id="style-tags-container">
              {styleTags.map((style) => {
                const isSelected = selectedStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={`h-8 px-3 rounded-full font-mono text-[10px] cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary-container border border-primary-container text-on-primary font-bold'
                        : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-bright'
                    }`}
                    id={`btn-tag-${style}`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hold Color Circles Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
              Color de las Presas (HOLD COLOR)
            </label>
            <div className="flex gap-3" id="hold-color-container">
              {holdColors.map((color) => {
                const isChecked = selectedHoldColor === color.hex;
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setSelectedHoldColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center cursor-pointer transition-transform hover:scale-110 relative"
                    title={color.name}
                    id={`btn-color-${color.name}`}
                  >
                    {isChecked && (
                      <span className="material-symbols-outlined text-white text-[16px] font-black drop-shadow">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Technical comments / description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="technicalComments">
              NOTAS DE LA BETA / CRUX DETAILS
            </label>
            <textarea
              id="technicalComments"
              className="w-full bg-surface-container border border-outline-variant rounded p-3 font-sans text-xs text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none min-h-[100px] placeholder:text-on-surface-variant/50 leading-relaxed"
              placeholder="Describe el crux del bloque, la colocación de pies clave, agarres ocultos, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Publish Action Button */}
          <button
            onClick={handlePublish}
            className="w-full h-14 bg-primary-container text-on-primary font-display font-bold text-sm tracking-widest rounded flex items-center justify-center gap-2 shadow-[4px_4px_0_0_#4d4632] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0_0_#4d4632] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none mt-2 cursor-pointer"
            id="btn-publish-beta"
          >
            <span className="material-symbols-outlined font-black text-[20px]">publish</span>
            <span>PUBLICAR BETA</span>
          </button>
        </div>

      </div>
    </div>
  );
};
