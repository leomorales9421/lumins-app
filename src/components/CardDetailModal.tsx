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
import ChecklistBlock from './ChecklistBlock';
import DatesPopover from './DatesPopover';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Checklist } from '../types/board';
import ActivitySection from './ActivitySection';
import type { ActivityItem } from '../types/activity';
import AttachmentsSection from './AttachmentsSection';
import AttachmentPopover from './AttachmentPopover';

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
  startDate?: string;
  dueDate?: string;
}

// ActivityItem interface is now imported from ../types/activity

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
  const [activePopover, setActivePopover] = useState<'add' | 'labels' | 'members' | 'dates' | 'attachments' | null>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [boardLabels, setBoardLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [boardMembers, setBoardMembers] = useState<Member[]>([]);
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const checklistsEndRef = React.useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
      
      if (cardData.startDate || cardData.dueDate) {
        setCard(prev => prev ? { 
          ...prev, 
          startDate: cardData.startDate, 
          dueDate: cardData.dueDate 
        } : null);
      }

      // Get comments and map to activity
      try {
        const commentsResponse = await apiClient.get<{ data: { comments: any[] } }>(`/api/cards/${cardId}/comments`);
        const commentActivities: ActivityItem[] = commentsResponse.data.comments.map(c => ({
          id: c.id,
          type: 'COMMENT',
          user: { 
            name: c.author?.name || 'Usuario', 
            avatarUrl: c.author?.avatarUrl,
            initials: (c.author?.name || 'U').charAt(0).toUpperCase() 
          },
          content: c.body,
          createdAt: c.createdAt
        }));
        
        // Map real system events from cardData.events
        const eventActivities: ActivityItem[] = cardData.events?.map((e: any) => ({
          id: e.id,
          type: 'SYSTEM_EVENT',
          user: { 
            name: e.user?.name || 'Sistema', 
            avatarUrl: e.user?.avatarUrl,
            initials: (e.user?.name || 'S').charAt(0).toUpperCase() 
          },
          action: e.description || (e.fromList && e.toList ? `ha movido esta tarjeta de ${e.fromList.name} a ${e.toList.name}` : 'ha realizado una acción'),
          createdAt: e.createdAt
        })) || [];

        const allActivities = [...eventActivities, ...commentActivities].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setActivities(allActivities);
      } catch (err) {
        console.error('Error fetching comments:', err);
      }

    } catch (err) {
      console.error('Error fetching card details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cardId, initialData]);

  const fetchChecklists = useCallback(async () => {
    if (!cardId) return;
    try {
      const response = await apiClient.get<{ data: { checklists: any[] } }>(`/api/cards/${cardId}/checklists`);
      setChecklists(response.data.checklists);
    } catch (err) {
      console.error('Error fetching checklists:', err);
    }
  }, [cardId]);

  useEffect(() => {
    if (isOpen && cardId) {
      fetchCardDetails();
      fetchChecklists();
    } else {
      setCard(null);
      setActivities([]);
    }
  }, [isOpen, cardId, fetchCardDetails, fetchChecklists]);

  // Autoscroll to new checklist
  useEffect(() => {
    if (checklists.length > 0) {
      checklistsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [checklists.length]);

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

  const handleAddComment = async (text: string) => {
    if (!cardId || !text.trim()) return;
    
    setIsSaving(true);
    try {
      await apiClient.post(`/api/cards/${cardId}/comments`, { body: text });
      fetchCardDetails(); // Refresh to show new comment
      if (onUpdate) onUpdate();
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

  const handleAddChecklist = async (title: string = 'Checklist') => {
    if (!cardId) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/api/cards/${cardId}/checklists`, { title });
      await fetchChecklists();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error creating checklist:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    try {
      await apiClient.delete(`/api/checklists/${id}`);
      setChecklists(prev => prev.filter(cl => cl.id !== id));
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error deleting checklist:', err);
    }
  };

  const handleAddChecklistItem = async (checklistId: string, title: string) => {
    try {
      await apiClient.post(`/api/checklists/${checklistId}/items`, { title });
      await fetchChecklists();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error adding checklist item:', err);
    }
  };

  const handleToggleChecklistItem = async (itemId: string, done: boolean) => {
    try {
      // Optimistic update
      setChecklists(prev => prev.map(cl => ({
        ...cl,
        items: cl.items.map(item => item.id === itemId ? { ...item, done } : item)
      })));
      await apiClient.patch(`/api/checklist-items/${itemId}`, { done });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error toggling checklist item:', err);
      await fetchChecklists(); // Rollback on error
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      await apiClient.delete(`/api/checklist-items/${itemId}`);
      await fetchChecklists();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error deleting checklist item:', err);
    }
  };

  const handleUpdateDates = async (dates: { startDate: string | null, dueDate: string | null }) => {
    if (!cardId) return;
    setIsSaving(true);
    try {
      await apiClient.patch(`/api/cards/${cardId}`, {
        startDate: dates.startDate,
        dueDate: dates.dueDate
      });
      if (card) {
        setCard({
          ...card,
          startDate: dates.startDate || undefined,
          dueDate: dates.dueDate || undefined
        });
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating dates:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDates = async () => {
    await handleUpdateDates({ startDate: null, dueDate: null });
  };
  
  const handleFileUpload = async (file: File) => {
    if (!file || !cardId) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande (máx 10MB)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      await apiClient.post(`/api/cards/${cardId}/attachments/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchCardDetails();
      if (onUpdate) onUpdate();
      setActivePopover(null);
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleAttachLink = async (url: string, name: string) => {
    if (!cardId) return;

    setIsUploading(true);
    try {
      await apiClient.post(`/api/cards/${cardId}/attachments/link`, { url, name });
      await fetchCardDetails();
      if (onUpdate) onUpdate();
      setActivePopover(null);
    } catch (err) {
      console.error('Error attaching link:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (attachmentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este adjunto?')) return;
    try {
      await apiClient.delete(`/api/attachments/${attachmentId}`);
      await fetchCardDetails();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error deleting attachment:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  if (!isOpen) return null;

  // Use initial data if full card isn't loaded yet
  const displayTitle = card?.title || initialData?.title || 'Cargando...';
  const displayListName = card?.listName || initialData?.listName || '...';

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay hint */}
      {isDragging && (
        <div className="absolute inset-0 z-[110] bg-[#7A5AF8]/20 backdrop-blur-sm flex items-center justify-center pointer-events-none border-4 border-dashed border-[#7A5AF8] rounded-[24px] m-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-bounce">
            <Paperclip size={48} className="text-[#7A5AF8]" />
            <p className="text-xl font-black text-zinc-900">Suelta para adjuntar</p>
          </div>
        </div>
      )}
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
            {isUploading && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                Subiendo...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActivePopover('attachments')}
              className="p-2 text-[#806F9B] hover:bg-zinc-100 rounded-full transition-colors"
            >
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

            {(card?.startDate || card?.dueDate) && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-[#806F9B] uppercase tracking-widest">Fechas</span>
                <div className="flex items-center gap-2">
                  <div 
                    onClick={() => setActivePopover('dates')}
                    className="flex items-center gap-2 bg-[#F3E8FF] text-[#7A5AF8] px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm cursor-pointer hover:bg-purple-100 transition-all border border-[#7A5AF8]/10"
                  >
                    <Clock size={14} />
                    <span>
                      {card.startDate && `${format(parseISO(card.startDate), 'd MMM', { locale: es })} - `}
                      {card.dueDate ? format(parseISO(card.dueDate), 'd MMM', { locale: es }) : 'Sin vencimiento'}
                      {card.dueDate && new Date(card.dueDate) < new Date() && (
                        <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] uppercase">Vencido</span>
                      )}
                    </span>
                    <ChevronDown size={14} className="ml-1 opacity-50" />
                  </div>
                </div>
              </div>
            )}
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
                          } else if (option === 'checklist') {
                            handleAddChecklist();
                            setActivePopover(null);
                          } else if (option === 'dates') {
                            setActivePopover('dates');
                          } else if (option === 'attachment') {
                            setActivePopover('attachments');
                          } else {
                            // Add logic for other options here
                            console.log('Selected:', option);
                            setActivePopover(null);
                          }
                        }} 
                      />
                    </div>
                  )}

                  {activePopover === 'attachments' && (
                    <div 
                      ref={popoverRef}
                      className="absolute top-full left-0 mt-2 z-[110]"
                    >
                      <AttachmentPopover 
                        onClose={() => setActivePopover(null)}
                        onUploadFile={handleFileUpload}
                        onAttachLink={handleAttachLink}
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
                 <div className="relative">
                  <button 
                    onClick={() => setActivePopover(activePopover === 'dates' ? null : 'dates')}
                    className="flex items-center gap-2 bg-[#F3E8FF] text-[#7A5AF8] font-bold text-sm px-4 py-2.5 rounded-[12px] hover:bg-[#7A5AF8] hover:text-white transition-all shadow-sm"
                  >
                    <Clock size={16} /> Fechas
                  </button>

                  {activePopover === 'dates' && (
                    <div 
                      ref={popoverRef}
                      className="absolute top-full left-0 mt-2 z-[110]"
                    >
                      <DatesPopover 
                        onClose={() => setActivePopover(null)}
                        startDate={card?.startDate || null}
                        dueDate={card?.dueDate || null}
                        onSaveDates={handleUpdateDates}
                        onRemoveDates={handleRemoveDates}
                      />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleAddChecklist()}
                  className="flex items-center gap-2 bg-[#F3E8FF] text-[#7A5AF8] font-bold text-sm px-4 py-2.5 rounded-[12px] hover:bg-[#7A5AF8] hover:text-white transition-all shadow-sm"
                >
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

              {/* Checklists Section */}
              {checklists.map((checklist) => (
                <ChecklistBlock
                  key={checklist.id}
                  checklist={checklist}
                  onAddItem={handleAddChecklistItem}
                  onToggleItem={handleToggleChecklistItem}
                  onDeleteItem={handleDeleteChecklistItem}
                  onDeleteChecklist={handleDeleteChecklist}
                  onUpdateItemTitle={(itemId, title) => console.log('Update title', itemId, title)}
                />
              ))}

              <div ref={checklistsEndRef} />

              <AttachmentsSection 
                attachments={card?.attachments || []} 
                onDelete={handleFileDelete}
              />
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

              {/* Activity Component */}
              <ActivitySection 
                activities={activities} 
                onAddComment={handleAddComment}
                isLoading={isSaving}
              />


            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;
