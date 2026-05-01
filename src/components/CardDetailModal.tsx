import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

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
  Users,
  Zap,
  Edit2,
  Plus
} from 'lucide-react';
import apiClient from '../lib/api-client';
import RichTextEditor, { type RichTextEditorRef } from './RichTextEditor';
import { fixEncoding } from '../lib/encoding';
import { sanitizeHtmlForRender } from '../lib/sanitize';
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
import PropertiesPopover from './PropertiesPopover';
import CardOptionsMenu from './CardOptionsMenu';
import MoveCardPopover from './MoveCardPopover';
import Popover from './ui/Popover';
import SmartPopover from './SmartPopover';
import UserAvatar from './ui/UserAvatar';
import CardModalSkeleton from './ui/CardModalSkeleton';
import { useBoardPermissions } from '../hooks/useBoardPermissions';
import { useAuth } from '../contexts/AuthContext';
import { compressAttachment } from '../lib/image-utils';


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
  listId: string;
  description?: string;
  attachments?: Attachment[];
  labels?: { id: string; name: string; color: string }[];
  assignees?: Member[];
  startDate?: string;
  dueDate?: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3' | null;
  riskLevel?: 'low' | 'med' | 'high' | null;
  module?: string | null;
  isDone?: boolean;
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
  const { user } = useAuth();
  const { canModerate, isReadOnly } = useBoardPermissions(boardId);
  const [card, setCard] = useState<CardData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);
  const [isFetchingMoreActivity, setIsFetchingMoreActivity] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  const [comment, setComment] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [activePopover, setActivePopover] = useState<'add' | 'labels' | 'members' | 'dates' | 'attachments' | 'properties' | 'options' | 'move' | null>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<RichTextEditorRef>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [boardLabels, setBoardLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [boardMembers, setBoardMembers] = useState<Member[]>([]);
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const checklistsEndRef = React.useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

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
        const mappedMembers = membersRes.data.members.map(m => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
          initials: (m.user.name || 'U').charAt(0).toUpperCase()
        }));
        
        console.log('[DEBUG] Mapped Members:', mappedMembers);
        setBoardMembers(mappedMembers);
      } catch (err) {
        console.error('Error fetching board data:', err);
      }
    };

    if (isOpen && boardId) {
      fetchBoardData();
    }
  }, [isOpen, boardId]);

  // Handle click outside to close popover
  // Removed in favor of Radix UI internal handling

  // Fetch card details
  const fetchCardDetails = useCallback(async (silent = false) => {
    if (!cardId) return;
    
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      // Get card details
      const response = await apiClient.get<{ data: { card: any } }>(`/api/cards/${cardId}`);
      const cardData = response.data.card;
      
      const normalizedLabels = cardData.labels?.map((l: any) => l.label) || [];
      
      const mappedCard: CardData = {
        id: cardData.id,
        title: cardData.title,
        listName: cardData.list?.name || initialData?.listName || 'Lista',
        listId: cardData.listId,
        description: cardData.description || '',
        attachments: cardData.attachments || [],
        labels: normalizedLabels,
        priority: cardData.priority,
        riskLevel: cardData.riskLevel,
        module: cardData.module,
        isDone: cardData.isDone
      };
      
      setCard(mappedCard);
      setSelectedLabelIds(normalizedLabels.map((l: any) => l.id));
      const assignedIds = cardData.assignees?.map((a: any) => a.user.id) || [];
      console.log('[DEBUG] Assigned IDs:', assignedIds);
      setAssignedMemberIds(assignedIds);
      setEditTitle(cardData.title);
      setEditDescription(cardData.description || '');
      
      if (cardData.startDate || cardData.dueDate) {
        setCard(prev => prev ? { 
          ...prev, 
          startDate: cardData.startDate, 
          dueDate: cardData.dueDate 
        } : null);
      }

      // Get initial activity feed
      try {
        const feedRes = await apiClient.get<{ 
          data: { feed: any[], hasMore: boolean, totalCount: number } 
        }>(`/api/cards/${cardId}/feed?page=1&limit=15`);
        
        const mappedFeed: ActivityItem[] = feedRes.data.feed.map(item => ({
          id: item.id,
          type: item.type === 'COMMENT' ? 'COMMENT' : 'SYSTEM_EVENT',
          user: {
            id: item.user.id,
            name: item.user.name,
            avatarUrl: item.user.avatarUrl,
            initials: (item.user.name || 'U').charAt(0).toUpperCase()
          },
          content: item.type === 'COMMENT' ? item.description : undefined,
          action: item.type !== 'COMMENT' ? (item.description || (item.fromList && item.toList ? `ha movido esta tarjeta de ${item.fromList.name} a ${item.toList.name}` : 'ha realizado una acción')) : undefined,
          commentId: item.commentId,
          comment: item.comment,
          createdAt: item.createdAt
        }));

        setActivities(mappedFeed);
        setHasMoreActivities(feedRes.data.hasMore);
        setActivityPage(1);
      } catch (err) {
        console.error('Error fetching activity feed:', err);
      }

    } catch (err) {
      console.error('Error fetching card details:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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

  const handleLoadMoreActivities = async () => {
    if (!cardId || isFetchingMoreActivity || !hasMoreActivities) return;

    setIsFetchingMoreActivity(true);
    try {
      const nextPage = activityPage + 1;
      const response = await apiClient.get<{ 
        data: { feed: any[], hasMore: boolean } 
      }>(`/api/cards/${cardId}/feed?page=${nextPage}&limit=15`);
      
      const newActivities: ActivityItem[] = response.data.feed.map(item => ({
        id: item.id,
        type: item.type === 'COMMENT' ? 'COMMENT' : 'SYSTEM_EVENT',
        user: {
          id: item.user.id,
          name: item.user.name,
          avatarUrl: item.user.avatarUrl,
          initials: (item.user.name || 'U').charAt(0).toUpperCase()
        },
        content: item.type === 'COMMENT' ? item.description : undefined,
        action: item.type !== 'COMMENT' ? (item.description || (item.fromList && item.toList ? `ha movido esta tarjeta de ${item.fromList.name} a ${item.toList.name}` : 'ha realizado una acción')) : undefined,
        commentId: item.commentId,
        comment: item.comment,
        createdAt: item.createdAt
      }));

      setActivities(prev => [...prev, ...newActivities]);
      setHasMoreActivities(response.data.hasMore);
      setActivityPage(nextPage);
    } catch (err) {
      console.error('Error loading more activity:', err);
    } finally {
      setIsFetchingMoreActivity(false);
    }
  };

  useEffect(() => {
    if (isOpen && cardId) {
      fetchCardDetails();
      fetchChecklists();
    } else {
      setCard(null);
      setActivities([]);
      setActivityPage(1);
      setHasMoreActivities(false);
    }
  }, [isOpen, cardId, fetchCardDetails, fetchChecklists]);

  // Listen for real-time updates
  useEffect(() => {
    const handleCardUpdate = (e: any) => {
      const { cardId: updatedCardId } = e.detail;
      if (updatedCardId === cardId && isOpen) {
        console.log('CardDetailModal: Real-time update received');
        fetchCardDetails(true); // silent refresh
        fetchChecklists();
      }
    };

    window.addEventListener('lumins:card-updated', handleCardUpdate);
    window.addEventListener('lumins:board-updated', handleCardUpdate); // Some board events affect cards too
    
    return () => {
      window.removeEventListener('lumins:card-updated', handleCardUpdate);
      window.removeEventListener('lumins:board-updated', handleCardUpdate);
    };
  }, [cardId, isOpen, fetchCardDetails, fetchChecklists]);

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
      await apiClient.post(`/api/cards/${cardId}/comments`, { content: text });
      fetchCardDetails(true); // Refresh silently to show new comment
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateComment = async (commentId: string, text: string) => {
    if (!text.trim()) return;
    
    setIsSaving(true);
    try {
      await apiClient.put(`/api/comments/${commentId}`, { content: text });
      fetchCardDetails(true); // Refresh silently to show updated comment
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating comment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setIsSaving(true);
    try {
      await apiClient.delete(`/api/comments/${commentId}`);
      fetchCardDetails(true); // Refresh silently to remove deleted comment
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error deleting comment:', err);
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

  const handleEditLabel = async (labelId: string, name: string, color: string) => {
    if (!boardId) return;
    try {
      await apiClient.patch(`/api/boards/${boardId}/labels/${labelId}`, { name, color });
      // Refresh labels list
      const response = await apiClient.get<{ data: { labels: any[] } }>(`/api/boards/${boardId}/labels`);
      setBoardLabels(response.data.labels);
      // Also refresh card details to update badges if this label is on the card
      fetchCardDetails(true);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error editing label:', err);
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!boardId) return;
    try {
      await apiClient.delete(`/api/boards/${boardId}/labels/${labelId}`);
      // Update selected labels locally if it was selected
      setSelectedLabelIds(prev => prev.filter(id => id !== labelId));
      // Refresh labels list
      const response = await apiClient.get<{ data: { labels: any[] } }>(`/api/boards/${boardId}/labels`);
      setBoardLabels(response.data.labels);
      // Refresh card details
      fetchCardDetails(true);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error deleting label:', err);
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

  const handleArchiveCard = async () => {
    if (!cardId) return;
    setIsSaving(true);
    try {
      // According to schema, status 'closed' is used for archiving
      await apiClient.patch(`/api/cards/${cardId}`, { status: 'closed' });
      if (onUpdate) onUpdate();
      onClose(); // Close modal after archiving
    } catch (err) {
      console.error('Error archiving card:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateProperties = async (properties: { priority?: string | null; riskLevel?: string | null; module?: string | null }) => {
    if (!cardId) return;
    
    // Optimistic update
    if (card) {
      setCard({
        ...card,
        ...properties as any
      });
    }

    try {
      await apiClient.patch(`/api/cards/${cardId}`, properties);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating properties:', err);
      // Rollback on error
      fetchCardDetails();
    }
  };

  const handleToggleDone = async () => {
    if (!cardId || !card) return;
    
    const newDoneState = !card.isDone;
    
    // Optimistic update
    setCard({ ...card, isDone: newDoneState });
    
    try {
      await apiClient.patch(`/api/cards/${cardId}`, { isDone: newDoneState });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error toggling done state:', err);
      // Rollback
      setCard({ ...card, isDone: card.isDone });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !cardId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Archivo demasiado grande', {
        description: 'El archivo es demasiado grande (máx 10MB)'
      });
      return;
    }



    let fileToUpload = file;
    
    // Si es una imagen, la comprimimos
    if (file.type.startsWith('image/')) {
      try {
        fileToUpload = await compressAttachment(file);
      } catch (err) {
        console.error('Error compressing attachment:', err);
        // Continuamos con el original si falla
      }
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);

    setIsUploading(true);
    try {
      await apiClient.post(`/api/cards/${cardId}/attachments/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchCardDetails(true);
      if (onUpdate) onUpdate();
      setActivePopover(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error('Error al subir el archivo', {
        description: 'Hubo un problema al procesar tu archivo. Por favor, inténtalo de nuevo.'
      });
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
      await fetchCardDetails(true);
      if (onUpdate) onUpdate();
      setActivePopover(null);
    } catch (err) {
      console.error('Error attaching link:', err);
      toast.error('Error al adjuntar el enlace', {
        description: 'No se pudo adjuntar el enlace. Verifica la URL e inténtalo de nuevo.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (attachmentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este adjunto?')) return;
    try {
      await apiClient.delete(`/api/attachments/${attachmentId}`);
      await fetchCardDetails(true);
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 md:p-10"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay hint */}
      {isDragging && (
        <div className="absolute inset-0 z-[110] bg-[#6C5DD3]/20 backdrop-blur-sm flex items-center justify-center pointer-events-none border-4 border-dashed border-[#6C5DD3] rounded m-4">
          <div className="bg-white dark:bg-[#1C1F26] p-8 rounded shadow-2xl flex flex-col items-center gap-4 animate-bounce border border-zinc-200 dark:border-white/10">
            <Paperclip size={48} className="text-[#6C5DD3]" />
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">Suelta para adjuntar</p>
          </div>
        </div>
      )}
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#13151A]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full sm:max-w-5xl h-full sm:h-auto sm:max-h-[90vh] bg-white dark:bg-[#1C1F26] sm:rounded shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 sm:border border-zinc-200 dark:border-white/10">
        
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-white/5 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-white dark:bg-[#1C1F26]">
          <div className="flex items-center gap-2">
            <SmartPopover
              isOpen={activePopover === 'move'}
              onClose={() => setActivePopover(null)}
              placement="bottom-start"
              trigger={
                <button
                  onClick={() => setActivePopover(activePopover === 'move' ? null : 'move')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 rounded font-semibold text-[12px] hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-[#6C5DD3] transition-colors border border-zinc-200 dark:border-white/10"
                >
                  En lista: <span className="text-[#6C5DD3] font-bold">{displayListName}</span>
                  <ChevronDown size={16} />
                </button>
              }
              content={
                <MoveCardPopover 
                  cardId={cardId || ''}
                  currentBoardId={boardId || ''}
                  currentListId={card?.listId || ''}
                  onClose={() => setActivePopover(null)}
                  onMoveSuccess={(movedToAnotherBoard) => {
                    if (onUpdate) onUpdate();
                    if (movedToAnotherBoard) {
                      onClose(); // Close modal if moved to another board
                    } else {
                      fetchCardDetails(); // Just refresh if same board
                    }
                  }}
                />
              }
            />
            <button
              onClick={handleToggleDone}
              className={`flex items-center gap-2 px-3 py-1.5 rounded font-bold text-[12px] transition-all border ${
                card?.isDone 
                  ? 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20' 
                  : 'bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-[#6C5DD3]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                card?.isDone ? 'bg-green-500 border-green-500' : 'border-zinc-400 dark:border-zinc-500'
              }`}>
                {card?.isDone && <CheckSquare size={10} className="text-white" />}
              </div>
              {card?.isDone ? 'Listo' : 'Marcar como listo'}
            </button>
            {(isSaving || isRefreshing) && (
              <div className="flex items-center gap-2 px-3 py-1 bg-[#6C5DD3]/5 border border-[#6C5DD3]/10 text-[#6C5DD3] rounded text-[11px] font-bold animate-in fade-in zoom-in duration-300">
                <Loader2 size={12} className="animate-spin" />
                {isRefreshing ? 'Actualizando...' : 'Guardando...'}
              </div>
            )}
            {isUploading && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-[11px] font-bold animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                Subiendo...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <SmartPopover
                isOpen={activePopover === 'attachments'}
                onClose={() => setActivePopover(null)}
                placement="bottom-end"
                trigger={
                  <button 
                    onClick={() => setActivePopover(activePopover === 'attachments' ? null : 'attachments')}
                    className={`p-2 rounded transition-colors ${activePopover === 'attachments' ? 'bg-zinc-100 dark:bg-white/10 text-[#6C5DD3]' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                  >
                    <Paperclip size={20} />
                  </button>
                }
                content={
                  <AttachmentPopover 
                    onClose={() => setActivePopover(null)}
                    onUploadFile={handleFileUpload}
                    onAttachLink={handleAttachLink}
                    isUploading={isUploading}
                  />
                }
              />
            )}
            <SmartPopover
              isOpen={activePopover === 'options'}
              onClose={() => setActivePopover(null)}
              placement="bottom-end"
              trigger={
                <button 
                  onClick={() => setActivePopover(activePopover === 'options' ? null : 'options')}
                  className={`p-2 rounded transition-colors ${activePopover === 'options' ? 'bg-zinc-100 dark:bg-white/10 text-[#6C5DD3]' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                >
                  <MoreHorizontal size={20} />
                </button>
              }
              content={
                <CardOptionsMenu 
                  cardId={cardId || ''}
                  assignedMemberIds={assignedMemberIds}
                  onToggleJoin={handleToggleMember}
                  onArchive={handleArchiveCard}
                  onClose={() => setActivePopover(null)}
                  canModerate={canModerate}
                />
              }
            />
            <div className="w-px h-5 bg-zinc-200 dark:bg-white/10 mx-1" />
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        {isLoading && !card ? (
          <CardModalSkeleton />
        ) : (
          <div className="flex-1 overflow-y-auto p-6 pt-5 custom-scrollbar">
            
            {/* Card Title */}
          <div className="mb-8">
            <input 
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
              className="w-full text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight outline-none focus:bg-zinc-100 dark:focus:bg-white/5 rounded px-2 -ml-2 transition-colors border-none ring-0 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-transparent"
              placeholder="Título de la tarjeta"
              disabled={isLoading}
            />
          </div>

          {/* Labels & Members Display (Phase 2 & 3) */}
          <div className="flex flex-wrap items-center gap-8 mb-6">
            {selectedLabelIds.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="cu-section-label">Etiquetas</span>
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  {boardLabels.filter(l => selectedLabelIds.includes(l.id)).map(label => (
                    <div 
                      key={label.id}
                      style={{ backgroundColor: label.color }}
                      className="px-3 py-1 rounded text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-transform hover:scale-105"
                    >
                      {label.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="cu-section-label">Responsables</span>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {boardMembers.filter(m => assignedMemberIds.includes(m.id)).map(member => (
                    <div 
                      key={member.id}
                      title={member.name}
                      className="w-8 h-8 rounded border-2 border-white dark:border-[#1C1F26] shadow-sm transition-transform hover:scale-110 hover:z-10 cursor-help"
                    >
                      <UserAvatar 
                        name={member.name} 
                        avatarUrl={member.avatarUrl} 
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
                <SmartPopover
                  isOpen={activePopover === 'members_header'}
                  onClose={() => setActivePopover(null)}
                  trigger={
                    <button 
                      onClick={() => setActivePopover(activePopover === 'members_header' ? null : 'members_header')}
                      className="w-8 h-8 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-[#6C5DD3] transition-all"
                    >
                      <span className="text-lg leading-none">+</span>
                    </button>
                  }
                  content={
                    <MembersPopover 
                      onClose={() => setActivePopover(null)}
                      boardMembers={boardMembers}
                      assignedMemberIds={assignedMemberIds}
                      onToggleMember={handleToggleMember}
                    />
                  }
                />
              </div>
            </div>

            {(card?.startDate || card?.dueDate) && (
              <div className="flex flex-col gap-2">
                <span className="cu-section-label">Fechas</span>
                <div className="flex items-center gap-2">
                  <SmartPopover
                    isOpen={activePopover === 'dates_badge'}
                    onClose={() => setActivePopover(null)}
                    trigger={
                      <div 
                        onClick={() => setActivePopover(activePopover === 'dates_badge' ? null : 'dates_badge')}
                        className="flex items-center gap-2 bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded font-semibold text-[12px] cursor-pointer hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-[#6C5DD3] transition-all border border-zinc-200 dark:border-white/10"
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
                    }
                    content={
                      <DatesPopover 
                        onClose={() => setActivePopover(null)}
                        onSaveDates={handleUpdateDates}
                        onRemoveDates={handleRemoveDates}
                        startDate={card?.startDate || null}
                        dueDate={card?.dueDate || null}
                      />
                    }
                  />
                </div>
              </div>
            )}

            {(card?.priority || card?.riskLevel || card?.module) && (
              <div className="flex flex-col gap-2">
                <span className="cu-section-label">Propiedades</span>
                <SmartPopover
                  isOpen={activePopover === 'properties'}
                  onClose={() => setActivePopover(null)}
                  trigger={
                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      {card.priority && card.priority !== 'P3' && (
                        <div 
                          onClick={() => setActivePopover(activePopover === 'properties' ? null : 'properties')}
                          className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 shadow-sm border
                            ${card.priority === 'P0' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' : 
                              card.priority === 'P1' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20' : 
                              'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'}`}
                        >
                          <Zap size={12} fill="currentColor" />
                          {card.priority === 'P0' ? 'P0 - Crítica' : card.priority === 'P1' ? 'P1 - Alta' : 'P2 - Media'}
                        </div>
                      )}
                      {card.priority === 'P3' && (
                        <div 
                          onClick={() => setActivePopover(activePopover === 'properties' ? null : 'properties')}
                          className="px-3 py-1.5 rounded text-xs font-bold bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
                        >
                          <Zap size={12} />
                          P3 - Baja
                        </div>
                      )}
                      {card.riskLevel && (
                        <div 
                          onClick={() => setActivePopover(activePopover === 'properties' ? null : 'properties')}
                          className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 shadow-sm border
                            ${card.riskLevel === 'high' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' : 
                              card.riskLevel === 'med' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' : 
                              'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'}`}
                        >
                          Riesgo {card.riskLevel === 'high' ? 'Alto' : card.riskLevel === 'med' ? 'Medio' : 'Bajo'}
                        </div>
                      )}
                      {card.module && (
                        <div 
                          onClick={() => setActivePopover(activePopover === 'properties' ? null : 'properties')}
                          className="px-3 py-1.5 rounded text-xs font-bold bg-zinc-100 dark:bg-white/5 text-[#6C5DD3] border border-zinc-200 dark:border-white/10 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 shadow-sm"
                        >
                          {card.module}
                        </div>
                      )}
                    </div>
                  }
                  content={
                    <PropertiesPopover 
                      onClose={() => setActivePopover(null)}
                      onBack={() => setActivePopover(null)}
                      currentPriority={card?.priority}
                      currentRiskLevel={card?.riskLevel}
                      currentModule={card?.module}
                      onUpdate={handleUpdateProperties}
                    />
                  }
                />
              </div>
            )}
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-12">
            
            {/* LEFT COLUMN: Main Content */}
            <div className="space-y-10">
              
              {/* Quick Actions Bar */}
              {!isReadOnly && (
              <div className="flex flex-wrap gap-3 relative">
                <SmartPopover
                  isOpen={activePopover === 'add' || activePopover === 'attachments_main' || activePopover === 'labels_main' || activePopover === 'members_main' || activePopover === 'dates_main' || activePopover === 'properties_main'}
                  onClose={() => setActivePopover(null)}
                  placement="bottom-start"
                  trigger={
                    <button 
                      onClick={() => setActivePopover(activePopover === 'add' ? null : 'add')}
                      className="flex items-center justify-center gap-2 min-w-[125px] px-4 py-2.5 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-[#6C5DD3] transition-all shadow-sm"
                    >
                      <Plus size={18} /> Añadir
                    </button>
                  }
                  content={
                    <>
                      {activePopover === 'add' && (
                        <AddPopoverMenu 
                          onClose={() => setActivePopover(null)} 
                          onSelectOption={(option) => {
                            if (option === 'labels') {
                              setActivePopover('labels_main');
                            } else if (option === 'members') {
                              setActivePopover('members_main');
                            } else if (option === 'checklist') {
                              handleAddChecklist();
                              setActivePopover(null);
                            } else if (option === 'dates') {
                              setActivePopover('dates_main');
                            } else if (option === 'attachment') {
                              setActivePopover('attachments_main');
                            } else if (option === 'properties') {
                              setActivePopover('properties_main');
                            } else {
                              setActivePopover(null);
                            }
                          }} 
                        />
                      )}

                      {activePopover === 'attachments_main' && (
                        <AttachmentPopover 
                          onClose={() => setActivePopover(null)}
                          onUploadFile={handleFileUpload}
                          onAttachLink={handleAttachLink}
                          isUploading={isUploading}
                        />
                      )}

                      {activePopover === 'labels_main' && (
                        <LabelsPopover 
                          onClose={() => setActivePopover(null)}
                          selectedLabelIds={selectedLabelIds}
                          labels={boardLabels}
                          onToggleLabel={handleToggleLabel}
                          onEditLabel={handleEditLabel}
                          onCreateLabel={handleCreateLabel}
                          onDeleteLabel={handleDeleteLabel}
                        />
                      )}

                      {activePopover === 'members_main' && (
                        <MembersPopover 
                          onClose={() => setActivePopover(null)}
                          boardMembers={boardMembers}
                          assignedMemberIds={assignedMemberIds}
                          onToggleMember={handleToggleMember}
                        />
                      )}

                      {activePopover === 'dates_main' && (
                        <DatesPopover 
                          onClose={() => setActivePopover(null)}
                          onSaveDates={handleUpdateDates}
                          onRemoveDates={handleRemoveDates}
                          startDate={card?.startDate || null}
                          dueDate={card?.dueDate || null}
                        />
                      )}

                      {activePopover === 'properties_main' && (
                        <PropertiesPopover 
                          onClose={() => setActivePopover(null)}
                          onBack={() => setActivePopover('add')}
                          currentPriority={card?.priority}
                          currentRiskLevel={card?.riskLevel}
                          currentModule={card?.module}
                          onUpdate={handleUpdateProperties}
                        />
                      )}
                    </>
                  }
                />

                <SmartPopover
                  isOpen={activePopover === 'labels'}
                  onClose={() => setActivePopover(null)}
                  trigger={
                    <button 
                      onClick={() => setActivePopover(activePopover === 'labels' ? null : 'labels')}
                      className="flex items-center justify-center gap-2 min-w-[125px] px-3 py-2.5 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-[#6C5DD3] transition-all shadow-sm"
                    >
                      <Tag size={16} /> Etiquetas
                    </button>
                  }
                  content={
                    <LabelsPopover 
                      onClose={() => setActivePopover(null)}
                      selectedLabelIds={selectedLabelIds}
                      labels={boardLabels}
                      onToggleLabel={handleToggleLabel}
                      onEditLabel={handleEditLabel}
                      onCreateLabel={handleCreateLabel}
                      onDeleteLabel={handleDeleteLabel}
                    />
                  }
                />

                <SmartPopover
                  isOpen={activePopover === 'members'}
                  onClose={() => setActivePopover(null)}
                  trigger={
                    <button 
                      onClick={() => setActivePopover(activePopover === 'members' ? null : 'members')}
                      className="flex items-center justify-center gap-2 min-w-[125px] px-3 py-2.5 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-[#6C5DD3] transition-all shadow-sm"
                    >
                      <Users size={16} /> Miembros
                    </button>
                  }
                  content={
                    <MembersPopover 
                      onClose={() => setActivePopover(null)}
                      boardMembers={boardMembers}
                      assignedMemberIds={assignedMemberIds}
                      onToggleMember={handleToggleMember}
                    />
                  }
                />

                <SmartPopover
                  isOpen={activePopover === 'dates'}
                  onClose={() => setActivePopover(null)}
                  trigger={
                    <button 
                      onClick={() => setActivePopover(activePopover === 'dates' ? null : 'dates')}
                      className="flex items-center justify-center gap-2 min-w-[125px] px-3 py-2.5 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-[#6C5DD3] transition-all shadow-sm"
                    >
                      <Clock size={16} /> Fechas
                    </button>
                  }
                  content={
                    <DatesPopover 
                      onClose={() => setActivePopover(null)}
                      onSaveDates={handleUpdateDates}
                      onRemoveDates={handleRemoveDates}
                      startDate={card?.startDate || null}
                      dueDate={card?.dueDate || null}
                    />
                  }
                />
                
                <button 
                  onClick={() => handleAddChecklist()}
                  className="flex items-center justify-center gap-2 min-w-[125px] px-3 py-2.5 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-[#6C5DD3] transition-all shadow-sm"
                >
                  <CheckSquare size={16} /> Checklist
                </button>
              </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100">
                  <AlignLeft size={18} className="text-[#6C5DD3]" />
                  <h3 className="text-[15px] font-bold tracking-tight">Descripción</h3>
                </div>
                
                {!isEditingDescription ? (
                  card?.description ? (
                    <div 
                      onClick={() => !isReadOnly && setIsEditingDescription(true)}
                      className={`w-full ${!isReadOnly ? 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5' : ''} group relative rounded p-2 -ml-2 transition-colors`}
                    >
                      {!isReadOnly && <Edit2 size={16} className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-zinc-400 transition-opacity" />}
                      <div 
                        className="prose prose-sm prose-zinc dark:prose-invert max-w-none" 
                        dangerouslySetInnerHTML={{ __html: sanitizeHtmlForRender(fixEncoding(card.description)) }} 
                      />
                    </div>
                  ) : (
                    !isReadOnly ? (
                      <div 
                        onClick={() => setIsEditingDescription(true)}
                        className="w-full bg-zinc-50 dark:bg-[#13151A] hover:bg-zinc-100 dark:hover:bg-[#252831] rounded p-4 cursor-pointer transition-colors border border-dashed border-zinc-200 dark:border-white/10"
                      >
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Añadir una descripción más detallada...</p>
                      </div>
                    ) : null
                  )
                ) : (
                  <div className="space-y-3">
                    <RichTextEditor 
                      ref={editorRef}
                      initialContent={card?.description || ''}
                      onSave={async (html) => {
                        await handleUpdateDescription(html);
                        setIsEditingDescription(false);
                      }}
                      onUploadSuccess={() => fetchCardDetails()}
                      cardId={cardId || undefined}
                      autoFocus={true}
                      alwaysEditing={true}
                      hideFooter={true}
                    />
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={async () => {
                          if (editorRef.current) {
                            const html = editorRef.current.getHTML();
                            await handleUpdateDescription(html);
                            setIsEditingDescription(false);
                          }
                        }}
                        className="bg-[#6C5DD3] text-white px-4 py-2 rounded text-sm font-bold shadow-sm hover:bg-[#312e81] transition-colors"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setIsEditingDescription(false)}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 px-3 py-2 rounded text-sm font-bold transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
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
                  isReadOnly={isReadOnly}
                />
              ))}

              <div ref={checklistsEndRef} />

              <AttachmentsSection 
                attachments={card?.attachments || []} 
                onDelete={handleFileDelete}
                isReadOnly={isReadOnly}
              />
            </div>

            {/* RIGHT COLUMN: Activity & Comments */}
            <div className="space-y-8">
              {/* Activity Component */}
              <ActivitySection 
                activities={activities} 
                onAddComment={handleAddComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                isLoading={isSaving}
                hasMore={hasMoreActivities}
                onLoadMore={handleLoadMoreActivities}
                isFetchingMore={isFetchingMoreActivity}
                cardId={cardId || ''}
                isReadOnly={isReadOnly}
                canModerate={canModerate}
                currentUserId={user?.id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default CardDetailModal;
