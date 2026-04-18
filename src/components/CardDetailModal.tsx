import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  MoreHorizontal, 
  Paperclip, 
  Tag, 
  Clock, 
  CheckSquare, 
  AlignLeft, 
  MessageSquare,
  ChevronDown,
  Loader2,
  Users
} from 'lucide-react';
import apiClient from '../lib/api-client';
import RichTextEditor from './RichTextEditor';
import AddPopoverMenu from './AddPopoverMenu';
import LabelsPopover from './LabelsPopover';
import MembersPopover from './MembersPopover';

interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
}

interface Attachment {
  id: string;
  url: string;
  name: string;
  mime: string;
  sizeBytes: number;
  createdAt: string;
}

interface CardData {
  id: string;
  title: string;
  listName: string;
  description?: string;
  attachments?: Attachment[];
  labels?: { id: string; name: string; color: string }[];
  assignees?: Member[];
}

interface ActivityItem {
  id: string;
  user: { name: string; initials: string };
  action: string;
  time: string;
  type: 'comment' | 'system';
}

interface CardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId?: string | null;
  boardId?: string;
  onUpdate?: () => void;
  // Prop for initial fast display
  initialData?: {
    title: string;
    listName: string;
  };
}

const CardDetailModal: React.FC<CardDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  cardId, 
  boardId,
  onUpdate,
  initialData 
}) => {
  const [card, setCard] = useState<CardData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  const [comment, setComment] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [activePopover, setActivePopover] = useState<'add' | 'labels' | 'members' | null>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [boardLabels, setBoardLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [boardMembers, setBoardMembers] = useState<Member[]>([]);
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);

  // Fetch board labels
  useEffect(() => {
    const fetchBoardData = async () => {
      if (!boardId) return;
      try {
        const [labelsRes, membersRes] = await Promise.all([
          apiClient.get<{ data: { labels: any[] } }>(`/api/boards/${boardId}/labels`),
          apiClient.get<{ data: { members: any[] } }>(`/api/boards/${boardId}/members`)
        ]);
        
        setBoardLabels(labelsRes.data.labels);
        setBoardMembers(membersRes.data.members.map(m => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          initials: (m.user.name || 'U').charAt(0).toUpperCase()
        })));
      } catch (err) {
        console.error('Error fetching board data:', err);
      }
    };

    if (isOpen && boardId) {
      fetchBoardData();
    }
  }, [isOpen, boardId]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    };

    if (activePopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePopover]);

  // Fetch card details
  const fetchCardDetails = useCallback(async () => {
    if (!cardId) return;
    
    setIsLoading(true);
    try {
      // Get card details
      const response = await apiClient.get<{ data: { card: any } }>(`/api/cards/${cardId}`);
      const cardData = response.data.card;
      
      const normalizedLabels = cardData.labels?.map((l: any) => l.label) || [];
      
      const mappedCard: CardData = {
        id: cardData.id,
        title: cardData.title,
        listName: initialData?.listName || 'Lista',
        description: cardData.description || '',
        attachments: cardData.attachments || [],
        labels: normalizedLabels
      };
      
      setCard(mappedCard);
      setSelectedLabelIds(normalizedLabels.map((l: any) => l.id));
      setAssignedMemberIds(cardData.assignees?.map((a: any) => a.user.id) || []);
      setEditTitle(cardData.title);
      setEditDescription(cardData.description || '');

      // Get comments and map to activity
      try {
        const commentsResponse = await apiClient.get<{ data: { comments: any[] } }>(`/api/cards/${cardId}/comments`);
        const commentActivities: ActivityItem[] = commentsResponse.data.comments.map(c => ({
          id: c.id,
          user: { 
            name: c.author.name || 'Usuario', 
            initials: (c.author.name || 'U').charAt(0).toUpperCase() 
          },
          action: 'comentó:',
          time: new Date(c.createdAt).toLocaleDateString(),
          type: 'comment' as const
        }));
        
        // Add a mock "system" activity for creation
        const systemActivity: ActivityItem = {
          id: 'system-1',
          user: { name: 'Sistema', initials: 'S' },
          action: 'ha creado esta tarjeta',
          time: 'Recientemente',
          type: 'system'
        };

        setActivities([systemActivity, ...commentActivities]);
      } catch (err) {
        console.error('Error fetching comments:', err);
      }

    } catch (err) {
      console.error('Error fetching card details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cardId, initialData]);

  useEffect(() => {
    if (isOpen && cardId) {
      fetchCardDetails();
    } else {
      setCard(null);
      setActivities([]);
    }
  }, [isOpen, cardId, fetchCardDetails]);

  // Handle updates
  const handleUpdateTitle = async () => {
    if (!cardId || !editTitle.trim() || (card && editTitle === card.title)) return;
    
    setIsSaving(true);
    try {
      await apiClient.patch(`/api/cards/${cardId}`, { title: editTitle });
      if (card) setCard({ ...card, title: editTitle });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating title:', err);
      if (card) setEditTitle(card.title);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateDescription = async (newContent?: string) => {
    const descriptionToSave = newContent !== undefined ? newContent : editDescription;
    if (!cardId || (card && descriptionToSave === card.description)) return;
    
    setIsSaving(true);
    try {
      await apiClient.patch(`/api/cards/${cardId}`, { description: descriptionToSave });
      if (card) {
        setCard({ ...card, description: descriptionToSave });
        setEditDescription(descriptionToSave);
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating description:', err);
      if (card) setEditDescription(card.description || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!cardId || !comment.trim()) return;
    
    setIsSaving(true);
    try {
      await apiClient.post(`/api/cards/${cardId}/comments`, { body: comment });
      setComment('');
      setIsCommentFocused(false);
      fetchCardDetails(); // Refresh to show new comment
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLabel = async (labelId: string) => {
    if (!cardId) return;
    
    const isSelected = selectedLabelIds.includes(labelId);
    
    try {
      if (isSelected) {
        await apiClient.delete(`/api/cards/${cardId}/labels/${labelId}`);
        setSelectedLabelIds(prev => prev.filter(id => id !== labelId));
      } else {
        await apiClient.post(`/api/cards/${cardId}/labels`, { labelId });
        setSelectedLabelIds(prev => [...prev, labelId]);
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error toggling label:', err);
    }
  };

  const handleCreateLabel = async (name: string, color: string) => {
    if (!boardId) return;
    try {
      await apiClient.post(`/api/boards/${boardId}/labels`, { name, color });
      // Refresh labels list
      const response = await apiClient.get<{ data: { labels: any[] } }>(`/api/boards/${boardId}/labels`);
      setBoardLabels(response.data.labels);
    } catch (err) {
      console.error('Error creating label:', err);
    }
  };

  const handleToggleMember = async (userId: string) => {
    if (!cardId) return;
    
    const isAssigned = assignedMemberIds.includes(userId);
    
    try {
      if (isAssigned) {
        await apiClient.delete(`/api/cards/${cardId}/assignees/${userId}`);
        setAssignedMemberIds(prev => prev.filter(id => id !== userId));
      } else {
        await apiClient.post(`/api/cards/${cardId}/assignees`, { userId });
        setAssignedMemberIds(prev => [...prev, userId]);
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error toggling member:', err);
    }
  };

  if (!isOpen) return null;

  // Use initial data if full card isn't loaded yet
  const displayTitle = card?.title || initialData?.title || 'Cargando...';
  const displayListName = card?.listName || initialData?.listName || '...';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-purple-900/20 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(122,90,248,0.3)] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header (Top Navigation) */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-zinc-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#F3E8FF] text-[#7A5AF8] rounded-[12px] font-bold text-sm hover:bg-purple-100 transition-colors">
              En lista: <span className="text-[#7A5AF8]">{displayListName}</span>
              <ChevronDown size={16} />
            </button>
            {isSaving && <Loader2 size={16} className="text-[#7A5AF8] animate-spin" />}
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-[#806F9B] hover:bg-zinc-100 rounded-full transition-colors">
              <Paperclip size={20} />
            </button>
            <button className="p-2 text-[#806F9B] hover:bg-zinc-100 rounded-full transition-colors">
              <MoreHorizontal size={20} />
            </button>
            <div className="w-px h-6 bg-zinc-200 mx-1" />
            <button 
              onClick={onClose}
              className="p-2 text-[#806F9B] hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
          
          {/* Card Title */}
          <div className="mb-8">
            <input 
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
              className="w-full text-4xl font-black text-zinc-900 tracking-tighter outline-none focus:bg-[#F3E8FF] rounded-lg px-2 -ml-2 transition-colors border-none ring-0"
              placeholder="Título de la tarjeta"
              disabled={isLoading}
            />
          </div>

          {/* Labels & Members Display (Phase 2 & 3) */}
          <div className="flex flex-wrap items-center gap-8 mb-6">
            {selectedLabelIds.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-[#806F9B] uppercase tracking-widest">Etiquetas</span>
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  {boardLabels.filter(l => selectedLabelIds.includes(l.id)).map(label => (
                    <div 
                      key={label.id}
                      style={{ backgroundColor: label.color }}
                      className="px-3 py-1 rounded-md text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-transform hover:scale-105"
                    >
                      {label.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-[#806F9B] uppercase tracking-widest">Responsables</span>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {boardMembers.filter(m => assignedMemberIds.includes(m.id)).map(member => (
                    <div 
                      key={member.id}
                      title={member.name}
                      className="w-8 h-8 rounded-full bg-[#7A5AF8] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm ring-1 ring-purple-50 transition-transform hover:scale-110 hover:z-10 cursor-help"
                    >
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.initials
                      )}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setActivePopover('members')}
                  className="w-8 h-8 rounded-full bg-slate-100 text-[#806F9B] flex items-center justify-center hover:bg-[#F3E8FF] hover:text-[#7A5AF8] transition-all"
                >
                  <span className="text-lg leading-none">+</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-12">
            
            {/* LEFT COLUMN: Main Content */}
            <div className="space-y-10">
              
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap gap-3 relative">
                <div className="relative">
                  <button 
                    onClick={() => setActivePopover(activePopover === 'add' ? null : 'add')}
                    className="flex items-center gap-2 bg-[#F3E8FF] text-[#7A5AF8] font-bold text-sm px-4 py-2.5 rounded-[12px] hover:bg-[#7A5AF8] hover:text-white transition-all shadow-sm"
                  >
                    <span className="text-lg leading-none">+</span> Añadir
                  </button>

                  {activePopover === 'add' && (
                    <div 
                      ref={popoverRef}
                      className="absolute top-full left-0 mt-2 z-[110]"
                    >
                      <AddPopoverMenu 
                        onClose={() => setActivePopover(null)} 
                        onSelectOption={(option) => {
                          if (option === 'labels') {
                            setActivePopover('labels');
                          } else if (option === 'members') {
                            setActivePopover('members');
                          } else {
                            // Add logic for other options here
                            console.log('Selected:', option);
                            setActivePopover(null);
                          }
                        }} 
                      />
                    </div>
                  )}

                  {activePopover === 'labels' && (
                    <div 
                      ref={popoverRef}
                      className="absolute top-full left-0 mt-2 z-[110]"
                    >
                      <LabelsPopover 
                        onClose={() => setActivePopover(null)}
                        selectedLabelIds={selectedLabelIds}
                        labels={boardLabels}
                        onToggleLabel={handleToggleLabel}
                        onEditLabel={(label) => console.log('Edit label:', label)}
                        onCreateLabel={handleCreateLabel}
                      />
                    </div>
                  )}

                  {activePopover === 'members' && (
                    <div 
                      ref={popoverRef}
                      className="absolute top-full left-0 mt-2 z-[110]"
                    >
                      <MembersPopover 
                        onClose={() => setActivePopover(null)}
                        boardMembers={boardMembers}
                        assignedMemberIds={assignedMemberIds}
                        onToggleMember={handleToggleMember}
                      />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setActivePopover(activePopover === 'labels' ? null : 'labels')}
                  className="flex items-center gap-2 bg-[#F3E8FF] text-[#7A5AF8] font-bold text-sm px-4 py-2.5 rounded-[12px] hover:bg-[#7A5AF8] hover:text-white transition-all shadow-sm"
                >
                  <Tag size={16} /> Etiquetas
                </button>
                <button 
                  onClick={() => setActivePopover(activePopover === 'members' ? null : 'members')}
                  className="flex items-center gap-2 bg-[#F3E8FF] text-[#7A5AF8] font-bold text-sm px-4 py-2.5 rounded-[12px] hover:bg-[#7A5AF8] hover:text-white transition-all shadow-sm"
                >
                  <Users size={16} /> Miembros
                </button>
                <button className="flex items-center gap-2 bg-[#F3E8FF] text-[#7A5AF8] font-bold text-sm px-4 py-2.5 rounded-[12px] hover:bg-[#7A5AF8] hover:text-white transition-all shadow-sm">
                  <Clock size={16} /> Fechas
                </button>
                <button className="flex items-center gap-2 bg-[#F3E8FF] text-[#7A5AF8] font-bold text-sm px-4 py-2.5 rounded-[12px] hover:bg-[#7A5AF8] hover:text-white transition-all shadow-sm">
                  <CheckSquare size={16} /> Checklist
                </button>
              </div>

              {/* Description Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-zinc-900">
                  <AlignLeft size={20} className="text-[#7A5AF8]" />
                  <h3 className="text-lg font-extrabold tracking-tight">Descripción</h3>
                </div>
                
                <RichTextEditor 
                  initialContent={editDescription}
                  onSave={(html) => handleUpdateDescription(html)}
                  onUploadSuccess={() => fetchCardDetails()}
                  cardId={cardId || undefined}
                />
              </div>

              {/* Attachments Section */}
              {(card?.attachments && card.attachments.length > 0) && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 text-zinc-900">
                    <Paperclip size={20} className="text-[#7A5AF8]" />
                    <h3 className="text-lg font-extrabold tracking-tight">Adjuntos</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {card.attachments.map((attachment) => (
                      <div key={attachment.id} className="group relative flex gap-4 p-3 bg-zinc-50 rounded-[16px] border border-zinc-100 hover:border-[#7A5AF8]/30 transition-all hover:shadow-md">
                        <div className="w-24 h-20 bg-zinc-200 rounded-[12px] overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {attachment.mime?.startsWith('image/') ? (
                            <img src={attachment.url} alt={attachment.name} className="w-full h-full object-cover" />
                          ) : (
                            <Paperclip size={24} className="text-zinc-400" />
                          )}
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <p className="text-sm font-bold text-zinc-900 truncate pr-6">{attachment.name}</p>
                          <p className="text-[11px] text-[#806F9B] mt-1 uppercase font-black tracking-wider">
                            {new Date(attachment.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex gap-3 mt-2">
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-[#7A5AF8] hover:underline"
                            >
                              Ver
                            </a>
                            <button className="text-xs font-bold text-red-500 hover:underline">
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Activity & Comments */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-900">
                  <MessageSquare size={20} className="text-[#7A5AF8]" />
                  <h3 className="text-lg font-extrabold tracking-tight">Actividad</h3>
                </div>
                <button className="text-xs font-bold text-[#806F9B] hover:text-[#7A5AF8] transition-colors">
                  Ocultar detalles
                </button>
              </div>

              {/* Comment Box */}
              <div className="space-y-3">
                <div className="relative">
                  <textarea 
                    rows={isCommentFocused ? 3 : 2}
                    placeholder="Escribe un comentario..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onFocus={() => setIsCommentFocused(true)}
                    className="w-full bg-[#F3E8FF] border-none rounded-[12px] p-4 text-zinc-900 placeholder:text-[#806F9B] outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 transition-all resize-none"
                    disabled={isLoading || isSaving}
                  />
                  {isCommentFocused && (
                    <div className="flex items-center gap-2 mt-2 animate-in slide-in-from-top-2 duration-200">
                      <button 
                        className="bg-[#7A5AF8] text-white font-bold text-sm px-6 py-2 rounded-[10px] hover:bg-[#6948e5] transition-colors shadow-lg shadow-purple-200 flex items-center gap-2 disabled:opacity-50"
                        onClick={handleAddComment}
                        disabled={!comment.trim() || isSaving}
                      >
                        {isSaving && <Loader2 size={14} className="animate-spin" />}
                        Guardar
                      </button>
                      <button 
                        className="text-[#806F9B] font-bold text-sm px-4 py-2 hover:text-zinc-900 transition-colors"
                        onClick={() => {
                          setIsCommentFocused(false);
                          setComment('');
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="space-y-6 pt-2">
                <div className="text-[10px] tracking-[0.4em] font-black text-[#806F9B] uppercase border-b border-zinc-100 pb-2">
                  Historial Reciente
                </div>
                
                {isLoading && activities.length === 0 ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={24} className="text-[#7A5AF8] animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-[#7A5AF8] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-100">
                          {activity.user.initials}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm leading-tight text-zinc-600">
                            <span className="font-bold text-zinc-900 mr-1">{activity.user.name}</span>
                            {activity.action}
                          </p>
                          <span className="text-xs text-[#806F9B] mt-1 font-medium">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;
