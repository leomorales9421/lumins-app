import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import type { Board } from '../types/board';
import Button from '../components/ui/Button';
import BoardCard from '../components/BoardCard';
import InviteMembersModal from '../components/InviteMembersModal';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Filter, ChevronDown, Layout } from 'lucide-react';

const BoardsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [workspaces, setWorkspaces] = useState<{ id: string, name: string }[]>([]);

  const fetchWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true);
    try {
      const response = await apiClient.get<{ data: { workspaces: { id: string, name: string }[] } }>('/api/workspaces');
      setWorkspaces(response.data.workspaces || []);
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, []);

  const fetchBoards = useCallback(async () => {
    setIsLoading(true);
    setBoards([]); // Clear old boards to prevent "vistas viejas"
    try {
      const url = workspaceId ? `/api/boards?workspaceId=${workspaceId}` : '/api/boards';
      const response = await apiClient.get<{ data: { boards: Board[] } }>(url);
      setBoards(response.data.boards || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { 
    fetchBoards(); 
    fetchWorkspaces();
  }, [fetchBoards, fetchWorkspaces]);

  // Listen for board creation to refresh
  useEffect(() => {
    const handleRefresh = () => fetchBoards();
    window.addEventListener('board-created', handleRefresh);
    return () => window.removeEventListener('board-created', handleRefresh);
  }, [fetchBoards]);

  useEffect(() => {
    if (!isLoading && !workspaceId && workspaces.length > 0) {
      const lastId = localStorage.getItem('lastActiveWorkspaceId');
      const targetId = workspaces.find(w => w.id === lastId)?.id || workspaces[0].id;
      navigate(`/w/${targetId}/dashboard`, { replace: true });
    }
  }, [isLoading, workspaceId, workspaces, navigate]);

  return (
    <div className="flex-1 flex flex-col font-sans">
      <main className="flex-1 p-4 sm:p-6 lg:p-10">
        <div className="max-w-[1600px] mx-auto w-full">
          
          {(isLoading || isLoadingWorkspaces) ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <div className="w-10 h-10 border-[3px] border-[#E8E9EC] border-t-[#7A5AF8] rounded-full animate-spin" />
            </div>
          ) : workspaces.length === 0 ? (
            <WorkspaceEmptyState onCreateClick={() => {
              // Trigger global workspace creation
              window.dispatchEvent(new CustomEvent('open-create-workspace'));
            }} />
          ) : (
            <>
              {/* Header: ClickUp Style */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-2 text-[#7A5AF8] mb-1">
                      <Layout size={18} strokeWidth={2.5} />
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Panel de Control</span>
                   </div>
                   <h1 className="text-3xl font-bold text-[#1A1A2E] tracking-tight">Tus Proyectos</h1>
                </div>

                <div className="flex items-center gap-3">
                   <div className="hidden sm:flex bg-white rounded-lg border border-[#E8E9EC] p-1 shadow-soft">
                      <button className="px-4 py-2 bg-[#F4F5F7] rounded-md text-[12px] font-bold text-[#374151] flex items-center gap-2">
                        <Filter size={14} />
                        Todos
                        <ChevronDown size={14} />
                      </button>
                      <button 
                        onClick={() => setShowInviteModal(true)}
                        className="px-4 py-2 text-[12px] font-bold text-[#6B7280] hover:text-[#7A5AF8] transition-colors flex items-center gap-2"
                      >
                        <Users size={14} />
                        Miembros
                      </button>
                   </div>
                </div>
              </div>

              {/* Board Grid */}
              {boards.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E8E9EC] p-20 text-center flex flex-col items-center shadow-soft">
                   <div className="w-16 h-16 bg-[#F4F5F7] rounded-2xl flex items-center justify-center text-[#9CA3AF] mb-4">
                      <Layout size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-[#1A1A2E]">No hay proyectos activos</h3>
                   <p className="text-[#6B7280] mb-6">Comienza creando tu primer tablero para organizar el trabajo.</p>
                   <Button 
                    onClick={() => window.dispatchEvent(new CustomEvent('open-create-board'))}
                    variant="outlined"
                    className="border-[#E8E9EC] text-[#374151] hover:border-[#7A5AF8] hover:text-[#7A5AF8]"
                   >
                     Crear tablero
                   </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-12">
                  <AnimatePresence mode="popLayout">
                    {boards.map((board, index) => (
                      <motion.div
                        key={board.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.04 }}
                      >
                        <BoardCard board={board} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Pagination */}
              {boards.length > 8 && (
                <div className="flex justify-center mt-10">
                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-[#E8E9EC] shadow-soft text-[13px] font-bold">
                     <button className="px-3 py-1.5 text-[#6B7280] hover:text-[#1A1A2E] transition-colors disabled:opacity-30">Prev</button>
                     <div className="flex items-center gap-1">
                        <button className="w-8 h-8 bg-[#7A5AF8] text-white rounded-md shadow-sm">1</button>
                        <button className="w-8 h-8 hover:bg-[#F4F5F7] text-[#6B7280] rounded-md transition-colors">2</button>
                     </div>
                     <button className="px-3 py-1.5 text-[#6B7280] hover:text-[#1A1A2E] transition-colors">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {workspaces.length > 0 && (
        <InviteMembersModal 
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          workspaceId={workspaceId || workspaces[0].id}
          workspaceName={workspaces.find(w => w.id === workspaceId)?.name || workspaces[0].name}
        />
      )}
    </div>
  );
};

export default BoardsPage;
