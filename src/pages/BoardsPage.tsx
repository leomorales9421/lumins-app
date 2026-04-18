import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import type { Board } from '../types/board';
import Button from '../components/ui/Button';
import NavBar from '../components/layout/NavBar';
import BoardCard from '../components/BoardCard';
import CreateBoardModal from '../components/CreateBoardModal';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';
import InviteMembersModal from '../components/InviteMembersModal';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { motion, AnimatePresence } from 'framer-motion';

const BoardsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [workspaces, setWorkspaces] = useState<{ id: string, name: string }[]>([]);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await apiClient.get<{ data: { workspaces: { id: string, name: string }[] } }>('/api/workspaces');
      setWorkspaces(response.data.workspaces || []);
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
    }
  }, []);

  const fetchBoards = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ data: { boards: Board[] } }>('/api/boards');
      setBoards(response.data.boards || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchBoards(); 
    fetchWorkspaces();
  }, [fetchBoards, fetchWorkspaces]);

  return (
    <div className="min-h-screen bg-[#F3E8FF] flex flex-col font-sans">
      <NavBar user={user} logout={logout} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Decorative Identity Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7A5AF8]/5 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E91E63]/5 blur-[100px] rounded-full -z-10" />

        <main className="flex-1 overflow-y-auto p-10 md:p-16 custom-scrollbar flex flex-col">
          <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
            
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#7A5AF8]/20 border-t-[#7A5AF8] rounded-full animate-spin" />
              </div>
            ) : workspaces.length === 0 ? (
              <WorkspaceEmptyState onCreateClick={() => setShowCreateWorkspaceModal(true)} />
            ) : (
              <>
                {/* Header & Advanced Filters */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20">
                  <div className="flex flex-col gap-4">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="h-1.5 w-12 bg-gradient-to-r from-[#7A5AF8] to-[#E91E63] rounded-full" />
                        <span className="text-[10px] font-black text-[#7A5AF8] uppercase tracking-[0.4em]">Plataforma Operativa</span>
                     </div>
                     <h1 className="text-6xl font-black text-zinc-900 tracking-tighter leading-none">
                       Proyectos <br/> <span className="text-[#7A5AF8]">Estratégicos</span>
                     </h1>
                  </div>

                  <div className="flex items-center gap-5">
                     <div className="flex bg-white rounded-2xl border border-zinc-100 p-2 shadow-soft">
                        <div className="px-6 py-3 bg-[#F3E8FF] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#7A5AF8] flex items-center gap-3 cursor-pointer">
                          Todos los Estados
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                        <div 
                          onClick={() => setShowInviteModal(true)}
                          className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#806F9B]/60 flex items-center gap-3 cursor-pointer hover:text-[#7A5AF8] transition-colors"
                        >
                          Invitar Equipo
                        </div>
                     </div>

                     <Button 
                       onClick={() => setShowCreateModal(true)}
                       className="bg-[#7A5AF8] text-white h-14 px-8 rounded-2xl shadow-heavy"
                       leftIcon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>}
                     >
                       Nuevo Proyecto
                     </Button>
                  </div>
                </header>

                {/* Project Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10 mb-20">
                  <AnimatePresence mode="popLayout">
                    {boards.map((board, index) => (
                      <motion.div
                        key={board.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                      >
                        <BoardCard board={board} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {boards.length > 0 && (
                  <footer className="flex justify-center mt-auto pb-10">
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-zinc-100 shadow-soft">
                       <button className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#7A5AF8] transition-colors">Prev</button>
                       <div className="flex items-center gap-2">
                          <button className="w-10 h-10 bg-[#7A5AF8] text-white rounded-xl text-sm font-black shadow-lg">1</button>
                          <button className="w-10 h-10 bg-white text-zinc-400 hover:text-[#7A5AF8] rounded-xl text-sm font-black transition-colors">2</button>
                          <button className="w-10 h-10 bg-white text-zinc-400 hover:text-[#7A5AF8] rounded-xl text-sm font-black transition-colors">3</button>
                       </div>
                       <button className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#7A5AF8] transition-colors">Next</button>
                    </div>
                  </footer>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <CreateBoardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onBoardCreated={fetchBoards}
        workspaces={workspaces}
      />

      <CreateWorkspaceModal 
        isOpen={showCreateWorkspaceModal}
        onClose={() => setShowCreateWorkspaceModal(false)}
        onWorkspaceCreated={() => {
          fetchWorkspaces();
          fetchBoards();
        }}
      />

      {workspaces.length > 0 && (
        <InviteMembersModal 
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          workspaceId={workspaces[0].id}
          workspaceName={workspaces[0].name}
        />
      )}
    </div>
  );
};

export default BoardsPage;
