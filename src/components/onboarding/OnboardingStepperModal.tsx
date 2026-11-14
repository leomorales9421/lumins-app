import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Layout, 
  CheckSquare, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
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
  Archive
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleCalendarIcon } from '../ui/GoogleCalendarIcon';

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

const BOARD_BACKGROUND_CHOICES = [
  { id: 'galaxy', name: 'Galaxia', value: 'bg-gradient-to-br from-indigo-500 to-indigo-800' },
  { id: 'amethyst', name: 'Amatista', value: 'bg-gradient-to-br from-fuchsia-500 to-indigo-600' },
  { id: 'deep-sea', name: 'Mar Profundo', value: 'bg-gradient-to-br from-blue-600 to-indigo-900' },
  { id: 'cyberpunk', name: 'Cyberpunk', value: 'bg-gradient-to-br from-indigo-500 to-fuchsia-600' },
  { id: 'midnight', name: 'Medianoche', value: 'bg-gradient-to-br from-slate-800 to-zinc-900' },
];

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
  const [selectedBg, setSelectedBg] = useState(BOARD_BACKGROUND_CHOICES[0]);
  const [cardTitle, setCardTitle] = useState('');
  const [createdCards, setCreatedCards] = useState<string[]>(['Planificar objetivos del equipo']);
  const [selectedPriority, setSelectedPriority] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P1');
  const [trelloImportTested, setTrelloImportTested] = useState(false);
  const [googleCalendarSyncTested, setGoogleCalendarSyncTested] = useState(false);
  const [cardDropped, setCardDropped] = useState(false);
  const [isMarkedDone, setIsMarkedDone] = useState(false);
  const [isOverDropZone, setIsOverDropZone] = useState(false);

  // Submit states
  const [isCreating, setIsCreating] = useState(false);
  const [creationStepMsg, setCreationStepMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Pre-fill workspace name with user's name if empty
  useEffect(() => {
    if (user?.name && !workspaceName) {
      setWorkspaceName(`Espacio de ${user.name.split(' ')[0]}`);
    }
  }, [user, workspaceName]);

  if (!isOpen) return null;

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
      } catch {}
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
        background: selectedBg.value
      });
      const newBoard = boardRes.data?.data?.board || boardRes.data?.board;
      if (!newBoard?.id) {
        throw new Error('No se pudo crear el tablero.');
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#2A2568] text-white font-sans overflow-hidden select-none h-[100dvh] w-screen">
      
      {/* Lumins Brand Gradient Overlay (Deep Saturated Indigo/Violet) */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          background: 'radial-gradient(ellipse at 50% 15%, #3C358D 0%, #2A2568 60%, #1D194B 100%)' 
        }} 
      />

      {/* Decorative Brand Circles */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-[#6C5DD3]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-[#4338CA]/20 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP HEADER (Native App Bar on Mobile / Trello-Style on Desktop) */}
      <header className="relative z-20 h-14 sm:h-16 px-4 sm:px-10 flex items-center justify-between border-b border-white/5 bg-[#2A2568]/40 backdrop-blur-md shrink-0">
        {/* Brand Logo & Name / Mobile Back */}
        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              disabled={isCreating}
              className="p-1.5 -ml-1 text-white/80 hover:text-white rounded-lg transition-all sm:hidden active:scale-90"
              aria-label="Atrás"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <img 
            src="/lumins-log.webp" 
            alt="Lumins" 
            className="h-7 sm:h-8 w-auto object-contain drop-shadow" 
          />
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white hidden xs:inline">
            Lumins
          </span>
        </div>

        {/* Center Progress Stepper (Pills & Arrows) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0 || isCreating}
            className={`p-1.5 text-white/70 hover:text-white rounded-lg transition-all hidden sm:block ${
              currentStep === 0 || isCreating ? 'opacity-20 cursor-not-allowed' : 'opacity-100 hover:scale-110 hover:bg-white/10'
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
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'w-6 sm:w-10 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                      : isPast
                      ? 'w-3 sm:w-6 bg-white/60'
                      : 'w-3 sm:w-6 bg-white/20'
                  }`}
                />
              );
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={currentStep === totalSteps - 1 || isCreating}
            className={`p-1.5 text-white/70 hover:text-white rounded-lg transition-all hidden sm:block ${
              currentStep === totalSteps - 1 || isCreating ? 'opacity-20 cursor-not-allowed' : 'opacity-100 hover:scale-110 hover:bg-white/10'
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
            className="text-xs font-bold px-2.5 py-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow">
                    Crea tu Espacio de Trabajo
                  </h1>
                  <p className="text-white/80 text-xs sm:text-base font-normal leading-relaxed">
                    En Lumins, todos los tableros y proyectos de tu equipo viven dentro de un espacio unificado.
                  </p>
                </div>

                <div className="w-full bg-[#1A1642] border border-white/10 rounded-2xl p-4 sm:p-7 shadow-2xl text-left space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-2">
                      Nombre de tu Espacio o Empresa
                    </label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="Ej. Acme Studio, Mi Empresa, Lumins Team"
                      className="w-full bg-[#120F30] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3] focus:ring-1 focus:ring-[#6C5DD3] text-base sm:text-sm font-medium"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-2">
                      Tipo de Organización
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                      {ORGANIZATION_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setWorkspaceType(type)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                            workspaceType === type
                              ? 'bg-[#6C5DD3] border-white/30 text-white shadow-lg'
                              : 'bg-[#120F30] border-white/10 text-white/70 hover:text-white hover:border-white/25'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={!workspaceName.trim()}
                  className="w-full sm:w-auto px-8 py-3.5 sm:py-3 rounded-xl font-extrabold text-sm bg-white text-[#2A2568] hover:bg-white/90 shadow-xl active:scale-95 transition-all disabled:opacity-40"
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
                className="w-full max-w-xl flex flex-col items-center text-center space-y-6 sm:space-y-7"
              >
                <div className="space-y-2 max-w-xl px-2">
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow">
                    Nombra tu primer Tablero
                  </h1>
                  <p className="text-white/80 text-xs sm:text-base font-normal leading-relaxed">
                    Cada tablero organiza un proyecto, sprint o área operativa con listas y tarjetas.
                  </p>
                </div>

                <div className="w-full bg-[#1A1642] border border-white/10 rounded-2xl p-4 sm:p-7 shadow-2xl text-left space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-2">
                      Nombre del Tablero
                    </label>
                    <input
                      type="text"
                      value={boardName}
                      onChange={(e) => setBoardName(e.target.value)}
                      placeholder="Ej. Tareas Semanales, Lanzamiento Web"
                      className="w-full bg-[#120F30] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3] focus:ring-1 focus:ring-[#6C5DD3] text-base sm:text-sm font-medium"
                      autoFocus
                    />
                  </div>

                  <div>
                    <div className="text-xs text-white/60 mb-2">Sugerencias rápidas:</div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {BOARD_NAME_SUGGESTIONS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setBoardName(sug)}
                          className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#120F30] hover:bg-white/10 text-xs font-medium text-white/80 transition-colors border border-white/10"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-2">
                      Color y Fondo del Tablero
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {BOARD_BACKGROUND_CHOICES.map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => setSelectedBg(choice)}
                          className={`h-11 sm:h-12 rounded-xl border flex items-center justify-center transition-all ${choice.value} ${
                            selectedBg.id === choice.id
                              ? 'ring-2 ring-white scale-105 shadow-lg border-white'
                              : 'opacity-70 hover:opacity-100 border-white/10'
                          }`}
                          title={choice.name}
                        >
                          {selectedBg.id === choice.id && (
                            <Check size={14} className="text-white drop-shadow" strokeWidth={3} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={!boardName.trim()}
                  className="w-full sm:w-auto px-8 py-3.5 sm:py-3 rounded-xl font-extrabold text-sm bg-white text-[#2A2568] hover:bg-white/90 shadow-xl active:scale-95 transition-all disabled:opacity-40"
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
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow">
                    Añade una tarea a tu lista
                  </h1>
                  <p className="text-white/80 text-xs sm:text-base font-normal leading-relaxed">
                    Comencemos agregando tu primera tarea pendiente como tarjeta en tu tablero de Lumins.
                  </p>
                </div>

                {/* Simulated Lumins List (Like Trello's center column) */}
                <div className="w-full bg-[#1A1642] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl text-left">
                  
                  {/* Column Header */}
                  <div className="flex items-center gap-2 mb-3 px-1 text-white/90">
                    <CheckSquare size={16} className="text-[#6C5DD3]" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Lista de tareas
                    </span>
                  </div>

                  {/* Input Card */}
                  <div className="bg-[#120F30] border border-white/10 rounded-xl p-3 mb-3">
                    <textarea
                      rows={2}
                      value={cardTitle}
                      onChange={(e) => setCardTitle(e.target.value)}
                      placeholder="¿Qué hay en tu lista de tareas por hacer?"
                      className="w-full bg-transparent text-white placeholder-white/40 text-sm sm:text-xs focus:outline-none resize-none font-medium"
                      autoFocus
                    />
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleAddCard()}
                        disabled={!cardTitle.trim()}
                        className={`px-4 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all ${
                          !cardTitle.trim()
                            ? 'opacity-40 bg-white/10 text-white/40 cursor-not-allowed'
                            : 'bg-[#6C5DD3] text-white hover:bg-[#5C4DBF] active:scale-95 shadow'
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
                        className="bg-[#241F58] border border-white/10 rounded-lg p-2.5 text-xs text-white shadow-sm flex items-center justify-between"
                      >
                        <span className="truncate pr-2 font-medium">{title}</span>
                        <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-semibold shrink-0">
                          Nueva
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto px-8 py-3.5 sm:py-3 rounded-xl font-extrabold text-sm bg-white text-[#2A2568] hover:bg-white/90 shadow-xl active:scale-95 transition-all"
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
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow">
                    Reúne todas tus tareas en Lumins
                  </h1>
                  <p className="text-white/80 text-xs sm:text-base font-normal leading-relaxed">
                    Conecta tus herramientas favoritas para importar proyectos existentes y sincronizar tus fechas de entrega.
                  </p>
                </div>

                {/* Central Diagram with Real Logos and Doodle Arrows */}
                <div className="w-full max-w-3xl relative py-3 sm:py-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0">
                  
                  {/* Left: Trello Card & Arrow */}
                  <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                    <div className="bg-[#1A1642] border border-white/15 p-3.5 sm:p-4 rounded-2xl shadow-xl flex flex-col items-center text-center w-full sm:w-44 hover:border-[#0079BF] transition-all group">
                      <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-[#0079BF]/20 flex items-center justify-center mb-2 shadow-inner">
                        <TrelloLogo size={26} />
                      </div>
                      <div className="font-bold text-xs text-white">Trello</div>
                      <div className="text-[10px] text-white/60 mb-2">Importador Nativo</div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setTrelloImportTested(true);
                          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                        }}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all w-full sm:w-auto ${
                          trelloImportTested 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-[#0079BF] text-white hover:bg-[#026AA7]'
                        }`}
                      >
                        {trelloImportTested ? '✓ Disponible' : 'Probar Trello'}
                      </button>
                    </div>

                    {/* Arrow pointing right */}
                    <svg className="w-16 h-8 text-white/70 overflow-visible hidden sm:block" viewBox="0 0 60 30" fill="none">
                      <path d="M 5 20 Q 30 5 55 15" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                      <polygon points="55,10 60,16 53,18" fill="currentColor" />
                    </svg>
                  </div>

                  {/* Center: Lumins Board List */}
                  <div className="w-full sm:w-64 sm:mx-4 bg-[#1A1642] border-2 border-[#6C5DD3] rounded-2xl p-4 shadow-2xl text-left relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white">
                        <span className="w-2 h-2 rounded-full bg-[#6C5DD3] animate-ping" />
                        <span>Tablero Lumins</span>
                      </div>
                      <span className="text-[10px] font-bold bg-[#6C5DD3] text-white px-2 py-0.5 rounded-full">
                        En vivo
                      </span>
                    </div>

                    <div className="bg-[#120F30] border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="text-xs font-semibold text-white truncate">
                        {mainCardTitle}
                      </div>

                      {trelloImportTested && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[10px] bg-[#0079BF]/20 border border-[#0079BF]/40 text-[#60A5FA] px-2 py-1 rounded flex items-center gap-1.5 font-medium"
                        >
                          <TrelloLogo size={12} />
                          <span>Tarjeta importada de Trello</span>
                        </motion.div>
                      )}

                      {googleCalendarSyncTested && (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }} 
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-1 rounded flex items-center gap-1.5 font-medium"
                        >
                          <GoogleCalendarIcon size={12} />
                          <span>Sincronizado con GCalendar</span>
                        </motion.div>
                      )}

                      <div className="pt-1 flex items-center justify-between text-[10px] text-white/50 border-t border-white/5">
                        <span>Prioridad P1</span>
                        <span>Vence en 3 días</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Google Calendar Card & Arrow */}
                  <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                    <div className="bg-[#1A1642] border border-white/15 p-3.5 sm:p-4 rounded-2xl shadow-xl flex flex-col items-center text-center w-full sm:w-44 hover:border-emerald-500 transition-all group">
                      <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center mb-2 shadow-inner">
                        <GoogleCalendarIcon size={26} />
                      </div>
                      <div className="font-bold text-xs text-white">Google Calendar</div>
                      <div className="text-[10px] text-white/60 mb-2">Sincronización Bidireccional</div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setGoogleCalendarSyncTested(true);
                          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                        }}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all w-full sm:w-auto ${
                          googleCalendarSyncTested 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {googleCalendarSyncTested ? '✓ Sincronizado' : 'Probar GCalendar'}
                      </button>
                    </div>

                    {/* Arrow pointing left */}
                    <svg className="w-16 h-8 text-white/70 overflow-visible hidden sm:block" viewBox="0 0 60 30" fill="none">
                      <path d="M 55 20 Q 30 5 5 15" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                      <polygon points="5,10 0,16 7,18" fill="currentColor" />
                    </svg>
                  </div>

                </div>

                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto px-8 py-3.5 sm:py-3 rounded-xl font-extrabold text-sm bg-white text-[#2A2568] hover:bg-white/90 shadow-xl active:scale-95 transition-all"
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
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow">
                    Empecemos a organizarnos
                  </h1>
                  <p className="text-white/80 text-xs sm:text-sm font-normal">
                    Aprende a mover tareas a tu tablero y marcarlas como listas en un instante.
                  </p>
                </div>

                {/* Guide mascot bubble */}
                <div className="flex items-center gap-2.5 sm:gap-3 max-w-xl w-full">
                  <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-full bg-gradient-to-tr from-[#6C5DD3] to-[#8E82E3] flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div className="bg-[#1A1642] border border-white/10 px-3.5 py-2 sm:py-2.5 rounded-2xl rounded-tl-sm text-xs text-white/90 shadow-xl text-left flex-1">
                    {!cardDropped ? (
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span>Arrastra la tarjeta o</span>
                        <b className="text-amber-300">haz clic / toca para moverla</b>
                        <span>a "Lista de tareas"</span>
                      </span>
                    ) : !isMarkedDone ? (
                      <span className="text-amber-300 font-bold flex items-center gap-1.5 animate-pulse">
                        <Sparkles size={14} className="text-amber-300 shrink-0" />
                        <span>¡Bien! Ahora toca el recuadro para marcarla como <b>Lista</b>.</span>
                      </span>
                    ) : (
                      <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                        <Check size={14} className="shrink-0" />
                        <span>🎉 ¡Excelente! Has dominado el flujo de tareas en Lumins.</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Drag & Drop Stage: WIDE BOARD CANVAS */}
                <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-start justify-center gap-3.5 sm:gap-5 relative">
                  
                  {/* LEFT: Bandeja de Entrada */}
                  <div className="w-full lg:w-72 bg-[#1A1642]/95 border border-white/15 rounded-2xl p-3.5 sm:p-4 shadow-2xl text-left relative z-10 shrink-0">
                    <div className="flex items-center justify-between mb-2.5 text-white/90">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={16} className="text-[#6C5DD3]" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Bandeja de entrada
                        </span>
                      </div>
                      {!cardDropped && (
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full animate-pulse lg:hidden">
                          Toca para mover
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Interactive Card */}
                      {!cardDropped ? (
                        <motion.div
                          drag
                          dragConstraints={{ left: 0, right: 300, top: -100, bottom: 200 }}
                          dragElastic={0.2}
                          onDragEnd={(_e, info) => {
                            if (info.offset.x > 60 || info.offset.y > 60 || info.offset.y < -40) {
                              setCardDropped(true);
                              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                            }
                          }}
                          onClick={() => {
                            setCardDropped(true);
                            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                          }}
                          className="bg-white text-zinc-900 border border-zinc-200 border-l-4 border-l-[#F97316] rounded-xl p-3 shadow-xl cursor-grab active:cursor-grabbing hover:scale-[1.02] active:scale-95 transition-all group touch-none"
                          title="Toca o arrastra esta tarjeta hacia el tablero"
                        >
                          <div className="font-bold text-xs sm:text-sm text-zinc-900 mb-2 leading-snug">
                            {mainCardTitle}
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-500 pt-1.5 border-t border-zinc-100">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 font-semibold text-zinc-600">
                                <Clock size={11} className="text-zinc-400" /> 18 nov
                              </span>
                              <AlignLeft size={11} className="text-zinc-400" />
                            </div>
                            <span className="text-[#6C5DD3] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                              <span>Mover</span> →
                            </span>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="border border-dashed border-white/10 rounded-xl p-3 text-center text-xs text-white/50 bg-white/[0.02]">
                          ✨ Bandeja organizada
                        </div>
                      )}

                      <div className="bg-[#120F30]/70 border border-white/5 rounded-xl p-2.5 text-xs text-white/60">
                        <div className="truncate text-[11px]">Míralo, envíalo y guárdalo para más tarde</div>
                        <div className="text-[10px] text-white/40 mt-1 flex items-center gap-1">
                          <Mail size={11} /> Correo
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Doodle arrow on desktop */}
                  {!cardDropped && (
                    <div className="hidden xl:block absolute left-[275px] top-[25px] z-20 pointer-events-none">
                      <svg className="w-24 h-16 text-amber-400 overflow-visible" viewBox="0 0 100 60" fill="none">
                        <path d="M 5 20 Q 50 0 90 40" stroke="currentColor" strokeWidth="3" strokeDasharray="5 3" />
                        <polygon points="90,40 78,35 84,27" fill="currentColor" />
                      </svg>
                    </div>
                  )}

                  {/* RIGHT: WIDE GENUINE LUMINS BOARD CANVAS */}
                  <div className={`flex-1 w-full rounded-2xl p-3 sm:p-5 border border-white/20 shadow-2xl transition-all ${selectedBg.value} text-left relative overflow-hidden`}>
                    
                    {/* Lumins Board Header Bar */}
                    <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4 bg-black/30 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg bg-gradient-to-br from-[#6C5DD3] to-[#8E82E3] flex items-center justify-center text-white text-xs font-black shadow border border-white/20 shrink-0">
                          {boardName.trim().charAt(0).toUpperCase() || 'L'}
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-xs sm:text-sm font-black text-white tracking-tight drop-shadow truncate">
                            {boardName.trim() || 'Tareas Semanales'}
                          </h2>
                          <span className="text-[10px] text-white/70 block truncate sm:hidden">
                            Espacio de Trabajo
                          </span>
                        </div>
                        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md bg-white/15 text-[10px] font-bold text-white/90 border border-white/10">
                          Espacio de Trabajo
                        </span>
                      </div>

                      {/* Header right pills */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-[#6C5DD3] text-white text-[10px] font-bold flex items-center justify-center border border-white/30 shadow-xs">
                          UN
                        </span>
                        <div className="hidden sm:flex items-center gap-1 text-[11px] text-white/90 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                          <Filter size={11} /> Filtros
                        </div>
                        <div className="hidden md:flex items-center gap-1 text-[11px] text-white/90 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                          <Users size={11} /> Miembros
                        </div>
                        <div className="hidden lg:flex items-center gap-1 text-[11px] text-white/90 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                          <Archive size={11} /> Archivo
                        </div>
                      </div>
                    </div>

                    {/* Columns Row (Real Lumins White Column Cards - Responsive horizontal swipe on mobile) */}
                    <div className="flex sm:grid sm:grid-cols-3 gap-3 overflow-x-auto snap-x snap-mandatory pb-2 custom-scrollbar">
                      
                      {/* Column 1: Lista de tareas */}
                      <div className="w-[82vw] sm:w-auto shrink-0 snap-center bg-white/95 text-zinc-900 rounded-xl border border-zinc-200/90 shadow-md p-3 sm:p-3.5 flex flex-col justify-between min-h-[190px] sm:min-h-[220px]">
                        <div>
                          {/* Column Header */}
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs text-zinc-900">Lista de tareas</span>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-bold border border-zinc-200">
                                {cardDropped ? '1' : '0'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-zinc-400">
                              <Plus size={13} />
                              <MoreHorizontal size={13} />
                            </div>
                          </div>
                          
                          {/* Card or Drop Target */}
                          {cardDropped ? (
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0, y: -8 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className={`bg-white border rounded-xl p-3 shadow-sm transition-all relative border-l-4 border-l-[#F97316] ${
                                isMarkedDone
                                  ? 'border-emerald-400 ring-2 ring-emerald-400/20 shadow-md'
                                  : 'border-zinc-200'
                              }`}
                            >
                              {/* Sparkle burst on complete */}
                              {isMarkedDone && (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: [0, 1.3, 1] }}
                                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg"
                                >
                                  <Sparkles size={13} />
                                </motion.div>
                              )}

                              <div className="flex items-start gap-2.5">
                                {/* Large touch-friendly Checkbox */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsMarkedDone(!isMarkedDone);
                                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(25);
                                  }}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                                    isMarkedDone
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                      : 'border-zinc-300 hover:border-emerald-500 bg-zinc-50 ring-4 ring-emerald-400/40 animate-pulse'
                                  }`}
                                  title="Haz clic para marcar como lista"
                                >
                                  {isMarkedDone && <Check size={13} strokeWidth={3} className="text-white" />}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className={`font-bold text-xs sm:text-sm leading-snug transition-all ${
                                    isMarkedDone ? 'line-through text-zinc-400' : 'text-zinc-900'
                                  }`}>
                                    {mainCardTitle}
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2.5 pt-1.5 border-t border-zinc-100">
                                    <span className="flex items-center gap-1 font-semibold text-zinc-600">
                                      <Clock size={11} className="text-zinc-400" /> 18 nov
                                    </span>
                                    {isMarkedDone ? (
                                      <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                                        <Check size={11} strokeWidth={3} /> Lista
                                      </span>
                                    ) : (
                                      <span className="text-amber-500 font-bold animate-pulse">
                                        👆 Marca como lista
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                setIsOverDropZone(true);
                              }}
                              onDragLeave={() => setIsOverDropZone(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsOverDropZone(false);
                                setCardDropped(true);
                                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                              }}
                              onClick={() => {
                                setCardDropped(true);
                                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
                              }}
                              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer min-h-[90px] flex flex-col items-center justify-center ${
                                isOverDropZone
                                  ? 'border-[#6C5DD3] bg-[#6C5DD3]/15 scale-102'
                                  : 'border-zinc-300 bg-zinc-50/70 hover:border-[#6C5DD3] hover:bg-[#6C5DD3]/5'
                              }`}
                            >
                              <span className="text-xs font-bold text-zinc-700">Soltar tarjeta aquí</span>
                              <span className="text-[10px] text-zinc-400 mt-0.5">o clic para mover</span>
                            </div>
                          )}
                        </div>

                        <div className="text-[11px] text-zinc-500 font-semibold pt-2 flex items-center gap-1 hover:text-zinc-800 cursor-pointer">
                          <Plus size={12} /> Añadir tarjeta
                        </div>
                      </div>

                      {/* Column 2: En proceso */}
                      <div className="w-[82vw] sm:w-auto shrink-0 snap-center bg-white/95 text-zinc-900 rounded-xl border border-zinc-200/90 shadow-md p-3 sm:p-3.5 flex flex-col justify-between min-h-[190px] sm:min-h-[220px]">
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs text-zinc-900">En proceso</span>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-bold border border-zinc-200">
                                0
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-zinc-400">
                              <Plus size={13} />
                              <MoreHorizontal size={13} />
                            </div>
                          </div>
                          
                          <div className="h-20 border border-dashed border-zinc-200 bg-zinc-50/50 rounded-xl flex items-center justify-center text-[10px] text-zinc-400 font-medium">
                            Sin tarjetas
                          </div>
                        </div>

                        <div className="text-[11px] text-zinc-500 font-semibold pt-2 flex items-center gap-1">
                          <Plus size={12} /> Añadir tarjeta
                        </div>
                      </div>

                      {/* Column 3: Hecho */}
                      <div className="w-[82vw] sm:w-auto shrink-0 snap-center bg-white/95 text-zinc-900 rounded-xl border border-zinc-200/90 shadow-md p-3 sm:p-3.5 flex flex-col justify-between min-h-[190px] sm:min-h-[220px]">
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs text-zinc-900">Hecho</span>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-bold border border-zinc-200">
                                0
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-zinc-400">
                              <Plus size={13} />
                              <MoreHorizontal size={13} />
                            </div>
                          </div>

                          <div className="h-20 border border-dashed border-zinc-200 bg-zinc-50/50 rounded-xl flex items-center justify-center text-[10px] text-zinc-400 font-medium">
                            Sin tarjetas
                          </div>
                        </div>

                        <div className="text-[11px] text-zinc-500 font-semibold pt-2 flex items-center gap-1">
                          <Plus size={12} /> Añadir tarjeta
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                <button
                  onClick={handleNext}
                  className={`w-full sm:w-auto px-10 py-3.5 sm:py-3 rounded-xl font-extrabold text-sm transition-all shadow-xl active:scale-95 ${
                    isMarkedDone
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                      : 'bg-white text-[#2A2568] hover:bg-white/90'
                  }`}
                >
                  Continuar
                </button>
              </motion.div>
            )}

            {/* ═════════════════════════════════════════════════════════════ */}
            {/* STEP 5: ¡HECHO! (FINAL CELEBRATION EXACTLY LIKE TRELLO) */}
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
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow">
                    ¡Hecho!
                  </h1>
                  <p className="text-white/80 text-xs sm:text-base font-normal">
                    Tu espacio y tu tablero se han guardado listos para usarse en Lumins.
                  </p>
                </div>

                {/* Continue CTA Button */}
                <div className="w-full flex flex-col items-center gap-3">
                  <button
                    onClick={handleFinishAndCreate}
                    disabled={isCreating}
                    className="w-full sm:w-60 py-3.5 sm:py-3 rounded-xl font-black text-sm bg-[#6C5DD3] hover:bg-[#5C4DBF] text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span className="text-xs">{creationStepMsg || 'Creando...'}</span>
                      </>
                    ) : (
                      <span>Comenzar a usar Lumins</span>
                    )}
                  </button>

                  {error && (
                    <div className="w-full bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-xs text-red-200 flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                {/* Visual Preview */}
                <div className="w-full max-w-sm bg-[#1A1642] border border-white/10 rounded-2xl p-4 shadow-2xl text-left">
                  <div className="flex items-center gap-2 mb-3 text-white/90">
                    <CheckSquare size={16} className="text-[#6C5DD3]" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {boardName.trim() || 'Tablero'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-[#120F30] border border-white/10 rounded-xl p-3 text-xs text-white">
                      <div className="font-bold">{mainCardTitle}</div>
                      <div className="text-[10px] text-white/50 mt-1 flex items-center gap-2">
                        <span>P1 Alta</span>
                        <span>•</span>
                        <span>Sincronizada</span>
                      </div>
                    </div>

                    <div className="bg-[#120F30]/60 border border-white/5 rounded-xl p-2.5 text-xs text-white/60 text-center">
                      + Agrega más tarjetas desde tu nuevo tablero
                    </div>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
};

export default OnboardingStepperModal;
