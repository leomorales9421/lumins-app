import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import BoardCard from '../components/BoardCard';
import CreateBoardModal from '../components/CreateBoardModal';
import DeleteBoardModal from '../components/DeleteBoardModal';
import type { Board, BoardListResponse, CreateBoardRequest } from '../types/board';

export const BoardsPage: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [filteredBoards, setFilteredBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'starred' | 'recent'>('all');
  
  // Delete board state
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCounts, setDeleteCounts] = useState<{
    lists: number;
    cards: number;
    labels: number;
    members: number;
  } | null>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<number | null>(null);

  const fetchBoards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<BoardListResponse>('/api/boards');
      setBoards(response.data.boards);
      setFilteredBoards(response.data.boards);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los tableros');
      console.error('Error fetching boards:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    let filtered = boards;

    // Apply search filter using debounced value
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(board =>
        board.name.toLowerCase().includes(query) ||
        board.description?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (activeFilter === 'starred') {
      filtered = filtered.filter(board => board.starred);
    } else if (activeFilter === 'recent') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      }).slice(0, 10);
    }

    setFilteredBoards(filtered);
  }, [boards, debouncedSearchQuery, activeFilter]);

  const handleCreateBoard = async (boardData: CreateBoardRequest) => {
    try {
      const response = await apiClient.post<{ data: { board: Board } }>('/api/boards', boardData);
      const newBoard = response.data.board;
      setBoards(prev => [newBoard, ...prev]);
      navigate(`/boards/${newBoard.id}`);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al crear el tablero');
    }
  };

  const handleStarToggle = async (boardId: string, starred: boolean) => {
    try {
      // Update local state optimistically
      setBoards(prev => prev.map(board =>
        board.id === boardId ? { ...board, starred } : board
      ));

      // Call API to update starred status
      await apiClient.patch(`/api/boards/${boardId}`, { starred });
    } catch (err) {
      // Revert on error
      setBoards(prev => prev.map(board =>
        board.id === boardId ? { ...board, starred: !starred } : board
      ));
      console.error('Error toggling star:', err);
    }
  };

  const handleDeleteBoard = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      setBoardToDelete(board);
      setIsDeleteModalOpen(true);
      
      // Get counts for the modal (simulate from existing data)
      const counts = {
        lists: board._count?.lists || 0,
        cards: board._count?.cards || 0,
        labels: board._count?.labels || 0,
        members: board._count?.members || 0,
      };
      setDeleteCounts(counts);
    }
  };

  const confirmDeleteBoard = async () => {
    if (!boardToDelete) return;

    setIsDeleting(true);
    try {
      // Call API to delete board
      const response = await apiClient.delete(`/api/boards/${boardToDelete.id}`);
      
      // Remove from local state
      setBoards(prev => prev.filter(board => board.id !== boardToDelete.id));
      
      // Close modal and reset state
      setIsDeleteModalOpen(false);
      setBoardToDelete(null);
      setDeleteCounts(null);
      
      // Show success message (optional)
      console.log('Board deleted successfully:', response.data);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el tablero');
      console.error('Error deleting board:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounce (300ms)
    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearchQuery(value);
    }, 300);
  };

  const handleRetry = () => {
    fetchBoards();
  };

  // Check if user is admin (owner of the board)
  const isUserAdmin = (board: Board) => {
    return board.ownerId === user?.id;
  };

  if (isLoading && boards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d1117] to-[#1c2327]">
        <NavBar user={user} logout={logout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-[#9db0b9]">Cargando tableros...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1117] to-[#1c2327]">
      <NavBar user={user} logout={logout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Mis Tableros</h1>
          <p className="text-[#9db0b9] mt-2">
            Gestiona todos tus proyectos y colabora con tu equipo
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'all' ? 'bg-primary text-white' : 'bg-white/5 text-[#9db0b9] hover:text-white border border-white/10'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveFilter('starred')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'starred' ? 'bg-primary text-white' : 'bg-white/5 text-[#9db0b9] hover:text-white border border-white/10'}`}
            >
              Favoritos
            </button>
            <button
              onClick={() => setActiveFilter('recent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'recent' ? 'bg-primary text-white' : 'bg-white/5 text-[#9db0b9] hover:text-white border border-white/10'}`}
            >
              Recientes
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Buscar tableros..."
                className="w-full sm:w-64 px-4 py-2 pl-10 border border-white/10 bg-white/5 text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none placeholder:text-[#6d7f88]"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-[#9db0b9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-primary to-blue-500 text-white font-medium rounded-lg hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition whitespace-nowrap shadow-lg shadow-primary/25"
            >
              + Nuevo Tablero
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-red-400">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="px-3 py-1 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Boards Grid */}
        {filteredBoards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onStarToggle={handleStarToggle}
                onDelete={handleDeleteBoard}
                isAdmin={isUserAdmin(board)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 text-[#6d7f88] mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? 'No se encontraron resultados' : 'No hay tableros'}
            </h3>
            <p className="text-[#9db0b9] mb-6 max-w-md mx-auto">
              {searchQuery
                ? 'Intenta con otros términos de búsqueda'
                : 'Crea tu primer tablero para comenzar a organizar tus proyectos'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-500 text-white font-medium rounded-lg hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition shadow-lg shadow-primary/25"
              >
                Crear mi primer tablero
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        {boards.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1c2327]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-primary/20 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-[#9db0b9]">Total de tableros</p>
                    <p className="text-2xl font-bold text-white">{boards.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1c2327]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-500/20 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-[#9db0b9]">Favoritos</p>
                    <p className="text-2xl font-bold text-white">
                      {boards.filter(b => b.starred).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1c2327]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-500/20 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-[#9db0b9]">Actualizado recientemente</p>
                    <p className="text-2xl font-bold text-white">
                      {boards.filter(b => {
                        if (!b.updatedAt) return false;
                        const updatedDate = new Date(b.updatedAt);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return updatedDate > weekAgo;
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateBoard}
      />

      <DeleteBoardModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setBoardToDelete(null);
          setDeleteCounts(null);
        }}
        onConfirm={confirmDeleteBoard}
        boardName={boardToDelete?.name || ''}
        counts={deleteCounts}
        isLoading={isDeleting}
      />
    </div>
  );
};

// NavBar Component
const NavBar: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => (
  <nav className="bg-[#1c2327] border-b border-white/10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center">
          <div className="text-xl font-bold text-white">Board Manager</div>
          <div className="ml-8 flex space-x-4">
            <a href="/app" className="text-white hover:text-primary font-medium px-3 py-2 rounded-md text-sm transition-colors">
              Tableros
            </a>
            <a href="#" className="text-[#9db0b9] hover:text-white px-3 py-2 rounded-md text-sm transition-colors">
              Actividad
            </a>
            <a href="#" className="text-[#9db0b9] hover:text-white px-3 py-2 rounded-md text-sm transition-colors">
              Miembros
            </a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-[#9db0b9]">
            Hola, <span className="font-medium text-white">{user?.name || user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-lg hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  </nav>
);
