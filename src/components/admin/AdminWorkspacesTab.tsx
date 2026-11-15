import React, { useMemo, useState } from 'react';
import { Building2, Search, ExternalLink } from 'lucide-react';
import type { AdminWorkspace } from './types';

interface AdminWorkspacesTabProps {
  workspaces: AdminWorkspace[];
  currentUserId?: string;
  onEnterWorkspace: (ws: AdminWorkspace) => void;
}

const AdminWorkspacesTab: React.FC<AdminWorkspacesTabProps> = ({
  workspaces,
  currentUserId,
  onEnterWorkspace,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredWorkspaces = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter(
      (ws) =>
        ws.name.toLowerCase().includes(q) ||
        ws.owner.name.toLowerCase().includes(q) ||
        ws.owner.email.toLowerCase().includes(q)
    );
  }, [workspaces, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredWorkspaces.length / perPage));
  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredWorkspaces.slice(start, start + perPage);
  }, [filteredWorkspaces, page, perPage]);

  return (
    <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl overflow-hidden backdrop-blur-xl">
      <div className="p-6 border-b border-cu-border dark:border-dark-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <Building2 size={20} className="text-[#12A9A8]" />
          Espacios de Trabajo ({filteredWorkspaces.length})
        </h2>
        <div className="relative w-full sm:w-80">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-cu-muted dark:text-zinc-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Buscar espacio o propietario..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:border-[#12A9A8]/60 outline-none transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-cu-border dark:border-dark-border text-[11px] font-black uppercase tracking-widest text-cu-muted dark:text-zinc-500 bg-slate-50 dark:bg-white/[0.02]">
              <th className="px-6 py-4">Espacio de Trabajo</th>
              <th className="px-6 py-4">Propietario</th>
              <th className="px-6 py-4">Estructura</th>
              <th className="px-6 py-4">Creación</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cu-border dark:divide-dark-border text-sm">
            {paginated.length > 0 ? (
              paginated.map((ws) => {
                const isOwn = ws.owner?.id === currentUserId;
                return (
                  <tr
                    key={ws.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-cu-text dark:text-zinc-100 flex items-center gap-2">
                        <span>{ws.name}</span>
                        {isOwn && (
                          <span className="px-2 py-0.5 rounded-md bg-[#12A9A8]/12 text-[#12A9A8] text-[10px] font-black uppercase tracking-wider">
                            Tu espacio
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-cu-muted dark:text-zinc-500 truncate max-w-xs">
                        {ws.description || 'Sin descripción'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-cu-text dark:text-zinc-200">{ws.owner.name}</div>
                      <div className="text-xs text-cu-muted dark:text-zinc-500">{ws.owner.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black">{ws._count.boards}</span>
                          <span className="text-[10px] text-cu-muted dark:text-zinc-500 uppercase">
                            Tableros
                          </span>
                        </div>
                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />
                        <div className="flex flex-col">
                          <span className="text-sm font-black">{ws._count.members}</span>
                          <span className="text-[10px] text-cu-muted dark:text-zinc-500 uppercase">
                            Miembros
                          </span>
                        </div>
                        {ws.totalCards !== undefined && (
                          <>
                            <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />
                            <div className="flex flex-col">
                              <span className="text-sm font-black">{ws.totalCards}</span>
                              <span className="text-[10px] text-cu-muted dark:text-zinc-500 uppercase">
                                Tarjetas
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-cu-muted dark:text-zinc-500">
                      {new Date(ws.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onEnterWorkspace(ws)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer ${
                          isOwn
                            ? 'bg-[#12A9A8]/10 text-[#12A9A8] border border-[#12A9A8]/25 hover:bg-[#12A9A8] hover:text-white'
                            : 'bg-[#FF665E]/10 text-[#FF665E] border border-[#FF665E]/25 hover:bg-[#FF665E] hover:text-white'
                        }`}
                        title={isOwn ? 'Abrir tu espacio' : 'Ingresar e impersonar espacio'}
                      >
                        <span>{isOwn ? 'Abrir' : 'Impersonar'}</span>
                        <ExternalLink size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="px-4 py-16 flex flex-col items-center justify-center text-center text-sm text-cu-muted dark:text-zinc-500">
                    <Building2 size={32} className="opacity-20 mb-3" />
                    <p>No se encontraron espacios de trabajo.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredWorkspaces.length > 0 && (
        <div className="px-6 py-4 border-t border-cu-border dark:border-dark-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-cu-muted dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-lg px-2 py-1 outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>de {filteredWorkspaces.length} espacios</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 disabled:opacity-30 cursor-pointer"
            >
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 disabled:opacity-30 cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkspacesTab;
