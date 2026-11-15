import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Badge from '../ui/Badge';
import Alert from '../ui/Alert';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Layout,
  CheckSquare,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  X,
  Plus,
  Check,
  Loader2,
  AlertCircle,
  Calendar,
  Mail,
  Zap,
  ExternalLink,
  MoreHorizontal,
  Clock,
  AlignLeft,
  Filter,
  Settings,
  Users,
  Archive,
  Upload,
  Image as ImageIcon,
  Palette
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleCalendarIcon } from '../ui/GoogleCalendarIcon';
import { BrandLogo } from '../ui/BrandLogo';
import {
  BOARD_BACKGROUND_PRESETS,
  UNSPLASH_CURATED_WALLPAPERS,
} from '../../lib/board-backgrounds';

interface OnboardingStepperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: (workspaceId: string, boardId: string) => void;
}

// Official Trello SVG Logo
const TrelloLogo: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <rect width="24" height="24" rx="5" fill="#0079BF" />
    <rect x="4.5" y="4.5" width="6.5" height="12" rx="1.5" fill="#FFFFFF" />
    <rect x="13" y="4.5" width="6.5" height="8" rx="1.5" fill="#FFFFFF" />
  </svg>
);

const PLATFORM_COLOR_PRESETS = BOARD_BACKGROUND_PRESETS.filter((p) => p.id !== 'default');
const DEFAULT_ONBOARDING_BG = `${PLATFORM_COLOR_PRESETS[2]?.value || PLATFORM_COLOR_PRESETS[0].value}?tone=dark&lava=true`;

const BOARD_NAME_SUGGESTIONS = [
  'Desarrollo Sprint',
  'Tareas Semanales',
  'Lanzamiento Web',
  'Estrategia de Producto',
  'Roadmap 2026'
];

const ORGANIZATION_TYPES = [
  '🏢 Empresa / Pyme',
  '💻 Software & Tech',
  '🎨 Agencia Creativa',
  '🚀 Proyecto Personal'
];

