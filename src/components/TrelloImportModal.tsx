import React, { useState, useEffect } from 'react';
import { X, ExternalLink, CheckCircle2, ChevronRight, Briefcase, RefreshCw, AlertCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../lib/api-client';
import Button from './ui/Button';

interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  prefs?: {
    backgroundColor?: string;
    backgroundImage?: string;
  };
}

interface Workspace {
  id: string;
  name: string;
}

interface TrelloImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'AUTH' | 'SELECT' | 'IMPORTING' | 'SUCCESS';

const TrelloImportModal: React.FC<TrelloImportModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('AUTH');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [trelloToken, setTrelloToken] = useState<string | null>(localStorage.getItem('trello_token'));
  const [trelloBoards, setTrelloBoards] = useState<TrelloBoard[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('trello_token');
      setTrelloToken(token);
      
      // Reset selection state
      setSelectedBoardId('');
      setSearchTerm('');
      
      if (token) {
        setStep('SELECT');
        fetchInitialData(token);
      } else {
        setStep('AUTH');
      }
      setError(null);
    }
  }, [isOpen]);


  const fetchInitialData = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [boardsRes, workspacesRes] = await Promise.all([
        apiClient.get<{ data: TrelloBoard[] }>(`/api/integrations/trello/boards?token=${token}`),
        apiClient.get<{ data: { workspaces: Workspace[] } }>('/api/workspaces')
      ]);
      
      setTrelloBoards(boardsRes.data);
      const wsList = workspacesRes.data.workspaces || [];
      setWorkspaces(wsList);
      
      if (wsList.length > 0) {
        setSelectedWorkspaceId(wsList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch data', err);
      setError('No se pudieron cargar los datos de Trello o tus espacios de trabajo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorize = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{ data: { url: string } }>('/api/integrations/trello/auth-url');
      const authUrl = response.data.url;
      
      const width = 600;
      const height = 800;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        authUrl, 
        'TrelloAuth', 
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for token
      const checkToken = setInterval(() => {
        const token = localStorage.getItem('trello_token');
        if (token) {
          setTrelloToken(token);
          setStep('SELECT');
          fetchInitialData(token);
          clearInterval(checkToken);
        }
      }, 1000);
      
      // Safety timeout
      setTimeout(() => clearInterval(checkToken), 60000);
      
    } catch (err) {
      setError('Error al iniciar la autorización con Trello.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartImport = async () => {
    if (!selectedBoardId || !selectedWorkspaceId || !trelloToken) return;

    try {
      setStep('IMPORTING');
      setIsLoading(true);
      setError(null);
      
      await apiClient.post('/api/integrations/trello/import', {
        boardId: selectedBoardId,
        workspaceId: selectedWorkspaceId,
        token: trelloToken
      });
      
      setStep('SUCCESS');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error en la base de datos al importar';
      setError(msg);
      setStep('SELECT');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBoards = trelloBoards.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedBoard = trelloBoards.find(b => b.id === selectedBoardId);
  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
      />
      
      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-[#1C1F26] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#0079BF] rounded-xl flex items-center justify-center shadow-lg shadow-[#0079BF]/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19.7,2H4.3C3,2,2,3,2,4.3v15.4C2,21,3,22,4.3,22h15.4c1.3,0,2.3-1,2.3-2.3V4.3C22,3,21,2,19.7,2z M10.3,16.7c0,0.7-0.6,1.3-1.3,1.3H5.7c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3H9c0.7,0,1.3,0.6,1.3,1.3V16.7z M19.7,11.7 c0,0.7-0.6,1.3-1.3,1.3h-3.3c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3h3.3c0.7,0,1.3,0.6,1.3,1.3V11.7z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Importar desde Trello</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sincroniza tus proyectos en segundos</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors text-zinc-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400"
            >
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{error}</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'AUTH' && (
              <motion.div 
                key="auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center py-10"
              >
                <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#0079BF]/10 text-[#0079BF]">
                  <ExternalLink size={40} />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">Conectar con Trello</h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-10 font-medium">
                  Necesitamos tu autorización para leer tus tableros de Trello. No guardaremos tu contraseña.
                </p>
                <Button 
                  onClick={handleAuthorize}
                  isLoading={isLoading}
                  className="h-14 px-10 bg-[#0079BF] hover:bg-[#026AA7] text-white font-black text-lg shadow-xl shadow-[#0079BF]/20 uppercase tracking-widest"
                >
                  Autorizar Trello
                </Button>
              </motion.div>
            )}

            {step === 'SELECT' && (
              <motion.div 
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Board Selection */}
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">1. Selecciona el Tablero</label>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => trelloToken && fetchInitialData(trelloToken)}
                        disabled={isLoading}
                        className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
                        title="Refrescar tableros"
                      >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                      </button>
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                          type="text" 
                          placeholder="Buscar tablero..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 pr-4 py-1.5 bg-zinc-100 dark:bg-white/5 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#0079BF] transition-all w-48"
                        />
                      </div>
                    </div>

                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading ? (
                      Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-20 bg-zinc-100 dark:bg-white/5 rounded-xl animate-pulse" />
                      ))
                    ) : filteredBoards.length > 0 ? (
                      filteredBoards.map(board => (
                        <button
                          key={board.id}
                          onClick={() => setSelectedBoardId(board.id)}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            selectedBoardId === board.id 
                            ? 'border-[#0079BF] bg-[#0079BF]/5 shadow-lg shadow-[#0079BF]/10' 
                            : 'border-zinc-100 dark:border-white/5 hover:border-zinc-200 dark:hover:border-white/10'
                          }`}
                        >
                          <div 
                            className="w-10 h-10 rounded-lg flex-shrink-0"
                            style={{ 
                              backgroundColor: board.prefs?.backgroundColor || '#0079BF',
                              backgroundImage: board.prefs?.backgroundImage ? `url(${board.prefs.backgroundImage})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 dark:text-white truncate">{board.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{board.desc || 'Sin descripción'}</p>
                          </div>
                          {selectedBoardId === board.id && (
                            <div className="ml-auto text-[#0079BF]">
                              <CheckCircle2 size={20} fill="currentColor" className="text-white" />
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 py-10 text-center text-zinc-500">
                        No se encontraron tableros.
                      </div>
                    )}
                  </div>
                </div>

                {/* Workspace Selection */}
                <div>
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-4">2. Espacio de Destino (Lumins)</label>
                  <div className="grid grid-cols-1 gap-3">
                    {workspaces.map(ws => (
                      <button
                        key={ws.id}
                        onClick={() => setSelectedWorkspaceId(ws.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          selectedWorkspaceId === ws.id 
                          ? 'border-[#6C5DD3] bg-[#6C5DD3]/5' 
                          : 'border-zinc-100 dark:border-white/5 hover:border-zinc-200 dark:hover:border-white/10'
                        }`}
                      >
                        <div className="w-10 h-10 bg-[#6C5DD3]/10 text-[#6C5DD3] rounded-lg flex items-center justify-center">
                          <Briefcase size={20} />
                        </div>
                        <p className="font-bold text-zinc-900 dark:text-white">{ws.name}</p>
                        {selectedWorkspaceId === ws.id && (
                          <div className="ml-auto text-[#6C5DD3]">
                            <CheckCircle2 size={20} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'IMPORTING' && (
              <motion.div 
                key="importing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="relative mb-8 inline-block">
                  <div className="w-24 h-24 rounded-full border-4 border-zinc-100 dark:border-white/5" />
                  <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-[#0079BF] border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-[#0079BF]">
                    <RefreshCw size={32} />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Importando Datos...</h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Estamos transfiriendo tus listas, tarjetas y etiquetas.</p>
                <div className="mt-8 max-w-xs mx-auto h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 15 }}
                    className="h-full bg-gradient-to-r from-[#0079BF] to-[#6C5DD3]"
                  />
                </div>
              </motion.div>
            )}

            {step === 'SUCCESS' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 text-green-500">
                  <CheckCircle2 size={64} />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-3">¡Importación Exitosa!</h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-10 font-medium">
                  Tu tablero de Trello se ha recreado perfectamente en Lumins.
                </p>
                <Button 
                  onClick={() => {
                    onClose();
                    window.location.reload();
                  }}
                  className="h-14 px-12 bg-green-500 hover:bg-green-600 text-white font-black text-lg shadow-xl shadow-green-500/20 uppercase tracking-widest"
                >
                  Ver Tablero
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step === 'SELECT' && (
          <div className="p-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex justify-between items-center">
            <div className="flex flex-col">
              {selectedBoard && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-400">Origen:</span>
                  <span className="font-bold text-[#0079BF]">{selectedBoard.name}</span>
                </div>
              )}
              {selectedWorkspace && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-400">Destino:</span>
                  <span className="font-bold text-[#6C5DD3]">{selectedWorkspace.name}</span>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleStartImport}
              disabled={!selectedBoardId || !selectedWorkspaceId || isLoading}
              className={`h-14 px-8 font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all ${
                selectedBoardId && selectedWorkspaceId 
                ? 'bg-gradient-to-r from-[#0079BF] to-[#6C5DD3] text-white shadow-lg' 
                : 'bg-zinc-200 dark:bg-white/5 text-zinc-400'
              }`}
            >
              <span>Iniciar Importación</span>
              <ChevronRight size={18} />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TrelloImportModal;
