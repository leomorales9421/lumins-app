import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Search, Mail, Shield, Layout, MoreHorizontal, UserPlus } from 'lucide-react';
import apiClient from '../lib/api-client';
import type { Workspace } from '../types/workspace';
import Button from '../components/ui/Button';
import InviteMembersModal from '../components/InviteMembersModal';
import MemberSlideOver from '../components/MemberSlideOver';
import { motion } from 'framer-motion';
import type { WorkspaceMember } from '../types/workspace';

const MembersPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);

  const fetchWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ data: { workspace: Workspace } }>(`/api/workspaces/${workspaceId}`);
      setWorkspace(response.data.workspace);
    } catch (err) {
      console.error('Failed to fetch workspace members', err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const filteredMembers = workspace?.members.filter(member => 
    member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-[3px] border-[#E8E9EC] border-t-[#7A5AF8] rounded-full animate-spin" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex-1 p-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">Espacio de trabajo no encontrado</h2>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-12 font-sans max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#7A5AF8] mb-1">
            <Users size={18} strokeWidth={2.5} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Gestión de Equipo</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A2E] tracking-tight">Miembros del Equipo</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E8E9EC] rounded-xl text-sm focus:outline-none focus:border-[#7A5AF8] transition-all shadow-sm"
            />
          </div>
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="bg-[#7A5AF8] hover:bg-[#6949F6] text-white rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-md shadow-purple-100"
          >
            <UserPlus size={18} />
            <span className="hidden sm:inline">Invitar</span>
          </Button>
        </div>
      </div>

      {/* Members List Container */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FB] border-b border-zinc-100">
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Rol en Espacio</th>
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Tableros</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filteredMembers.map((member, index) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                key={member.id} 
                className="hover:bg-[#F8F9FB] transition-colors cursor-pointer group"
                onClick={() => setSelectedMember(member)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-50 border border-white shadow-sm flex items-center justify-center text-[#7A5AF8] font-bold overflow-hidden">
                      {member.user.avatarUrl ? (
                        <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{member.user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#1A1A2E]">{member.user.name}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail size={12} />
                        {member.user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${member.role === 'OWNER' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                      member.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                      'bg-slate-50 text-slate-600 border border-slate-100'}
                  `}>
                    <Shield size={10} />
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-[#7A5AF8] transition-colors">
                    <Layout size={14} />
                    <span className="text-xs font-bold">Ver accesos</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filteredMembers.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#F4F5F7] rounded-2xl flex items-center justify-center text-[#9CA3AF] mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A2E]">No se encontraron miembros</h3>
            <p className="text-[#6B7280]">Intenta ajustar tu búsqueda o invita a nuevos miembros.</p>
          </div>
        )}
      </div>

      <InviteMembersModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspaceId={workspaceId!}
        workspaceName={workspace.name}
      />

      <MemberSlideOver 
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        workspaceId={workspaceId!}
        onUpdate={fetchWorkspace}
      />
    </div>
  );
};

export default MembersPage;