export const OnboardingStepperModal: React.FC<OnboardingStepperModalProps> = ({
  isOpen,
  onClose,
  onCompleted
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);

  // Form states
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceType, setWorkspaceType] = useState('🏢 Empresa / Pyme');
  const [boardName, setBoardName] = useState('Tareas Semanales');
  const [selectedBgValue, setSelectedBgValue] = useState<string>(DEFAULT_ONBOARDING_BG);
  const [bgTab, setBgTab] = useState<'colors' | 'images'>('colors');
  const [customBgFile, setCustomBgFile] = useState<File | null>(null);
  const [customBgPreview, setCustomBgPreview] = useState<string | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const [cardTitle, setCardTitle] = useState('');
  const [createdCards, setCreatedCards] = useState<string[]>(['Planificar objetivos del equipo']);
  const [selectedPriority, setSelectedPriority] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P1');
  const [trelloImportTested, setTrelloImportTested] = useState(false);
  const [googleCalendarSyncTested, setGoogleCalendarSyncTested] = useState(false);
  const [droppedCol, setDroppedCol] = useState<number | null>(null);
  const cardDropped = droppedCol !== null;
  const [isMarkedDone, setIsMarkedDone] = useState(false);

  // Pointer-based Drag & Drop state (Genuine Lumins DragOverlay pattern)
  const [isDragging, setIsDragging] = useState(false);
  const [dragSource, setDragSource] = useState<'inbox' | 'col' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPointerPos, setDragPointerPos] = useState({ x: 0, y: 0 });
  const [dragCardSize, setDragCardSize] = useState({ width: 280, height: 90 });
  const [hoveredDropCol, setHoveredDropCol] = useState<number | null>(null);

  // Submit states
  const [isCreating, setIsCreating] = useState(false);
  const [creationStepMsg, setCreationStepMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset and initialize stepper state whenever it opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setWorkspaceName(user?.name ? `Espacio de ${user.name.split(' ')[0]}` : '');
      setWorkspaceType('🏢 Empresa / Pyme');
      setBoardName('Tareas Semanales');
      setSelectedBgValue(DEFAULT_ONBOARDING_BG);
      setBgTab('colors');
      setCustomBgFile(null);
      setCustomBgPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCardTitle('');
      setCreatedCards(['Planificar objetivos del equipo']);
      setSelectedPriority('P1');
      setTrelloImportTested(false);
      setGoogleCalendarSyncTested(false);
      setDroppedCol(null);
      setIsDragging(false);
      setDragSource(null);
      setHoveredDropCol(null);
      setIsMarkedDone(false);
      setIsCreating(false);
      setCreationStepMsg('');
      setError(null);
    }
  }, [isOpen, user]);

  const totalSteps = 6;

  const handleAddCard = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cardTitle.trim()) return;
    setCreatedCards(prev => [...prev, cardTitle.trim()]);
    setCardTitle('');
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 0 && !workspaceName.trim()) {
      setError('Por favor indica un nombre para tu espacio.');
      return;
    }
    if (currentStep === 1 && !boardName.trim()) {
      setError('Por favor indica un nombre para tu tablero.');
      return;
    }
    if (currentStep === 4 && !isMarkedDone) {
      setError('Por favor marca la tarjeta como lista haciendo clic en el recuadro.');
      return;
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setError(null);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (user?.id) {
      try {
        sessionStorage.setItem(`lumins_onboarding_dismissed_${user.id}`, 'true');
      } catch { }
    }
    onClose();
  };

  // Final Action: Create real workspace, board, lists and card
  const handleFinishAndCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // 1. Create Workspace
      setCreationStepMsg('Creando tu Espacio de Trabajo en Lumins...');
      const wsRes = await apiClient.post<any>('/api/workspaces', {
        name: workspaceName.trim(),
        description: `Espacio de trabajo para ${workspaceType}`
      });
      const newWorkspace = wsRes.data?.data?.workspace || wsRes.data?.workspace;
      if (!newWorkspace?.id) {
        throw new Error('No se pudo crear el espacio de trabajo.');
      }

      // 2. Create Board
      setCreationStepMsg('Configurando tu primer Tablero Kanban...');
      const boardRes = await apiClient.post<any>('/api/boards', {
        name: boardName.trim(),
        workspaceId: newWorkspace.id,
        visibility: 'WORKSPACE',
        background: selectedBgValue
      });
      const newBoard = boardRes.data?.data?.board || boardRes.data?.board;
      if (!newBoard?.id) {
        throw new Error('No se pudo crear el tablero.');
      }

      // 2b. Upload custom image background if the user picked a local file
      if (customBgFile) {
        setCreationStepMsg('Subiendo imagen de fondo...');
        try {
          const formData = new FormData();
          formData.append('background', customBgFile);
          await apiClient.post(`/api/boards/${newBoard.id}/background-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (bgErr) {
          console.warn('Could not upload custom board background during onboarding', bgErr);
        }
      }

      // 3. Get lists of the new board
      setCreationStepMsg('Organizando tus listas y tarjetas...');
      let firstListId: string | null = null;
      try {
        const listsRes = await apiClient.get<any>(`/api/lists/boards/${newBoard.id}/lists`);
        const lists = listsRes.data?.data?.lists || listsRes.data?.lists || [];
        if (lists.length > 0) {
          firstListId = lists[0].id;
        }
      } catch (err) {
        console.warn('Could not fetch lists directly, proceeding', err);
      }

      // 4. Create Card in the first list
      if (firstListId) {
        const cardNameToCreate = createdCards[0] || 'Planificar objetivos del equipo';
        const now = new Date();
        const calculatedDueDate = new Date(now.setDate(now.getDate() + 3)).toISOString();

        try {
          await apiClient.post(`/api/cards/lists/${firstListId}/cards`, {
            title: cardNameToCreate,
            priority: selectedPriority,
            dueDate: calculatedDueDate,
            description: 'Tarjeta configurada durante la bienvenida de Lumins.'
          });
        } catch (cardErr) {
          console.warn('Could not create initial card', cardErr);
        }
      }

      // 5. Update user preferences
      setCreationStepMsg('¡Todo listo! Ingresando...');
      if (user?.id) {
        try {
          localStorage.setItem(`lumins_onboarding_dismissed_${user.id}`, 'true');
          localStorage.setItem(`lumins_onboarding_completed_${user.id}`, 'true');
          localStorage.setItem('lastActiveWorkspaceId', newWorkspace.id);

          await apiClient.put('/api/users/profile', {
            preferences: {
              ...(user.preferences || {}),
              onboardingCompleted: true
            }
          });
        } catch (prefErr) {
          console.warn('Failed saving preferences:', prefErr);
        }
      }

      window.dispatchEvent(new CustomEvent('workspace-changed'));

      if (onCompleted) {
        onCompleted(newWorkspace.id, newBoard.id);
      }
      onClose();

      navigate(`/boards/${newBoard.id}`);

      // Open Theme Selection modal over the real board for live preview
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-theme-picker', { detail: { isPostOnboarding: true } }));
      }, 350);
    } catch (err: any) {
      console.error('Onboarding creation failed:', err);
      setError(err.response?.data?.message || err.message || 'Ocurrió un error al crear tu espacio.');
      setIsCreating(false);
    }
  };

  const mainCardTitle = createdCards[0] || (cardTitle.trim() || 'Planificar objetivos del equipo');

  // Genuine Lumins pointer drag handler (zero lag, no stuck transforms)
  const handleStartDrag = (e: React.PointerEvent, source: 'inbox' | 'col') => {
    // Only primary button (left mouse) or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Do not initiate drag if user interacted with the checkbox or a button
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('button, [data-checkbox-btn]')) {
      return;
    }

    const cardEl = e.currentTarget as HTMLElement;
    const rect = cardEl.getBoundingClientRect();

    setIsDragging(true);
    setDragSource(source);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDragPointerPos({ x: e.clientX, y: e.clientY });
    setDragCardSize({ width: rect.width, height: rect.height });
    setHoveredDropCol(source === 'col' ? droppedCol : 0);

    const onPointerMove = (moveEv: PointerEvent) => {
      moveEv.preventDefault();
      setDragPointerPos({ x: moveEv.clientX, y: moveEv.clientY });

      const colElements = Array.from(document.querySelectorAll('[data-column-id]'));
      let targetCol: number | null = null;
      for (let i = 0; i < colElements.length; i++) {
        const colRect = colElements[i].getBoundingClientRect();
        if (
          moveEv.clientX >= colRect.left - 20 &&
          moveEv.clientX <= colRect.right + 20 &&
          moveEv.clientY >= colRect.top - 80 &&
          moveEv.clientY <= colRect.bottom + 80
        ) {
          targetCol = i;
          break;
        }
      }
      setHoveredDropCol(targetCol);
    };

    const onPointerUp = (upEv: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      const colElements = Array.from(document.querySelectorAll('[data-column-id]'));
      let finalCol: number | null = null;
      for (let i = 0; i < colElements.length; i++) {
        const colRect = colElements[i].getBoundingClientRect();
        if (
          upEv.clientX >= colRect.left - 30 &&
          upEv.clientX <= colRect.right + 30 &&
          upEv.clientY >= colRect.top - 90 &&
          upEv.clientY <= colRect.bottom + 90
        ) {
          finalCol = i;
          break;
        }
      }

      if (finalCol !== null) {
        setDroppedCol(finalCol);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
      } else if (source === 'inbox' && upEv.clientX > rect.right + 15) {
        // Dragged into the general board area
        setDroppedCol(0);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
      }

      setIsDragging(false);
      setDragSource(null);
      setHoveredDropCol(null);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="onboarding-stepper-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.985 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none h-[100dvh] w-screen"
        >

          {/* Clean Lumins Ambient Background Mesh */}
          <div
            className="absolute inset-0 pointer-events-none opacity-80"
            style={{
              backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(18, 169, 168, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 85% 85%, rgba(255, 204, 64, 0.10) 0%, transparent 45%),
            radial-gradient(circle at 80% 20%, rgba(255, 102, 94, 0.07) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(18, 169, 168, 0.05) 0%, transparent 55%)
          `
            }}
          />

          {/* Animated Lumins Geometric Shapes (Logo Colors: Coral, Turquesa, Amarillo) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
            {/* Top-left: 3 ascending Lumins bars gently waving */}
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [-4, -1, -4] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-20 left-5 sm:top-24 sm:left-14 flex items-end gap-2 opacity-30 sm:opacity-45"
            >
              <motion.div
                animate={{ scaleY: [1, 1.18, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                className="w-3.5 sm:w-4 h-7 sm:h-9 rounded-lg bg-[#FF665E] origin-bottom"
              />
              <motion.div
                animate={{ scaleY: [1, 1.14, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
                className="w-3.5 sm:w-4 h-11 sm:h-14 rounded-lg bg-[#12A9A8] origin-bottom"
              />
              <motion.div
                animate={{ scaleY: [1, 1.12, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
                className="w-3.5 sm:w-4 h-14 sm:h-20 rounded-lg bg-[#FFCC40] origin-bottom"
              />
            </motion.div>

            {/* Top-right: floating rounded square + coral dot */}
            <motion.div
              animate={{ y: [0, 12, 0], x: [0, -6, 0], rotate: [12, 22, 12] }}
              transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-24 right-6 sm:top-28 sm:right-20 opacity-25 sm:opacity-40"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl border-[3px] border-[#12A9A8]/60 bg-[#12A9A8]/15" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -14, 0], scale: [1, 1.12, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="hidden sm:block absolute top-44 right-36 w-5 h-5 rounded-md bg-[#FF665E]/35 rotate-12"
            />

            {/* Bottom-left: floating rounded rectangle + yellow square */}
            <motion.div
              animate={{ y: [0, -12, 0], x: [0, 8, 0], rotate: [-10, -4, -10] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-16 left-6 sm:bottom-20 sm:left-20 opacity-25 sm:opacity-40"
            >
              <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-2xl bg-[#FFCC40]/25 border-[3px] border-[#FFCC40]/60" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
              className="hidden sm:block absolute bottom-40 left-36 w-4 h-10 rounded-full bg-[#12A9A8]/30 rotate-[20deg]"
            />

            {/* Bottom-right: coral rounded bar + turquoise pill */}
            <motion.div
              animate={{ y: [0, 10, 0], rotate: [6, 12, 6] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              className="absolute bottom-16 right-6 sm:bottom-24 sm:right-16 flex items-end gap-2 opacity-25 sm:opacity-45"
            >
              <div className="w-3.5 sm:w-4 h-12 sm:h-16 rounded-lg bg-[#FF665E]/80" />
              <div className="w-3.5 sm:w-4 h-8 sm:h-11 rounded-lg bg-[#12A9A8]/80" />
              <div className="w-3.5 sm:w-4 h-5 sm:h-7 rounded-lg bg-[#FFCC40]/90" />
            </motion.div>
          </div>

          {/* 1. TOP HEADER (Native App Bar on Mobile / Trello-Style on Desktop) */}
          <header className="relative z-20 h-14 sm:h-16 px-4 sm:px-10 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md shrink-0">
            {/* Brand Logo & Name / Mobile Back */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  disabled={isCreating}
                  className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all sm:hidden active:scale-90"
                  aria-label="Atrás"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <BrandLogo size="sm" variant="dark-text" />
            </div>

            {/* Center Progress Stepper (Pills & Arrows) */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0 || isCreating}
                className={`p-1.5 text-slate-500 hover:text-slate-900 rounded-lg transition-all hidden sm:block ${currentStep === 0 || isCreating ? 'opacity-20 cursor-not-allowed' : 'opacity-100 hover:scale-105 hover:bg-slate-100'
                  }`}
                title="Anterior"
              >
                <ArrowLeft size={18} />
              </button>

              {/* Stepper Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {Array.from({ length: totalSteps }).map((_, idx) => {
                  const isPast = idx < currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${isCurrent
                        ? 'w-7 sm:w-10 bg-[#12A9A8] shadow-[0_0_10px_rgba(18,169,168,0.4)]'
                        : isPast
                          ? 'w-3 sm:w-6 bg-[#12A9A8]/40'
                          : 'w-3 sm:w-6 bg-slate-200'
                        }`}
                    />
                  );
                })}
              </div>

              <button
                onClick={handleNext}
                disabled={currentStep === totalSteps - 1 || isCreating}
                className={`p-1.5 text-slate-500 hover:text-slate-900 rounded-lg transition-all hidden sm:block ${currentStep === totalSteps - 1 || isCreating ? 'opacity-20 cursor-not-allowed' : 'opacity-100 hover:scale-105 hover:bg-slate-100'
                  }`}
                title="Siguiente"
              >
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Close / Skip Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkip}
                disabled={isCreating}
                className="text-xs font-semibold px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Cerrar y saltar"
              >
                <span className="hidden sm:inline">Omitir</span>
                <X size={18} className="sm:hidden" />
              </button>
            </div>
          </header>

          {/* 2. MAIN CONTENT STAGE */}
          <main className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col items-center justify-start sm:justify-center">
            <div className="w-full max-w-6xl mx-auto flex flex-col items-center">

              <AnimatePresence mode="wait">
                {/* ═════════════════════════════════════════════════════════════ */}
                {/* STEP 0: CREAR ESPACIO DE TRABAJO */}
                {/* ═════════════════════════════════════════════════════════════ */}
                {currentStep === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-xl flex flex-col items-center text-center space-y-6 sm:space-y-7"
                  >
                    <div className="space-y-2 max-w-xl px-2">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        Crea tu Espacio de Trabajo
                      </h1>
                      <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed">
                        En Lumins, todos los tableros y proyectos de tu equipo viven dentro de un espacio unificado.
                      </p>
                    </div>

                    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 text-left space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Nombre de tu Espacio o Empresa
                        </label>
                        <input
                          type="text"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          placeholder="Ej. Acme Studio, Mi Empresa, Lumins Team"
                          className="w-full h-9 bg-slate-50/90 border border-slate-200 rounded-lg px-3 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#12A9A8] focus:ring-2 focus:ring-[#12A9A8]/15 transition-all"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Tipo de Organización
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {ORGANIZATION_TYPES.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setWorkspaceType(type)}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between ${workspaceType === type
                                ? 'bg-[#12A9A8]/10 border-[#12A9A8] text-[#0E8786] shadow-xs font-bold ring-1 ring-[#12A9A8]'
                                : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'
                                }`}
                            >
                              <span>{type}</span>
                              {workspaceType === type && <Check size={13} className="text-[#12A9A8]" strokeWidth={2.5} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleNext}
                      disabled={!workspaceName.trim()}
                      className="w-full sm:w-auto h-9 px-6 rounded-lg font-bold text-xs bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-xs active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Continuar
                    </button>
                  </motion.div>
                )}

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* STEP 1: TU PRIMER TABLERO KANBAN */}
                {/* ═════════════════════════════════════════════════════════════ */}
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-xl flex flex-col items-center text-center space-y-5 sm:space-y-6"
                  >
                    <div className="space-y-1.5 max-w-xl px-2">
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                        Nombra tu primer Tablero
                      </h1>
                      <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed">
                        Cada tablero organiza un proyecto, sprint o área operativa con listas y tarjetas.
                      </p>
                    </div>

                    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 text-left space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Nombre del Tablero
                        </label>
                        <input
                          type="text"
                          value={boardName}
                          onChange={(e) => setBoardName(e.target.value)}
                          placeholder="Ej. Tareas Semanales, Lanzamiento Web"
                          className="w-full h-9 bg-slate-50/90 border border-slate-200 rounded-lg px-3 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#12A9A8] focus:ring-2 focus:ring-[#12A9A8]/15 transition-all"
                          autoFocus
                        />
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-500 mb-1.5 font-medium">Sugerencias rápidas:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {BOARD_NAME_SUGGESTIONS.map((sug, i) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setBoardName(sug)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${boardName === sug
                                ? 'bg-[#12A9A8]/10 border-[#12A9A8] text-[#0E8786] font-semibold'
                                : i === 1
                                  ? 'bg-[#FF665E]/10 border-[#FF665E]/30 text-[#FF665E] hover:bg-[#FF665E]/20'
                                  : i === 2
                                    ? 'bg-[#FFCC40]/15 border-[#FFCC40]/40 text-amber-700 hover:bg-[#FFCC40]/25'
                                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700 border-slate-200/70 hover:border-slate-300'
                                }`}
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Color y Fondo del Tablero
                          </label>
                          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/80">
                            <button
                              type="button"
                              onClick={() => setBgTab('colors')}
                              className={`h-6 px-2.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-all ${
                                bgTab === 'colors'
                                  ? 'bg-white text-[#0E8786] shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Palette size={12} />
                              <span>Colores</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setBgTab('images')}
                              className={`h-6 px-2.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-all ${
                                bgTab === 'images'
                                  ? 'bg-white text-[#0E8786] shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <ImageIcon size={12} />
                              <span>Imágenes</span>
                            </button>
                          </div>
                        </div>

                        {bgTab === 'colors' ? (
                          <div className="grid grid-cols-6 gap-2 max-h-28 overflow-y-auto p-1 custom-scrollbar">
                            {PLATFORM_COLOR_PRESETS.map((choice) => {
                              const presetValue = `${choice.value}?tone=dark&lava=true`;
                              const isActive = !customBgFile && selectedBgValue.startsWith(choice.value);
                              return (
                                <button
                                  key={choice.id}
                                  type="button"
                                  onClick={() => {
                                    setCustomBgFile(null);
                                    if (customBgPreview) {
                                      URL.revokeObjectURL(customBgPreview);
                                      setCustomBgPreview(null);
                                    }
                                    setSelectedBgValue(presetValue);
                                  }}
                                  className={`h-8 rounded-lg border flex items-center justify-center transition-all ${choice.value} ${
                                    isActive
                                      ? 'ring-2 ring-[#12A9A8] ring-offset-1 scale-105 shadow-sm border-white'
                                      : 'opacity-85 hover:opacity-100 border-white/40'
                                  }`}
                                  title={choice.name}
                                >
                                  {isActive && (
                                    <Check size={12} className="text-white drop-shadow" strokeWidth={3} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                              <input
                                ref={bgFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (customBgPreview) URL.revokeObjectURL(customBgPreview);
                                  const preview = URL.createObjectURL(file);
                                  setCustomBgFile(file);
                                  setCustomBgPreview(preview);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => bgFileInputRef.current?.click()}
                                className={`h-8 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
                                  customBgFile
                                    ? 'border-[#12A9A8] bg-[#12A9A8]/10 text-[#0E8786]'
                                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Upload size={13} />
                                <span>{customBgFile ? 'Cambiar imagen subida' : 'Subir imagen propia'}</span>
                              </button>
                              {customBgPreview && (
                                <div className="h-8 w-14 rounded-md overflow-hidden border border-[#12A9A8] shrink-0 relative">
                                  <img src={customBgPreview} alt="Fondo personalizado" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-4 gap-2 max-h-28 overflow-y-auto p-1 custom-scrollbar">
                              {UNSPLASH_CURATED_WALLPAPERS.map((img) => {
                                const isActive = !customBgFile && selectedBgValue === img.fullUrl;
                                return (
                                  <button
                                    key={img.id}
                                    type="button"
                                    onClick={() => {
                                      setCustomBgFile(null);
                                      if (customBgPreview) {
                                        URL.revokeObjectURL(customBgPreview);
                                        setCustomBgPreview(null);
                                      }
                                      setSelectedBgValue(img.fullUrl);
                                    }}
                                    className={`relative h-11 rounded-lg overflow-hidden border transition-all ${
                                      isActive
                                        ? 'ring-2 ring-[#12A9A8] ring-offset-1 scale-[1.03] border-white shadow-sm'
                                        : 'border-slate-200 opacity-85 hover:opacity-100'
                                    }`}
                                    title={`Foto de ${img.author}`}
                                  >
                                    <img
                                      src={img.thumbUrl}
                                      alt={img.id}
                                      loading="lazy"
                                      className="w-full h-full object-cover"
                                    />
                                    {isActive && (
                                      <span className="absolute inset-0 bg-[#12A9A8]/25 flex items-center justify-center">
                                        <Check size={13} className="text-white drop-shadow" strokeWidth={3} />
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleNext}
                      disabled={!boardName.trim()}
                      className="w-full sm:w-auto h-9 px-6 rounded-lg font-bold text-xs bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-xs active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Continuar
                    </button>
                  </motion.div>
                )}

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* STEP 2: CREA TU PRIMERA TARJETA (COMO EN TRELLO) */}
                {/* ═════════════════════════════════════════════════════════════ */}
                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-lg flex flex-col items-center text-center space-y-6"
                  >
                    <div className="space-y-2 max-w-xl px-2">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        Añade una tarea a tu lista
                      </h1>
                      <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed">
                        Comencemos agregando tu primera tarea pendiente como tarjeta en tu tablero de Lumins.
                      </p>
                    </div>

                    {/* Simulated Lumins List */}
                    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xl shadow-slate-200/50 text-left space-y-3.5">
                      {/* Column Header */}
                      <div className="flex items-center gap-2 px-1 text-slate-800 font-bold text-xs uppercase tracking-wider">
                        <CheckSquare size={15} className="text-[#12A9A8]" />
                        <span>Lista de tareas</span>
                      </div>

                      {/* Input Card */}
                      <div className="bg-slate-50/90 border border-slate-200 rounded-lg p-2.5 focus-within:bg-white focus-within:border-[#12A9A8] focus-within:ring-2 focus-within:ring-[#12A9A8]/15 transition-all">
                        <textarea
                          rows={2}
                          value={cardTitle}
                          onChange={(e) => setCardTitle(e.target.value)}
                          placeholder="¿Qué hay en tu lista de tareas por hacer?"
                          className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none resize-none font-medium"
                          autoFocus
                        />
                        <div className="flex justify-end pt-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddCard()}
                            disabled={!cardTitle.trim()}
                            className={`h-7 px-3 rounded-md text-[11px] font-bold transition-all ${!cardTitle.trim()
                              ? 'opacity-40 bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-[#12A9A8] text-white hover:bg-[#0E8786] active:scale-95 shadow-xs cursor-pointer'
                              }`}
                          >
                            Añadir tarjeta
                          </button>
                        </div>
                      </div>

                      {/* Existing Cards */}
                      <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                        {createdCards.map((title, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-800 shadow-xs flex items-center justify-between"
                          >
                            <span className="truncate pr-2 font-medium">{title}</span>
                            <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${idx % 3 === 0
                              ? 'text-[#FF665E] bg-[#FF665E]/10 border-[#FF665E]/30'
                              : idx % 3 === 1
                                ? 'text-amber-800 bg-[#FFCC40]/15 border-[#FFCC40]/30'
                                : 'text-[#0E8786] bg-[#12A9A8]/10 border-[#12A9A8]/30'
                              }`}>
                              {idx % 3 === 0 ? 'Prioridad' : idx % 3 === 1 ? 'En proceso' : 'Nueva'}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleNext}
                      className="w-full sm:w-auto h-9 px-6 rounded-lg font-bold text-xs bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Continuar
                    </button>
                  </motion.div>
                )}

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* STEP 3: CONECTA TRELLO Y GOOGLE CALENDAR (CON LOGOS REALES) */}
                {/* ═════════════════════════════════════════════════════════════ */}
                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-4xl flex flex-col items-center text-center space-y-6"
                  >
                    <div className="space-y-2 max-w-xl px-2">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        Reúne todas tus tareas en Lumins
                      </h1>
                      <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed">
                        Conecta tus herramientas favoritas para importar proyectos existentes y sincronizar tus fechas de entrega.
                      </p>
                    </div>

                    {/* Central Diagram with Real Logos and Doodle Arrows */}
                    <div className="w-full max-w-3xl relative py-3 sm:py-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0">

                      {/* Left: Trello Card & Arrow */}
                      <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-md flex flex-col items-center text-center w-full sm:w-48 hover:border-[#0079BF] hover:shadow-lg transition-all group">
                          <div className="w-11 h-11 rounded-xl bg-[#0079BF]/10 flex items-center justify-center mb-2 shadow-inner">
                            <TrelloLogo size={24} />
                          </div>
                          <div className="font-bold text-xs text-slate-800">Trello</div>
                          <div className="text-[10px] text-slate-500 mb-2.5">Importador Nativo</div>

                          <button
                            type="button"
                            onClick={() => {
                              setTrelloImportTested(true);
                              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                            }}
                            className={`text-[10px] font-bold px-3 py-1 rounded-md transition-all w-full sm:w-auto cursor-pointer ${trelloImportTested
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-[#0079BF] text-white hover:bg-[#026AA7]'
                              }`}
                          >
                            {trelloImportTested ? '✓ Disponible' : 'Probar Trello'}
                          </button>
                        </div>

                        {/* Arrow pointing right */}
                        <svg className="w-16 h-8 text-slate-400 overflow-visible hidden sm:block" viewBox="0 0 60 30" fill="none">
                          <path d="M 5 20 Q 30 5 55 15" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                          <polygon points="55,10 60,16 53,18" fill="currentColor" />
                        </svg>
                      </div>

                      {/* Center: Lumins Board List */}
                      <div className="w-full sm:w-64 sm:mx-4 bg-white border-2 border-[#12A9A8] shadow-xl shadow-[#12A9A8]/15 rounded-2xl p-4 text-left relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                            <span className="w-2 h-2 rounded-full bg-[#12A9A8]" />
                            <span>Tablero Lumins</span>
                          </div>
                          <span className="text-[10px] font-semibold text-[#12A9A8] bg-[#12A9A8]/10 border border-[#12A9A8]/30 px-2.5 py-0.5 rounded-full">
                            En vivo
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {mainCardTitle}
                          </div>

                          {trelloImportTested && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-[10px] bg-[#0079BF]/10 border border-[#0079BF]/20 text-[#0079BF] px-2 py-1 rounded-md flex items-center gap-1.5 font-medium"
                            >
                              <TrelloLogo size={12} />
                              <span>Tarjeta importada de Trello</span>
                            </motion.div>
                          )}

                          {googleCalendarSyncTested && (
                            <motion.div
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-md flex items-center gap-1.5 font-medium"
                            >
                              <GoogleCalendarIcon size={12} />
                              <span>Sincronizado con GCalendar</span>
                            </motion.div>
                          )}

                          <div className="pt-1.5 flex items-center justify-between text-[10px] border-t border-slate-200/60 font-medium">
                            <span className="text-[#FF665E] bg-[#FF665E]/10 px-1.5 py-0.5 rounded border border-[#FF665E]/20 font-semibold">Prioridad P1</span>
                            <span className="text-amber-800 bg-[#FFCC40]/15 px-1.5 py-0.5 rounded border border-[#FFCC40]/25 font-semibold">Vence en 3 días</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Google Calendar Card & Arrow */}
                      <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-md flex flex-col items-center text-center w-full sm:w-48 hover:border-emerald-500 hover:shadow-lg transition-all group">
                          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-2 shadow-inner">
                            <GoogleCalendarIcon size={24} />
                          </div>
                          <div className="font-bold text-xs text-slate-800">Google Calendar</div>
                          <div className="text-[10px] text-slate-500 mb-2.5">Sincronización Bidireccional</div>

                          <button
                            type="button"
                            onClick={() => {
                              setGoogleCalendarSyncTested(true);
                              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                            }}
                            className={`text-[10px] font-bold px-3 py-1 rounded-md transition-all w-full sm:w-auto cursor-pointer ${googleCalendarSyncTested
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                          >
                            {googleCalendarSyncTested ? '✓ Sincronizado' : 'Probar GCalendar'}
                          </button>
                        </div>

                        {/* Arrow pointing left */}
                        <svg className="w-16 h-8 text-slate-400 overflow-visible hidden sm:block" viewBox="0 0 60 30" fill="none">
                          <path d="M 55 20 Q 30 5 5 15" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                          <polygon points="5,10 0,16 7,18" fill="currentColor" />
                        </svg>
                      </div>

                    </div>

                    <button
                      onClick={handleNext}
                      className="w-full sm:w-auto h-9 px-6 rounded-lg font-bold text-xs bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Continuar
                    </button>
                  </motion.div>
                )}

              {/* ═════════════════════════════════════════════════════════════ */}
              {/* STEP 4: EMPECEMOS A ORGANIZARNOS (TABLERO ANCHO + RESPONSIVE NATIVO) */}
              {/* ═════════════════════════════════════════════════════════════ */}
              {currentStep === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="w-full max-w-6xl flex flex-col items-center text-center space-y-4 sm:space-y-6"
                >
                  <div className="space-y-1.5 max-w-2xl px-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      Empecemos a organizarnos
                    </h1>
                    <p className="text-slate-600 text-xs sm:text-sm font-normal">
                      Aprende a mover tareas a tu tablero y marcarlas como listas en un instante.
                    </p>
                  </div>

                  {/* Modern Minimalist Guide Indicator */}
                  {!cardDropped ? (
                    <Alert variant="pill" tone="coral" title="Paso 1" pulse>
                      Haz clic o arrastra la tarjeta a cualquier columna
                    </Alert>
                  ) : !isMarkedDone ? (
                    <Alert variant="pill" tone="amber" title="Paso 2" pulse>
                      Toca la casilla en la tarjeta para marcarla como lista
                    </Alert>
                  ) : (
                    <Alert variant="pill" tone="teal" title="Completado">
                      ¡Excelente! Pulsa continuar para finalizar
                    </Alert>
                  )}

                  {/* Drag & Drop Stage: WIDE BOARD CANVAS */}
                  <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-start justify-center gap-3.5 sm:gap-5 relative">

                    {/* LEFT: Bandeja de Entrada */}
                    <div className="w-full lg:w-60 bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-lg shadow-slate-200/50 text-left relative z-10 shrink-0">
                      <div className="flex items-center justify-between mb-2.5 text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <CheckSquare size={15} className="text-[#12A9A8]" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">
                            Bandeja de entrada
                          </span>
                        </div>
                        {!cardDropped && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200/70 font-semibold px-1.5 py-0.5 rounded-full lg:hidden">
                            Toca
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {/* Interactive Card */}
                        {!cardDropped ? (
                          <div
                            onPointerDown={(e) => handleStartDrag(e, 'inbox')}
                            onClick={() => {
                              if (!isDragging) {
                                setDroppedCol(0);
                                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                              }
                            }}
                            className={`bg-white text-slate-900 border border-slate-200 border-l-4 border-l-[#12A9A8] rounded-xl p-2.5 shadow-xs cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.01] active:scale-95 group touch-none select-none transition-all ${isDragging && dragSource === 'inbox' ? 'opacity-30 border-dashed' : 'opacity-100'
                              }`}
                            title="Toca o arrastra esta tarjeta hacia cualquiera de las 3 columnas del tablero"
                          >
                            <div className="font-semibold text-xs text-slate-900 mb-1.5 truncate">
                              {mainCardTitle}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100 font-medium">
                              <span className="flex items-center gap-1 text-slate-600 whitespace-nowrap">
                                <Clock size={10} className="text-slate-400" /> 18 nov
                              </span>
                              <span className="text-[#12A9A8] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5 text-[10px] whitespace-nowrap">
                                <span>Mover</span> →
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed border-slate-200 rounded-xl py-2 px-3 text-center text-xs text-slate-400 bg-slate-50/60 font-medium">
                            ✓ Bandeja organizada
                          </div>
                        )}

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs text-slate-500">
                          <div className="truncate text-[11px] font-medium">Míralo, envíalo y guárdalo para más tarde</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Mail size={10} /> Correo
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Doodle arrow on desktop */}
                    {!cardDropped && (
                      <div className="hidden xl:block absolute left-[245px] top-[25px] z-20 pointer-events-none">
                        <svg className="w-24 h-16 text-[#FFCC40] overflow-visible" viewBox="0 0 100 60" fill="none">
                          <path d="M 5 20 Q 50 0 90 40" stroke="currentColor" strokeWidth="3" strokeDasharray="5 3" />
                          <polygon points="90,40 78,35 84,27" fill="currentColor" />
                        </svg>
                      </div>
                    )}

                    {/* RIGHT: WIDE GENUINE LUMINS BOARD CANVAS */}
                    <div className={`flex-1 w-full rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200 shadow-xl shadow-slate-200/60 transition-all ${!customBgPreview && !selectedBgValue.startsWith('http') && !selectedBgValue.startsWith('/') ? selectedBgValue.split('?')[0] : 'bg-slate-100'} text-left relative overflow-hidden`}>

                      {/* Lumins Board Header Bar */}
                      <div className="flex items-center justify-between gap-3 mb-2.5 sm:mb-3 bg-white/90 backdrop-blur-md px-3 sm:px-3.5 py-2 rounded-xl border border-white/60 shadow-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-[#12A9A8] flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
                            {boardName.trim().charAt(0).toUpperCase() || 'L'}
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate">
                              {boardName.trim() || 'Tareas Semanales'}
                            </h2>
                          </div>
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600 border border-slate-200 shrink-0">
                            Espacio de Trabajo
                          </span>
                        </div>

                        {/* Header right pills */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-6 h-6 rounded-full bg-[#12A9A8] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                            UN
                          </span>
                          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-lg border border-slate-200">
                            <Filter size={10} /> Filtros
                          </div>
                          <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-lg border border-slate-200">
                            <Users size={10} /> Miembros
                          </div>
                        </div>
                      </div>

                      {/* Columns Row */}
                      <div className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1 custom-scrollbar">
                        {[
                          { id: 0, title: 'Lista de tareas' },
                          { id: 1, title: 'En proceso' },
                          { id: 2, title: 'Hecho' },
                        ].map((col) => {
                          const isTargetColumn = droppedCol === col.id;
                          const isHoveredDuringDrag = isDragging && hoveredDropCol === col.id;
                          return (
                            <div
                              key={col.id}
                              data-column-id={col.id}
                              onClick={() => {
                                if (!isDragging && droppedCol !== col.id) {
                                  setDroppedCol(col.id);
                                  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                                }
                              }}
                              className={`w-[82vw] sm:w-auto shrink-0 snap-center bg-white/95 backdrop-blur-sm text-slate-900 rounded-xl border shadow-xs p-2.5 sm:p-3 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] transition-all select-none ${isHoveredDuringDrag
                                ? 'border-[#12A9A8] ring-2 ring-[#12A9A8]/30 bg-teal-50/70'
                                : 'border-slate-200/90'
                                } ${!isTargetColumn ? 'hover:border-[#12A9A8]/40 cursor-pointer' : ''}`}
                            >
                              <div>
                                {/* Column Header */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-800">{col.title}</span>
                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
                                      {isTargetColumn ? '1' : '0'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-slate-400">
                                    <Plus size={12} />
                                  </div>
                                </div>

                                {/* Content: Dropped Card OR Drop Target */}
                                {isTargetColumn ? (
                                  <div
                                    onPointerDown={(e) => handleStartDrag(e, 'col')}
                                    className={`bg-white border rounded-lg p-2 sm:p-2.5 shadow-xs relative border-l-4 border-l-[#12A9A8] select-none cursor-grab active:cursor-grabbing hover:shadow-md transition-all touch-none ${isDragging && dragSource === 'col'
                                      ? 'opacity-30 border-dashed border-[#12A9A8]'
                                      : isMarkedDone
                                        ? 'border-emerald-300 ring-1 ring-emerald-200/80 shadow-xs'
                                        : 'border-slate-200'
                                      }`}
                                    title="Arrastra para mover a otra columna o haz clic en el check para marcarla como lista"
                                  >
                                    <div className="flex items-start gap-2">
                                      {/* Touch-friendly Checkbox */}
                                      <div className="relative shrink-0 mt-0.5" data-checkbox-btn>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMarkedDone(!isMarkedDone);
                                            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(25);
                                          }}
                                          className={`w-[18px] h-[18px] min-w-[18px] min-h-[18px] rounded-[5px] border-[1.5px] shrink-0 flex items-center justify-center transition-all cursor-pointer ${isMarkedDone
                                            ? 'bg-[#12A9A8] border-[#12A9A8] text-white shadow-xs'
                                            : 'border-slate-300 bg-white hover:border-[#12A9A8] hover:bg-slate-50 shadow-xs'
                                            }`}
                                          title="Haz clic para marcar como lista"
                                        >
                                          {isMarkedDone && <Check size={11} strokeWidth={3} className="text-white" />}
                                        </button>
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className={`font-semibold text-xs leading-snug truncate transition-all ${isMarkedDone ? 'line-through text-slate-400' : 'text-slate-900'
                                          }`}>
                                          {mainCardTitle}
                                        </div>

                                        <div className="flex items-center justify-between gap-1 text-[10px] mt-1.5 pt-1.5 border-t border-slate-100 font-medium">
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <Badge variant="soft" size="xs" tone="coral">
                                              Alta
                                            </Badge>
                                            <Badge variant="subtle" size="xs" icon={<Clock size={9} />}>
                                              18 nov
                                            </Badge>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setIsMarkedDone(!isMarkedDone);
                                              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(25);
                                            }}
                                            className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold transition-all flex items-center gap-0.5 cursor-pointer whitespace-nowrap shrink-0 ${isMarkedDone
                                              ? 'text-[#0E8786] bg-[#12A9A8]/10'
                                              : 'text-[#FF665E] bg-[#FF665E]/10 hover:bg-[#FF665E]/20 border border-[#FF665E]/20'
                                              }`}
                                          >
                                            <Check size={10} strokeWidth={2.5} />
                                            <span>{isMarkedDone ? 'Completada' : 'Marcar lista'}</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => {
                                      if (!isDragging) {
                                        setDroppedCol(col.id);
                                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                                      }
                                    }}
                                    className={`border-2 border-dashed rounded-lg py-3 px-2 text-center transition-all cursor-pointer min-h-[64px] flex flex-col items-center justify-center ${isHoveredDuringDrag
                                      ? 'border-[#12A9A8] bg-[#12A9A8]/10 scale-[1.01] text-[#12A9A8]'
                                      : 'border-slate-200 bg-slate-50/70 hover:border-[#12A9A8] hover:bg-[#12A9A8]/5 text-slate-500'
                                      }`}
                                    title={`Mover tarjeta a ${col.title}`}
                                  >
                                    <span className="text-[11px] font-bold">Mover aquí</span>
                                    <span className="text-[9.5px] text-slate-400 mt-0.5">arrastra o haz clic</span>
                                  </div>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-400 font-medium pt-1.5 flex items-center gap-1 hover:text-slate-700 cursor-pointer">
                                <Plus size={11} /> Añadir tarjeta
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  <div className="pt-2 flex flex-col items-center">
                    <button
                      onClick={handleNext}
                      disabled={!isMarkedDone}
                      className={`w-full sm:w-auto h-9 px-6 rounded-lg font-bold text-xs transition-all shadow-xs active:scale-[0.98] flex items-center justify-center gap-2 ${isMarkedDone
                        ? 'bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-md shadow-[#12A9A8]/20 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                        }`}
                    >
                      <span>{isMarkedDone ? 'Continuar' : 'Marca la tarea como lista para continuar'}</span>
                      {isMarkedDone && <ArrowRight size={14} />}
                    </button>
                  </div>

                  {/* Floating Drag Overlay following cursor/touch with zero delay */}
                  {isDragging && (
                    <div
                      className="fixed pointer-events-none z-[99999] transition-none"
                      style={{
                        left: `${dragPointerPos.x - dragOffset.x}px`,
                        top: `${dragPointerPos.y - dragOffset.y}px`,
                        width: `${dragCardSize.width}px`,
                        transform: 'scale(1.05) rotate(2deg)',
                        filter: 'drop-shadow(0 15px 20px rgba(0, 0, 0, 0.15))',
                        willChange: 'left, top, transform',
                      }}
                    >
                      <div className={`bg-white border rounded-xl p-3 shadow-2xl border-l-4 border-l-[#12A9A8] ${isMarkedDone ? 'border-emerald-300 ring-2 ring-emerald-200/60' : 'border-slate-200'
                        }`}>
                        <div className="flex items-start gap-2.5">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${isMarkedDone ? 'bg-[#12A9A8] border-[#12A9A8] text-white' : 'border-slate-300 bg-slate-50'
                            }`}>
                            {isMarkedDone && <Check size={12} strokeWidth={3} className="text-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`font-bold text-xs sm:text-sm leading-snug truncate ${isMarkedDone ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}>
                              {mainCardTitle}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2 pt-1 border-t border-slate-100 font-medium">
                              <span className="flex items-center gap-1 text-[#FF665E] font-semibold bg-[#FF665E]/10 px-1.5 py-0.2 rounded">
                                Alta
                              </span>
                              <span className="flex items-center gap-1 text-slate-600">
                                <Clock size={11} className="text-slate-400" /> 18 nov
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ═════════════════════════════════════════════════════════════ */}
              {/* STEP 5: ¡HECHO! (FINAL CELEBRATION) */}
              {/* ═════════════════════════════════════════════════════════════ */}
              {currentStep === 5 && (
                <motion.div
                  key="step-5"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="w-full max-w-lg flex flex-col items-center text-center space-y-6"
                >
                  <div className="space-y-2 px-2">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                      ¡Todo listo!
                    </h1>
                    <p className="text-slate-600 text-xs sm:text-sm font-normal">
                      Tu espacio y tu tablero se han guardado listos para usarse en Lumins.
                    </p>
                  </div>

                  {/* Continue CTA Button */}
                  <div className="w-full flex flex-col items-center gap-3">
                    <button
                      onClick={handleFinishAndCreate}
                      disabled={isCreating}
                      className="w-full sm:w-56 h-9 px-5 rounded-lg font-bold text-xs bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-white" />
                          <span className="text-[11px]">{creationStepMsg || 'Creando...'}</span>
                        </>
                      ) : (
                        <span>Comenzar a usar Lumins</span>
                      )}
                    </button>

                    {error && (
                      <div className="w-full bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  {/* Visual Preview */}
                  <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 shadow-xl shadow-slate-200/50 text-left space-y-3">
                    <div className="flex items-center gap-2 text-slate-800">
                      <CheckSquare size={16} className="text-[#12A9A8]" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {boardName.trim() || 'Tablero'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-800">
                        <div className="font-bold text-slate-900">{mainCardTitle}</div>
                        <div className="text-[10px] mt-1.5 flex items-center gap-1.5">
                          <span className="text-[#FF665E] font-semibold bg-[#FF665E]/10 px-1.5 py-0.5 rounded border border-[#FF665E]/20">P1 Alta</span>
                          <span className="text-amber-800 font-semibold bg-[#FFCC40]/15 px-1.5 py-0.5 rounded border border-[#FFCC40]/25">18 nov</span>
                          <span className="text-[#0E8786] font-semibold bg-[#12A9A8]/10 px-1.5 py-0.5 rounded border border-[#12A9A8]/20">Lista</span>
                        </div>
                      </div>

                      <div className="bg-slate-50/60 border border-slate-200/60 rounded-xl p-2.5 text-xs text-slate-500 text-center font-medium">
                        + Agrega más tarjetas desde tu nuevo tablero
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>
        </motion.div>
  )
}
    </AnimatePresence >,
  document.body
  );
};

export default OnboardingStepperModal;
