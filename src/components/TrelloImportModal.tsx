import React, { useState, useEffect } from 'react';
import { X, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../lib/api-client';
import Button from './ui/Button';
import Alert from './ui/Alert';
import LuminsLogoLoader from './ui/LuminsLogoLoader';
import {
  LuminsSuccessIcon,
  LuminsWorkspaceIcon,
  LuminsRocketIcon,
} from './icons/LuminsIcons';

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
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-[#1C1F26] w-full max-w-lg rounded-xl border border-zinc-200/80 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/60 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0079BF] rounded-lg flex items-center justify-center shadow-xs">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M19.7,2H4.3C3,2,2,3,2,4.3v15.4C2,21,3,22,4.3,22h15.4c1.3,0,2.3-1,2.3-2.3V4.3C22,3,21,2,19.7,2z M10.3,16.7c0,0.7-0.6,1.3-1.3,1.3H5.7c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3H9c0.7,0,1.3,0.6,1.3,1.3V16.7z M19.7,11.7 c0,0.7-0.6,1.3-1.3,1.3h-3.3c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3h3.3c0.7,0,1.3,0.6,1.3,1.3V11.7z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">Importar desde Trello</h2>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Sincroniza tus tableros y tarjetas en segundos</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Alert tone="coral">{error}</Alert>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'AUTH' && (
              <motion.div 
                key="auth"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-center py-5"
              >
                <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#12A9A8]/12 via-[#FFCC40]/12 to-[#FF665E]/12 border border-[#12A9A8]/20 text-zinc-800 dark:text-zinc-100">
                  <LuminsRocketIcon size={32} />
                </div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white mb-1.5">Conectar con Trello</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mb-6 leading-relaxed">
                  Necesitamos tu autorización para leer tus tableros de Trello. No guardaremos tu contraseña.
                </p>
                <Button 
                  onClick={handleAuthorize}
                  isLoading={isLoading}
                  className="h-9 px-5 rounded-lg bg-[#12A9A8] hover:bg-[#0E8786] text-white font-bold text-xs shadow-xs shadow-[#12A9A8]/25"
                >
                  Autorizar Trello
                </Button>
              </motion.div>
            )}

            {step === 'SELECT' && (
              <motion.div 
                key="select"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                {/* Board Selection */}
                <div>
                  <div className="flex justify-between items-center gap-2 mb-3">
                    <label className="text-[10.5px] font-extrabold text-zinc-400 uppercase tracking-widest">1. Selecciona el Tablero</label>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => trelloToken && fetchInitialData(trelloToken)}
                        disabled={isLoading}
                        className="p-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg text-zinc-400 hover:text-[#12A9A8] transition-colors"
                        title="Refrescar tableros"
                      >
                        <RefreshCw size={13} className={isLoading ? 'animate-spin text-[#12A9A8]' : ''} />
                      </button>
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                          type="text" 
                          placeholder="Buscar tablero..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="h-8 pl-8 pr-3 bg-zinc-100 dark:bg-white/5 border border-transparent focus:border-[#12A9A8] focus:bg-white dark:focus:bg-[#13151A] rounded-lg text-xs font-medium outline-none transition-all w-44"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {isLoading ? (
                      <div className="col-span-2 py-8 flex justify-center">
                        <LuminsLogoLoader size="sm" />
                      </div>
                    ) : filteredBoards.length > 0 ? (
                      filteredBoards.map(board => (
                        <button
                          key={board.id}
                          onClick={() => setSelectedBoardId(board.id)}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                            selectedBoardId === board.id 
                            ? 'border-[#12A9A8] bg-[#12A9A8]/[0.06]' 
                            : 'border-zinc-200/80 dark:border-white/10 hover:border-[#12A9A8]/40'
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-md flex-shrink-0"
                            style={{ 
                              backgroundColor: board.prefs?.backgroundColor || '#12A9A8',
                              backgroundImage: board.prefs?.backgroundImage ? `url(${board.prefs.backgroundImage})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{board.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{board.desc || 'Sin descripción'}</p>
                          </div>
                          {selectedBoardId === board.id && (
                            <LuminsSuccessIcon size={15} className="shrink-0" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 py-8 text-center text-xs text-zinc-500">
                        No se encontraron tableros.
                      </div>
                    )}
                  </div>
                </div>

                {/* Workspace Selection */}
                <div>
                  <label className="text-[10.5px] font-extrabold text-zinc-400 uppercase tracking-widest block mb-2.5">2. Espacio de Destino (Lumins)</label>
                  <div className="grid grid-cols-1 gap-2">
                    {workspaces.map(ws => (
                      <button
                        key={ws.id}
                        onClick={() => setSelectedWorkspaceId(ws.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                          selectedWorkspaceId === ws.id 
                          ? 'border-[#12A9A8] bg-[#12A9A8]/[0.06]' 
                          : 'border-zinc-200/80 dark:border-white/10 hover:border-[#12A9A8]/40'
                        }`}
                      >
                        <div className="w-8 h-8 bg-[#12A9A8]/10 text-[#0E8786] dark:text-[#4ED4D2] rounded-md flex items-center justify-center shrink-0">
                          <LuminsWorkspaceIcon size={16} />
                        </div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white flex-1 truncate">{ws.name}</p>
                        {selectedWorkspaceId === ws.id && (
                          <LuminsSuccessIcon size={15} className="shrink-0" />
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
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="mb-5 flex justify-center">
                  <LuminsLogoLoader size="md" />
                </div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white mb-1.5">Importando datos...</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Transfiriendo listas, tarjetas y etiquetas a Lumins.</p>
                <div className="mt-6 max-w-xs mx-auto h-1.5 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 15 }}
                    className="h-full bg-gradient-to-r from-[#FF665E] via-[#12A9A8] to-[#FFCC40]"
                  />
                </div>
              </motion.div>
            )}

            {step === 'SUCCESS' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#12A9A8]/10">
                  <LuminsSuccessIcon size={32} />
                </div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white mb-1.5">¡Importación exitosa!</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mb-6">
                  Tu tablero de Trello se recreó correctamente en Lumins.
                </p>
                <Button 
                  onClick={() => {
                    onClose();
                    window.location.reload();
                  }}
                  className="h-9 px-6 rounded-lg bg-[#12A9A8] hover:bg-[#0E8786] text-white font-bold text-xs shadow-xs shadow-[#12A9A8]/25"
                >
                  Ver tablero
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step === 'SELECT' && (
          <div className="px-5 py-3.5 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/60 dark:bg-white/[0.02] flex justify-between items-center gap-3">
            <div className="flex flex-col min-w-0">
              {selectedBoard && (
                <div className="flex items-center gap-1.5 text-[11px] truncate">
                  <span className="text-zinc-400">Origen:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{selectedBoard.name}</span>
                </div>
              )}
              {selectedWorkspace && (
                <div className="flex items-center gap-1.5 text-[11px] truncate">
                  <span className="text-zinc-400">Destino:</span>
                  <span className="font-bold text-[#0E8786] dark:text-[#4ED4D2] truncate">{selectedWorkspace.name}</span>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleStartImport}
              disabled={!selectedBoardId || !selectedWorkspaceId || isLoading}
              className={`h-9 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                selectedBoardId && selectedWorkspaceId 
                ? 'bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-xs shadow-[#12A9A8]/25' 
                : 'bg-zinc-200 dark:bg-white/5 text-zinc-400'
              }`}
            >
              <span>Iniciar importación</span>
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TrelloImportModal;
