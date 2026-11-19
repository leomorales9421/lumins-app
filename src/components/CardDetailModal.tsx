import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

import { 
  X, 
  MoreHorizontal, 
  Paperclip, 
  Tag, 
  Calendar,
  Clock, 
  CheckSquare, 
  AlignLeft, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  Zap,
  Edit2,
  Plus,
  Copy,
  ChevronRight,
  SlidersHorizontal
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
import { formatTime12h } from '../lib/calendar-utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Checklist, ChecklistItem } from '../types/board';
import ActivitySection from './ActivitySection';
import type { ActivityItem } from '../types/activity';
import AttachmentsSection from './AttachmentsSection';
import AttachmentPopover from './AttachmentPopover';
import PropertiesPopover from './PropertiesPopover';
import CardOptionsMenu from './CardOptionsMenu';
import MoveCardPopover from './MoveCardPopover';
import DuplicateCardPopover from './DuplicateCardPopover';
import Popover from './ui/Popover';
import SmartPopover from './SmartPopover';
import UserAvatar from './ui/UserAvatar';
import CardModalSkeleton from './ui/CardModalSkeleton';
import { useBoardPermissions } from '../hooks/useBoardPermissions';
import { useAuth } from '../contexts/AuthContext';
import { compressAttachment } from '../lib/image-utils';
import ConfirmActionModal from './ConfirmActionModal';
import GoogleMeetScheduleModal, { type CardMeetingData } from './GoogleMeetScheduleModal';
import GoogleDrivePickerModal from './GoogleDrivePickerModal';
import { GoogleMeetIcon } from './ui/GoogleIcons';


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
  position?: number;
  description?: string;
  attachments?: Attachment[];
  labels?: { id: string; name: string; color: string }[];
  assignees?: Member[];
  startDate?: string;
  dueDate?: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3' | null;
  riskLevel?: 'low' | 'med' | 'high' | null;
  module?: string | null;
  createdAt?: string;
  isDone?: boolean;
  isDueDateDone?: boolean;
  status?: string;
  meetingData?: CardMeetingData | null;
}

// ActivityItem interface is now imported from ../types/activity

interface CardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId?: string | null;
  boardId?: string;
  onUpdate?: () => void;
  userRole?: string;
  boardLabels?: { id: string; name: string; color: string }[];
  boardMembers?: Member[];
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
  userRole,
  boardLabels: propBoardLabels,
  boardMembers: propBoardMembers,
  initialData 
}) => {
  const { user } = useAuth();
  const { canModerate, isReadOnly } = useBoardPermissions(boardId, userRole);
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
  const [isTitleExpandedMobile, setIsTitleExpandedMobile] = useState(false);
  const [isEditingTitleMobile, setIsEditingTitleMobile] = useState(false);
  const titleTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const mobileTitleTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const isTitleLong = (editTitle?.length || 0) > 45 || Boolean(editTitle?.includes('\n'));

  const adjustTitleHeight = (el?: HTMLTextAreaElement | null) => {
    const target = el || titleTextareaRef.current;
    if (target) {
      target.style.height = '0px';
      const nextHeight = Math.max(target.scrollHeight, 38);
      target.style.height = `${nextHeight}px`;
    }
  };

  const adjustMobileTitleHeight = (el?: HTMLTextAreaElement | null) => {
    const target = el || mobileTitleTextareaRef.current;
    if (target) {
      target.style.height = '0px';
      const nextHeight = Math.max(target.scrollHeight, 38);
      target.style.height = `${nextHeight}px`;
    }
  };

  useEffect(() => {
    adjustTitleHeight();
  }, [editTitle, card?.title, isLoading]);

  useEffect(() => {
    if (isEditingTitleMobile) {
      const timer = setTimeout(() => adjustMobileTitleHeight(), 10);
      return () => clearTimeout(timer);
    }
  }, [isEditingTitleMobile, editTitle]);

  const [editDescription, setEditDescription] = useState('');
  const [activePopover, setActivePopover] = useState<'add' | 'labels' | 'members' | 'dates' | 'attachments' | 'properties' | 'options' | 'move' | 'duplicate' | 'members_header' | 'dates_badge' | 'attachments_main' | 'labels_main' | 'members_main' | 'dates_main' | 'properties_main' | 'mobile_duplicate' | 'mobile_members' | 'mobile_properties' | 'mobile_dates' | 'mobile_labels' | 'mobile_move' | 'mobile_attachments' | 'mobile_options' | null>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<RichTextEditorRef>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [boardLabels, setBoardLabels] = useState<{ id: string; name: string; color: string }[]>(propBoardLabels || []);
  const [boardMembers, setBoardMembers] = useState<Member[]>(propBoardMembers || []);
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const checklistsEndRef = React.useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isMeetModalOpen, setIsMeetModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isUpdatingMeetStatus, setIsUpdatingMeetStatus] = useState(false);
  const [meetNow, setMeetNow] = useState(() => Date.now());
  const [showMobileProperties, setShowMobileProperties] = useState(false);
  const currentCardIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    setShowMobileProperties(false);
    setMeetNow(Date.now());
  }, [isOpen, cardId]);

  useEffect(() => {
    if (!isOpen || !card?.meetingData?.meetUrl) return;
    setMeetNow(Date.now());
    const interval = window.setInterval(() => setMeetNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, [isOpen, card?.meetingData?.meetUrl]);

  const handleUpdateMeetStatus = async (status: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW') => {
    if (!card?.id || isUpdatingMeetStatus) return;
    setIsUpdatingMeetStatus(true);
    try {
      const res = await apiClient.patch<{ data?: { meetingData?: CardMeetingData } }>(
        `/api/integrations/google-meet/cards/${card.id}/status`,
        { status }
      );
      const updatedMeet = res.data?.meetingData;
      if (updatedMeet) {
        setCard((prev) => (prev ? { ...prev, meetingData: updatedMeet } : prev));
      }
      await fetchCardDetails(true);
      toast.success(
        status === 'COMPLETED'
          ? 'Reunión marcada como realizada'
          : status === 'NO_SHOW'
          ? 'Reunión marcada como no realizada'
          : 'Reunión marcada como programada'
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo actualizar el estado de la reunión');
    } finally {
      setIsUpdatingMeetStatus(false);
    }
  };
  const initialDataRef = React.useRef(initialData);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  // Sync board data from props if provided, or fetch only if missing
  useEffect(() => {
    if (propBoardLabels && propBoardLabels.length > 0) {
      setBoardLabels(propBoardLabels);
    }
    if (propBoardMembers && propBoardMembers.length > 0) {
      setBoardMembers(propBoardMembers);
    }
  }, [propBoardLabels, propBoardMembers]);

  // Fetch board labels & members only if not provided by parent
  useEffect(() => {
    if (!isOpen || !boardId) return;
    if (propBoardLabels && propBoardLabels.length > 0 && propBoardMembers && propBoardMembers.length > 0) {
      return; // Already provided by board parent, skip network calls
    }

    const fetchBoardData = async () => {
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
        
        setBoardMembers(mappedMembers);
      } catch (err) {
        console.error('Error fetching board data:', err);
      }
    };

    fetchBoardData();
  }, [isOpen, boardId, propBoardLabels, propBoardMembers]);

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
        listName: cardData.list?.name || initialDataRef.current?.listName || 'Lista',
        listId: cardData.listId,
        position: cardData.position,
        description: cardData.description || '',
        attachments: cardData.attachments || [],
        labels: normalizedLabels,
        priority: cardData.priority,
        riskLevel: cardData.riskLevel,
        module: cardData.module,
        createdAt: cardData.createdAt,
        isDone: cardData.isDone,
        meetingData: cardData.meetingData || null,
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

    } catch (err: any) {
      console.error('Error fetching card details:', err);
      if (err?.response?.status === 403 || err?.response?.status === 404) {
        toast.error('Acceso denegado', { description: 'No tienes acceso a esta tarjeta o ha sido eliminada.' });
        onClose();
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cardId]);

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
    if (!isOpen || !cardId) {
      currentCardIdRef.current = null;
      setCard(null);
      setEditTitle('');
      setEditDescription('');
      setSelectedLabelIds([]);
      setAssignedMemberIds([]);
      setChecklists([]);
      setActivities([]);
      setActivityPage(1);
      setHasMoreActivities(false);
      setIsEditingDescription(false);
      setIsArchiveConfirmOpen(false);
      setIsTitleExpandedMobile(false);
      setIsEditingTitleMobile(false);
      return;
    }

    // Only do full reset & skeleton load when opening a new or different card
    if (currentCardIdRef.current !== cardId) {
      currentCardIdRef.current = cardId;
      setCard(null);
      setEditTitle(initialDataRef.current?.title && initialDataRef.current.title !== 'Cargando...' ? initialDataRef.current.title : '');
      setEditDescription('');
      setSelectedLabelIds([]);
      setAssignedMemberIds([]);
      setChecklists([]);
      setActivities([]);
      setActivityPage(1);
      setHasMoreActivities(false);
      setIsEditingDescription(false);
      setIsArchiveConfirmOpen(false);
      setIsTitleExpandedMobile(false);
      setIsEditingTitleMobile(false);

      fetchCardDetails(false);
      fetchChecklists();
    }
  }, [isOpen, cardId, fetchCardDetails, fetchChecklists]);

  // Listen for real-time updates (card-specific)
  useEffect(() => {
    const handleCardUpdate = (e: any) => {
      const { cardId: updatedCardId } = e.detail;
      if (updatedCardId === cardId && isOpen) {
        console.log('CardDetailModal: Real-time update received');
        fetchCardDetails(true); // silent refresh in background
        fetchChecklists();
      }
    };

    window.addEventListener('lumins:card-updated', handleCardUpdate);
    
    return () => {
      window.removeEventListener('lumins:card-updated', handleCardUpdate);
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
    const previousTitle = card?.title;
    
    // Optimistic UI update (0ms latency)
    if (card) setCard({ ...card, title: editTitle });
    
    try {
      await apiClient.patch(`/api/cards/${cardId}`, { title: editTitle });
      if (onUpdate) onUpdate();
      window.dispatchEvent(new CustomEvent('lumins:card-updated', { detail: { cardId, boardId } }));
    } catch (err) {
      console.error('Error updating title:', err);
      if (card && previousTitle) {
        setCard({ ...card, title: previousTitle });
        setEditTitle(previousTitle);
      }
    }
  };

  const handleUpdateDescription = async (newContent?: string) => {
    const descriptionToSave = newContent !== undefined ? newContent : editDescription;
    if (!cardId || (card && descriptionToSave === card.description)) return;
    
    // Optimistic UI update (0ms latency)
    if (card) {
      setCard({ ...card, description: descriptionToSave });
    }
    setEditDescription(descriptionToSave);

    try {
      await apiClient.patch(`/api/cards/${cardId}`, { description: descriptionToSave });
      if (onUpdate) onUpdate();
      window.dispatchEvent(new CustomEvent('lumins:card-updated', { detail: { cardId, boardId } }));
    } catch (err) {
      console.error('Error updating description:', err);
      if (card) setEditDescription(card.description || '');
    }
  };

  const handleAddComment = async (text: string) => {
    if (!cardId || !text.trim()) return;
    
    try {
      await apiClient.post(`/api/cards/${cardId}/comments`, { content: text });
      fetchCardDetails(true); // Refresh silently to show new comment
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleUpdateComment = async (commentId: string, text: string) => {
    if (!text.trim()) return;
    
    try {
      await apiClient.put(`/api/comments/${commentId}`, { content: text });
      fetchCardDetails(true); // Refresh silently to show updated comment
    } catch (err) {
      console.error('Error updating comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiClient.delete(`/api/comments/${commentId}`);
      fetchCardDetails(true); // Refresh silently to remove deleted comment
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleToggleLabel = async (labelId: string) => {
    if (!cardId) return;
    
    const isSelected = selectedLabelIds.includes(labelId);
    
    // Optimistic update
    setSelectedLabelIds(prev => isSelected ? prev.filter(id => id !== labelId) : [...prev, labelId]);

    try {
      if (isSelected) {
        await apiClient.delete(`/api/cards/${cardId}/labels/${labelId}`);
      } else {
        await apiClient.post(`/api/cards/${cardId}/labels`, { labelId });
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error toggling label:', err);
      setSelectedLabelIds(prev => isSelected ? [...prev, labelId] : prev.filter(id => id !== labelId));
    }
  };

  const handleCreateLabel = async (name: string, color: string) => {
    if (!boardId) return;
    try {
      const res = await apiClient.post<{ data: { label: any } }>(`/api/boards/${boardId}/labels`, { name, color });
      if (res.data?.label) {
        setBoardLabels(prev => [...prev, res.data.label]);
      }
    } catch (err) {
      console.error('Error creating label:', err);
    }
  };

  const handleEditLabel = async (labelId: string, name: string, color: string) => {
    if (!boardId) return;
    setBoardLabels(prev => prev.map(l => l.id === labelId ? { ...l, name, color } : l));
    try {
      await apiClient.patch(`/api/boards/${boardId}/labels/${labelId}`, { name, color });
      fetchCardDetails(true);
    } catch (err) {
      console.error('Error editing label:', err);
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!boardId) return;
    setBoardLabels(prev => prev.filter(l => l.id !== labelId));
    setSelectedLabelIds(prev => prev.filter(id => id !== labelId));
    try {
      await apiClient.delete(`/api/boards/${boardId}/labels/${labelId}`);
      fetchCardDetails(true);
    } catch (err) {
      console.error('Error deleting label:', err);
    }
  };

  const handleToggleMember = async (userId: string) => {
    if (!cardId) return;
    
    const isAssigned = assignedMemberIds.includes(userId);
    setAssignedMemberIds(prev => isAssigned ? prev.filter(id => id !== userId) : [...prev, userId]);

    try {
      if (isAssigned) {
        await apiClient.delete(`/api/cards/${cardId}/assignees/${userId}`);
      } else {
        await apiClient.post(`/api/cards/${cardId}/assignees`, { userId });
      }
      if (onUpdate) onUpdate();
      window.dispatchEvent(new CustomEvent('lumins:card-updated', { detail: { cardId, boardId, userId } }));
    } catch (err) {
      console.error('Error toggling member:', err);
      setAssignedMemberIds(prev => isAssigned ? [...prev, userId] : prev.filter(id => id !== userId));
    }
  };

  const handleAddChecklist = async (title: string = 'Checklist') => {
    if (!cardId) return;
    const tempId = 'temp-' + Date.now();
    const newChecklist = { id: tempId, title, items: [] };
    setChecklists(prev => [...prev, newChecklist]);
    
    try {
      const res = await apiClient.post<{ data: { checklist: any } }>(`/api/cards/${cardId}/checklists`, { title });
      if (res.data?.checklist?.id) {
        setChecklists(prev => prev.map(cl => cl.id === tempId ? res.data.checklist : cl));
      }
    } catch (err) {
      console.error('Error creating checklist:', err);
      setChecklists(prev => prev.filter(cl => cl.id !== tempId));
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    const previous = checklists;
    setChecklists(prev => prev.filter(cl => cl.id !== id));
    try {
      await apiClient.delete(`/api/checklists/${id}`);
    } catch (err) {
      console.error('Error deleting checklist:', err);
      setChecklists(previous);
    }
  };

  const handleUpdateChecklistTitle = async (checklistId: string, title: string) => {
    if (!title.trim()) return;
    setChecklists(prev => prev.map(cl => cl.id === checklistId ? { ...cl, title } : cl));

    try {
      await apiClient.patch(`/api/checklists/${checklistId}`, { title });
    } catch (err) {
      console.error('Error updating checklist title:', err);
    }
  };

  const handleAddChecklistItem = async (checklistId: string, title: string) => {
    const tempItemId = 'temp-item-' + Date.now();
    const tempItem: ChecklistItem = { id: tempItemId, title, done: false, position: Date.now() };
    
    // Instant 0ms optimistic append
    setChecklists(prev => prev.map(cl => {
      if (cl.id !== checklistId) return cl;
      return { ...cl, items: [...cl.items, tempItem] };
    }));

    try {
      const res = await apiClient.post<{ data: { item: any } }>(`/api/checklists/${checklistId}/items`, { title });
      if (res.data?.item?.id) {
        setChecklists(prev => prev.map(cl => {
          if (cl.id !== checklistId) return cl;
          return {
            ...cl,
            items: cl.items.map(it => it.id === tempItemId ? res.data.item : it)
          };
        }));
      }
    } catch (err) {
      console.error('Error adding checklist item:', err);
      setChecklists(prev => prev.map(cl => {
        if (cl.id !== checklistId) return cl;
        return { ...cl, items: cl.items.filter(it => it.id !== tempItemId) };
      }));
    }
  };

  const handleToggleChecklistItem = async (itemId: string, done: boolean) => {
    // Instant 0ms optimistic checkbox toggle
    setChecklists(prev => prev.map(cl => ({
      ...cl,
      items: cl.items.map(item => item.id === itemId ? { ...item, done } : item)
    })));

    try {
      await apiClient.patch(`/api/checklist-items/${itemId}`, { done });
    } catch (err) {
      console.error('Error toggling checklist item:', err);
      setChecklists(prev => prev.map(cl => ({
        ...cl,
        items: cl.items.map(item => item.id === itemId ? { ...item, done: !done } : item)
      })));
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    const previous = checklists;
    setChecklists(prev => prev.map(cl => ({
      ...cl,
      items: cl.items.filter(item => item.id !== itemId)
    })));

    try {
      await apiClient.delete(`/api/checklist-items/${itemId}`);
    } catch (err) {
      console.error('Error deleting checklist item:', err);
      setChecklists(previous);
    }
  };

  const handleUpdateChecklistItemTitle = async (itemId: string, title: string) => {
    if (!title.trim()) return;
    setChecklists(prev => prev.map(cl => ({
      ...cl,
      items: cl.items.map(item => item.id === itemId ? { ...item, title } : item)
    })));

    try {
      await apiClient.patch(`/api/checklist-items/${itemId}`, { title });
    } catch (err) {
      console.error('Error updating checklist item title:', err);
    }
  };

  const handleUpdateDates = async (dates: { startDate: string | null, dueDate: string | null }) => {
    if (!cardId || isReadOnly) return;
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
      window.dispatchEvent(new CustomEvent('lumins:card-updated', { detail: { cardId, boardId } }));

      // If card has an upcoming Google Meet and a new future date was set, offer to move the meeting too
      const targetNewDateStr = dates.dueDate || dates.startDate;
      const activeMeet = card?.meetingData;
      if (activeMeet?.meetUrl && targetNewDateStr) {
        const meetStart = new Date(activeMeet.scheduledStart);
        const newTarget = new Date(targetNewDateStr);
        if (
          !isNaN(meetStart.getTime()) &&
          !isNaN(newTarget.getTime()) &&
          meetStart.getTime() > Date.now()
        ) {
          const movedStart = new Date(
            newTarget.getFullYear(),
            newTarget.getMonth(),
            newTarget.getDate(),
            meetStart.getHours(),
            meetStart.getMinutes(),
            0,
            0
          );
          const isSameDay =
            movedStart.getFullYear() === meetStart.getFullYear() &&
            movedStart.getMonth() === meetStart.getMonth() &&
            movedStart.getDate() === meetStart.getDate();

          if (!isSameDay && movedStart.getTime() > Date.now()) {
            const newLabel = format(movedStart, "d 'de' MMM", { locale: es });
            toast('Esta tarjeta tiene un Google Meet agendado', {
              description: `¿Deseas mover también la reunión al ${newLabel}?`,
              duration: 9000,
              action: {
                label: 'Mover reunión',
                onClick: async () => {
                  try {
                    const res: any = await apiClient.post(
                      `/api/integrations/google-meet/cards/${cardId}/schedule`,
                      {
                        scheduledStart: movedStart.toISOString(),
                        durationMinutes: activeMeet.durationMinutes || 45,
                        inviteAssignees: activeMeet.inviteAssignees,
                        invitedAssigneeIds: activeMeet.invitedAssigneeIds || [],
                        externalGuests: activeMeet.externalGuests || [],
                        hideInternalDetails: activeMeet.hideInternalDetails,
                        agendaNote: activeMeet.agendaNote || '',
                      }
                    );
                    const updatedMeet = res?.meetingData || res?.data?.meetingData;
                    if (updatedMeet) {
                      setCard(prev => (prev ? { ...prev, meetingData: updatedMeet } : null));
                    }
                    toast.success(`Reunión movida al ${newLabel}`);
                  } catch (moveErr: any) {
                    toast.error(moveErr?.message || 'No se pudo mover la reunión');
                  }
                },
              },
            });
          }
        }
      }
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
    setIsArchiveConfirmOpen(true);
  };

  const confirmArchiveCard = async () => {
    if (!cardId) return;
    setIsSaving(true);
    try {
      // According to schema, status 'closed' is used for archiving
      await apiClient.patch(`/api/cards/${cardId}`, { status: 'closed' });
      if (onUpdate) onUpdate();
      setIsArchiveConfirmOpen(false);
      onClose(); // Close modal after archiving
    } catch (err) {
      console.error('Error archiving card:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreCard = async () => {
    if (!cardId) return;
    setIsSaving(true);
    try {
      await apiClient.patch(`/api/cards/${cardId}`, { status: 'open' });
      toast.success('Tarjeta restaurada con éxito');
      if (onUpdate) onUpdate();
      setCard((prev: any) => prev ? { ...prev, status: 'open' } : null);
      setActivePopover(null);
    } catch (err) {
      console.error('Error restoring card:', err);
      toast.error('Error al restaurar la tarjeta');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateCard = async (payload: {
    destinationBoardId: string;
    destinationListId: string;
    newPosition: number;
    copyOptions: {
      copyAssignees: boolean;
      copyLabels: boolean;
      copyChecklists: boolean;
      copyDates: boolean;
      copyStatusFlags: boolean;
    };
  }) => {
    if (!cardId) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/api/cards/${cardId}/duplicate`, payload);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error duplicating card:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateProperties = async (properties: { priority?: string | null; riskLevel?: string | null; module?: string | null }) => {
    if (!cardId || isReadOnly) return;
    
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
      window.dispatchEvent(new CustomEvent('lumins:card-updated', { detail: { cardId, boardId } }));
    } catch (err) {
      console.error('Error updating properties:', err);
      // Rollback on error
      fetchCardDetails(true);
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
      window.dispatchEvent(new CustomEvent('lumins:card-updated', { detail: { cardId, boardId } }));
    } catch (err) {
      console.error('Error toggling done state:', err);
      // Rollback
      setCard({ ...card, isDone: card.isDone });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !cardId) return;

    // Validación inteligente de peso y tipo
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(file.name);
    const MAX_VIDEO_MB = 20;
    const MAX_GENERAL_MB = 25;

    if (isVideo && file.size > MAX_VIDEO_MB * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(`Video demasiado pesado (${fileSizeMB} MB)`, {
        description: `Los videos para subida directa tienen un límite de ${MAX_VIDEO_MB} MB. Para videos más pesados, te recomendamos subirlo a tu Google Drive, YouTube o Dropbox y adjuntar el enlace aquí.`,
        duration: 9000,
      });
      setActivePopover('attachments_main');
      return;
    }

    if (!isVideo && file.size > MAX_GENERAL_MB * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(`Archivo demasiado grande (${fileSizeMB} MB)`, {
        description: `El tamaño máximo permitido para subida directa es de ${MAX_GENERAL_MB} MB. Te sugerimos subirlo a Google Drive y adjuntar el enlace compartido.`,
        duration: 8000,
      });
      setActivePopover('attachments_main');
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
      toast.success('Archivo adjuntado con éxito');
    } catch (err: any) {
      console.error('Error uploading file:', err);
      let errorDesc = 'Hubo un problema al procesar tu archivo. Por favor, inténtalo de nuevo.';
      
      if (err.response?.data?.message) {
        errorDesc = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorDesc = 'La subida tardó demasiado tiempo en completarse. Comprueba la velocidad de tu conexión a internet.';
      } else if (err.message === 'Network Error' || !err.response) {
        errorDesc = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else if (err.response?.status === 413) {
        errorDesc = 'El archivo supera el tamaño máximo permitido por el servidor.';
      } else if (err.response?.status === 403) {
        errorDesc = 'No tienes permisos para adjuntar archivos en esta tarjeta.';
      } else if (err.response?.status === 401) {
        errorDesc = 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
      }

      toast.error('Error al subir el archivo', {
        description: errorDesc,
        duration: 7000,
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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay hint */}
      {isDragging && (
        <div className="absolute inset-0 z-[110] bg-[var(--lumins-accent)]/15 backdrop-blur-sm flex items-center justify-center pointer-events-none border-4 border-dashed border-[var(--lumins-accent)] rounded-2xl m-4">
          <div className="bg-white dark:bg-[#1C1F26] p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 animate-bounce border border-zinc-200 dark:border-white/10">
            <Paperclip size={40} className="text-[var(--lumins-accent-fg)]" />
            <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">Suelta para adjuntar</p>
          </div>
        </div>
      )}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[#13151A]/60 backdrop-blur-sm transition-opacity ${
          isMeetModalOpen || isDriveModalOpen ? 'hidden' : ''
        }`}
        onClick={onClose}
      />

      {/* Modal Container: Native Bottom Sheet on Mobile, Centered Modal on Desktop */}
      <motion.div
        layout
        layoutRoot
        className={`relative w-full sm:max-w-4xl h-[92vh] sm:h-auto sm:max-h-[86vh] bg-white dark:bg-[#1C1F26] rounded-t-[28px] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 sm:animate-in sm:fade-in sm:zoom-in sm:duration-200 border-t sm:border border-zinc-200 dark:border-white/10 ${
          isMeetModalOpen || isDriveModalOpen ? 'hidden' : ''
        }`}
      >
        
        {/* Mobile Pull/Drag Indicator Pill */}
        <div 
          className="sm:hidden w-full flex flex-col items-center pt-2.5 pb-1 bg-white dark:bg-[#1C1F26] cursor-pointer touch-none select-none flex-shrink-0"
          onClick={onClose}
        >
          <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 active:scale-95 transition-transform" />
        </div>

        {/* Mobile App Bar / Header (sm:hidden) */}
        <div className="sm:hidden border-b border-zinc-100 dark:border-white/5 px-4 py-2 flex items-center justify-between flex-shrink-0 bg-white dark:bg-[#1C1F26]">
          {/* Close button on the left - clean native style */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/20 active:scale-95 transition-all shadow-xs flex-shrink-0"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>

          {/* List pill selector in the center */}
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'mobile_move' ? null : 'mobile_move')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 rounded-full font-semibold text-[11px] hover:bg-zinc-200 dark:hover:bg-white/10 active:scale-95 transition-all border border-zinc-200/60 dark:border-white/10 max-w-[170px]"
          >
            <span className="text-zinc-400 font-normal">En:</span>
            <span className="text-[var(--lumins-accent-fg)] font-bold truncate">{displayListName}</span>
            <ChevronDown size={13} className="text-zinc-400 flex-shrink-0" />
          </button>

          {/* Right actions: attachments + options menu */}
          <div className="flex items-center gap-1">
            {(isSaving || isRefreshing) && (
              <div className="p-1 text-[var(--lumins-accent-fg)] animate-spin">
                <Loader2 size={16} />
              </div>
            )}
            {!isReadOnly && (
              <button 
                type="button"
                onClick={() => setActivePopover(activePopover === 'mobile_attachments' ? null : 'mobile_attachments')}
                className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                  activePopover === 'mobile_attachments' 
                    ? 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)]' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10'
                }`}
              >
                <Paperclip size={18} />
              </button>
            )}
            <button 
              type="button"
              onClick={() => setActivePopover(activePopover === 'mobile_options' ? null : 'mobile_options')}
              className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                activePopover === 'mobile_options' 
                  ? 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)]' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10'
              }`}
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Desktop Header (hidden sm:flex) */}
        <div className="hidden sm:flex border-b border-zinc-200/80 dark:border-white/5 px-5 py-2.5 items-center justify-between flex-shrink-0 bg-white dark:bg-[#1C1F26]">
          <div className="flex items-center gap-2">
            <SmartPopover
              isOpen={activePopover === 'move'}
              onClose={() => setActivePopover(null)}
              placement="bottom-start"
              trigger={
                <button
                  onClick={() => setActivePopover(activePopover === 'move' ? null : 'move')}
                  className="flex items-center gap-1.5 h-8 px-2.5 bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 rounded-lg font-semibold text-xs hover:bg-zinc-200/80 dark:hover:bg-white/10 hover:text-[var(--lumins-accent-fg)] transition-colors border border-zinc-200/80 dark:border-white/10 cursor-pointer"
                >
                  En lista: <span className="text-[var(--lumins-accent-fg)] font-bold">{displayListName}</span>
                  <ChevronDown size={14} />
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
                      fetchCardDetails(true); // Just refresh silently if same board
                    }
                  }}
                />
              }
            />
            <SmartPopover
              isOpen={activePopover === 'duplicate'}
              onClose={() => setActivePopover(null)}
              placement="bottom-start"
              trigger={
                <button
                  onClick={() => setActivePopover(activePopover === 'duplicate' ? null : 'duplicate')}
                  className="flex items-center gap-1.5 h-8 px-2.5 bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 rounded-lg font-semibold text-xs hover:bg-zinc-200/80 dark:hover:bg-white/10 hover:text-[var(--lumins-accent-fg)] transition-colors border border-zinc-200/80 dark:border-white/10 cursor-pointer"
                >
                  <Copy size={14} />
                  Duplicar
                </button>
              }
              content={
                <DuplicateCardPopover
                  currentBoardId={boardId || ''}
                  currentListId={card?.listId || ''}
                  currentCardPosition={card?.position}
                  onDuplicate={handleDuplicateCard}
                  onClose={() => setActivePopover(null)}
                  onDuplicateSuccess={(duplicatedToAnotherBoard) => {
                    if (onUpdate) onUpdate();
                    if (duplicatedToAnotherBoard) {
                      onClose();
                    } else {
                      fetchCardDetails(true);
                    }
                  }}
                />
              }
            />
            <button
              onClick={handleToggleDone}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg font-bold text-xs transition-all border cursor-pointer ${
                card?.isDone 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                  : 'bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-white/10 hover:bg-zinc-200/80 dark:hover:bg-white/10 hover:text-[var(--lumins-accent-fg)]'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${
                card?.isDone ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-400 dark:border-zinc-500'
              }`}>
                {card?.isDone && <CheckSquare size={9} className="text-white" />}
              </div>
              {card?.isDone ? 'Listo' : 'Marcar como listo'}
            </button>
            {(isSaving || isRefreshing) && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--lumins-accent-soft)] border border-[var(--lumins-accent-border)] text-[var(--lumins-accent-fg)] rounded-lg text-[11px] font-bold animate-in fade-in zoom-in duration-300">
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
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${activePopover === 'attachments' ? 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)]' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                  >
                    <Paperclip size={18} />
                  </button>
                }
                content={
                  <AttachmentPopover 
                    onClose={() => setActivePopover(null)}
                    onUploadFile={handleFileUpload}
                    onAttachLink={handleAttachLink}
                    onOpenGoogleDrive={() => setIsDriveModalOpen(true)}
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
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${activePopover === 'options' ? 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)]' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                >
                  <MoreHorizontal size={18} />
                </button>
              }
              content={
                <CardOptionsMenu 
                  cardId={cardId || ''}
                  assignedMemberIds={assignedMemberIds}
                  onToggleJoin={handleToggleMember}
                  onArchive={handleArchiveCard}
                  onRestore={handleRestoreCard}
                  status={card?.status}
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

        {/* Scrollable Content — cross-fade between skeleton and real content */}
        <AnimatePresence mode="wait" initial={false}>
        {isLoading || !card ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="flex-1 overflow-y-auto"
          >
            <CardModalSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-4 sm:p-5 pt-3 sm:pt-4 no-scrollbar sm:custom-scrollbar pb-24 sm:pb-5"
          >
            
            {/* Desktop Card Title (sm and above - untouched desktop experience) */}
            <div className="hidden sm:block mb-1.5 sm:mb-2 min-w-0 w-full max-w-full">
              <textarea 
                ref={titleTextareaRef}
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  adjustTitleHeight(e.target);
                }}
                onBlur={handleUpdateTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleUpdateTitle();
                    e.currentTarget.blur();
                  }
                }}
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  whiteSpace: 'pre-wrap',
                  minHeight: '34px',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}
                className="w-full max-w-full text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight outline-none focus:bg-zinc-100 dark:focus:bg-white/5 rounded-lg px-2 -ml-2 transition-colors border-none ring-0 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-transparent resize-none overflow-hidden leading-snug block break-all sm:break-words [word-break:break-word] [overflow-wrap:anywhere]"
                placeholder="Título de la tarjeta"
                disabled={isLoading || isReadOnly}
              />
            </div>

            {/* Mobile Card Title (< sm - responsive title with ellipsis & expand toggle) */}
            <div className="block sm:hidden mb-2.5 min-w-0 w-full">
              {!isEditingTitleMobile ? (
                <div>
                  <div 
                    onClick={() => {
                      if (isTitleLong) {
                        setIsTitleExpandedMobile(prev => !prev);
                      } else if (!isReadOnly) {
                        setIsEditingTitleMobile(true);
                      }
                    }}
                    className={`${isTitleLong || !isReadOnly ? 'cursor-pointer active:opacity-75' : ''} transition-opacity select-none`}
                  >
                    <h1 
                      className={`text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug break-words ${
                        !isTitleExpandedMobile && isTitleLong ? 'line-clamp-2' : ''
                      }`}
                    >
                      {editTitle || 'Sin título'}
                    </h1>
                  </div>

                  <div className="flex items-center justify-between mt-1 min-h-[22px]">
                    {isTitleLong ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTitleExpandedMobile(prev => !prev);
                        }}
                        className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 py-0.5 active:scale-95 transition-transform"
                      >
                        {isTitleExpandedMobile ? (
                          <>
                            <span>Mostrar menos</span>
                            <ChevronUp size={13} />
                          </>
                        ) : (
                          <>
                            <span>Ver título completo</span>
                            <ChevronDown size={13} />
                          </>
                        )}
                      </button>
                    ) : <div />}

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingTitleMobile(true);
                        }}
                        className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 py-0.5 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all ml-auto"
                      >
                        <Edit2 size={11} />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    ref={mobileTitleTextareaRef}
                    value={editTitle}
                    onChange={(e) => {
                      setEditTitle(e.target.value);
                      adjustMobileTitleHeight(e.target);
                    }}
                    onBlur={() => {
                      handleUpdateTitle();
                      setIsEditingTitleMobile(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleUpdateTitle();
                        setIsEditingTitleMobile(false);
                      }
                    }}
                    style={{
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-wrap',
                      minHeight: '44px',
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box'
                    }}
                    className="w-full max-w-full text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight outline-none focus:bg-zinc-100 dark:focus:bg-white/5 rounded-lg p-2 transition-colors border border-teal-500/50 ring-2 ring-teal-500/20 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-transparent resize-none leading-snug block break-words"
                    placeholder="Título de la tarjeta"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-1.5">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        handleUpdateTitle();
                        setIsEditingTitleMobile(false);
                      }}
                      className="text-xs font-semibold px-3 py-1 bg-teal-600 text-white rounded-md active:scale-95 shadow-sm"
                    >
                      Listo
                    </button>
                  </div>
                </div>
              )}
            </div>

          {card?.createdAt && (
            <div className="flex items-center gap-3 mb-4 text-[11px] text-zinc-400 dark:text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {new Date(card.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                {new Date(card.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* NATIVE MOBILE & TABLET COLLAPSIBLE PROPERTIES (md:hidden) */}
          <div className="md:hidden mb-5">
            <button
              type="button"
              onClick={() => setShowMobileProperties(prev => !prev)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-50/90 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] flex items-center justify-center shrink-0">
                  <SlidersHorizontal size={13} />
                </div>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 shrink-0">
                  Opciones
                </span>

                {/* Compact summary pills when collapsed */}
                {!showMobileProperties && (
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden ml-1">
                    {card?.priority && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        card.priority === 'P0' ? 'bg-[#FF665E]/[0.12] text-[#D94841] dark:text-[#FF857E]' :
                        card.priority === 'P1' ? 'bg-[#FFCC40]/[0.22] text-amber-900 dark:text-[#FFCC40]' :
                        card.priority === 'P2' ? 'bg-[#12A9A8]/[0.12] text-[#0E8786] dark:text-[#4ED4D2]' :
                        'bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-zinc-300'
                      }`}>
                        {card.priority}
                      </span>
                    )}
                    {assignedMemberIds.length > 0 && (
                      <div className="flex items-center -space-x-1 shrink-0">
                        {boardMembers
                          .filter(m => assignedMemberIds.includes(m.id))
                          .slice(0, 2)
                          .map(member => (
                            <div key={member.id} className="w-5 h-5 rounded-full border border-white dark:border-[#1C1F26] overflow-hidden">
                              <UserAvatar name={member.name} avatarUrl={member.avatarUrl} size="xs" />
                            </div>
                          ))}
                        {assignedMemberIds.length > 2 && (
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 pl-1.5">
                            +{assignedMemberIds.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    {card?.dueDate && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                        new Date(card.dueDate) < new Date() && !card.isDone
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                          : 'bg-zinc-200/70 dark:bg-white/10 text-zinc-600 dark:text-zinc-300'
                      }`}>
                        {format(parseISO(card.dueDate), 'd MMM', { locale: es })}
                      </span>
                    )}
                    {selectedLabelIds.length > 0 && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        {boardLabels
                          .filter(l => selectedLabelIds.includes(l.id))
                          .slice(0, 3)
                          .map(label => (
                            <span
                              key={label.id}
                              style={{ backgroundColor: label.color }}
                              className="w-2 h-2 rounded-full"
                            />
                          ))}
                      </div>
                    )}
                    {card?.meetingData?.meetUrl && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                        Meet
                      </span>
                    )}
                    {!card?.priority && assignedMemberIds.length === 0 && !card?.dueDate && selectedLabelIds.length === 0 && !card?.meetingData?.meetUrl && (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                        Responsables, fechas, Meet...
                      </span>
                    )}
                  </div>
                )}
              </div>

              <ChevronDown
                size={16}
                className={`text-zinc-400 shrink-0 transition-transform duration-200 ${showMobileProperties ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {showMobileProperties && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {/* Tile 1: Responsables */}
                    <button
                      type="button"
                      onClick={() => setActivePopover(activePopover === 'mobile_members' ? null : 'mobile_members')}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50/90 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 active:bg-zinc-100 dark:active:bg-white/10 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] flex items-center justify-center shrink-0">
                        <Users size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 leading-tight">Responsables</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                          {assignedMemberIds.length > 0
                            ? `${assignedMemberIds.length} ${assignedMemberIds.length === 1 ? 'asignado' : 'asignados'}`
                            : '+ Asignar'}
                        </p>
                      </div>
                    </button>

                    {/* Tile 2: Propiedades */}
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => !isReadOnly && setActivePopover(activePopover === 'mobile_properties' ? null : 'mobile_properties')}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50/90 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 transition-colors text-left ${!isReadOnly ? 'active:bg-zinc-100 dark:active:bg-white/10 cursor-pointer' : 'cursor-default opacity-85'}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Zap size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 leading-tight">Propiedades</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {card?.priority || card?.riskLevel
                            ? `${card?.priority || ''}${card?.priority && card?.riskLevel ? ' · ' : ''}${card?.riskLevel === 'high' ? 'Riesgo Alto' : card?.riskLevel === 'med' ? 'Riesgo Medio' : card?.riskLevel === 'low' ? 'Riesgo Bajo' : ''}`
                            : '+ Prioridad'}
                        </p>
                      </div>
                    </button>

                    {/* Tile 3: Fechas */}
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => !isReadOnly && setActivePopover(activePopover === 'mobile_dates' ? null : 'mobile_dates')}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50/90 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 transition-colors text-left ${!isReadOnly ? 'active:bg-zinc-100 dark:active:bg-white/10 cursor-pointer' : 'cursor-default opacity-85'}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <Clock size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 leading-tight">Fechas</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {card?.dueDate
                            ? `${format(parseISO(card.dueDate), 'd MMM', { locale: es })} · ${formatTime12h(parseISO(card.dueDate))}`
                            : card?.startDate
                              ? format(parseISO(card.startDate), 'd MMM', { locale: es })
                              : '+ Asignar'}
                        </p>
                      </div>
                    </button>

                    {/* Tile 4: Etiquetas */}
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => !isReadOnly && setActivePopover(activePopover === 'mobile_labels' ? null : 'mobile_labels')}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50/90 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 transition-colors text-left ${!isReadOnly ? 'active:bg-zinc-100 dark:active:bg-white/10 cursor-pointer' : 'cursor-default opacity-85'}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Tag size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 leading-tight">Etiquetas</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {selectedLabelIds.length > 0
                            ? `${selectedLabelIds.length} ${selectedLabelIds.length === 1 ? 'etiqueta' : 'etiquetas'}`
                            : '+ Añadir'}
                        </p>
                      </div>
                    </button>

                    {/* Tile 5: Checklist */}
                    <button
                      type="button"
                      onClick={() => handleAddChecklist()}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50/90 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 active:bg-zinc-100 dark:active:bg-white/10 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] flex items-center justify-center shrink-0">
                        <CheckSquare size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 leading-tight">Checklist</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {checklists.length > 0
                            ? `${checklists.reduce((acc, cl) => acc + (cl.items?.filter(i => i.done || (i as any).isCompleted)?.length || 0), 0)}/${checklists.reduce((acc, cl) => acc + (cl.items?.length || 0), 0)} listos`
                            : '+ Crear'}
                        </p>
                      </div>
                    </button>

                    {/* Tile 6: Google Meet */}
                    <button
                      type="button"
                      onClick={() => !isReadOnly && setIsMeetModalOpen(true)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50/90 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 active:bg-zinc-100 dark:active:bg-white/10 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <GoogleMeetIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 leading-tight">Google Meet</p>
                        <p className={`text-[10px] truncate mt-0.5 ${card?.meetingData?.meetUrl ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-zinc-400 dark:text-zinc-500'}`}>
                          {card?.meetingData?.meetUrl
                            ? format(parseISO(card.meetingData.scheduledStart), 'd MMM · HH:mm', { locale: es })
                            : '+ Agendar'}
                        </p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* NATIVE MOBILE ACTION SHEET (md:hidden) */}
          {activePopover && [
            'mobile_members', 
            'mobile_properties', 
            'mobile_dates', 
            'mobile_labels',
            'mobile_move',
            'mobile_attachments',
            'mobile_options'
          ].includes(activePopover) && (
            <div className="md:hidden fixed inset-0 z-[9999] flex items-end justify-center">
              {/* Dark Backdrop with blur */}
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                onClick={() => setActivePopover(null)}
              />
              
              {/* Bottom Sheet that slides up smoothly */}
              <div className="relative w-full bg-white dark:bg-[#1C1F26] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] overflow-hidden z-10 animate-in slide-in-from-bottom duration-300 border-t border-zinc-200/80 dark:border-white/10 flex flex-col max-h-[85vh]">
                {/* Pull Handle */}
                <div 
                  className="w-full flex items-center justify-center pt-3 pb-1 cursor-pointer select-none"
                  onClick={() => setActivePopover(null)}
                >
                  <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                </div>

                <div className="overflow-y-auto px-4 pb-8 pt-1 w-full custom-scrollbar">
                  {activePopover === 'mobile_members' && (
                    <MembersPopover 
                      className="w-full border-0 shadow-none rounded-none bg-transparent"
                      onClose={() => setActivePopover(null)}
                      boardMembers={boardMembers}
                      assignedMemberIds={assignedMemberIds}
                      onToggleMember={handleToggleMember}
                    />
                  )}
                  {activePopover === 'mobile_properties' && (
                    <PropertiesPopover 
                      className="w-full border-0 shadow-none rounded-none bg-transparent"
                      onClose={() => setActivePopover(null)}
                      onBack={() => setActivePopover(null)}
                      currentPriority={card?.priority}
                      currentRiskLevel={card?.riskLevel}
                      currentModule={card?.module}
                      onUpdate={handleUpdateProperties}
                    />
                  )}
                  {activePopover === 'mobile_dates' && (
                    <DatesPopover 
                      className="w-full border-0 shadow-none rounded-none bg-transparent"
                      onClose={() => setActivePopover(null)}
                      onSaveDates={handleUpdateDates}
                      onRemoveDates={handleRemoveDates}
                      startDate={card?.startDate || null}
                      dueDate={card?.dueDate || null}
                    />
                  )}
                  {activePopover === 'mobile_labels' && (
                    <LabelsPopover 
                      className="w-full border-0 shadow-none rounded-none bg-transparent"
                      onClose={() => setActivePopover(null)}
                      selectedLabelIds={selectedLabelIds}
                      labels={boardLabels}
                      onToggleLabel={handleToggleLabel}
                      onEditLabel={handleEditLabel}
                      onCreateLabel={handleCreateLabel}
                      onDeleteLabel={handleDeleteLabel}
                    />
                  )}
                  {activePopover === 'mobile_move' && (
                    <MoveCardPopover 
                      className="w-full border-0 shadow-none rounded-none bg-transparent"
                      cardId={cardId || ''}
                      currentBoardId={boardId || ''}
                      currentListId={card?.listId || ''}
                      onClose={() => setActivePopover(null)}
                      onMoveSuccess={(movedToAnotherBoard) => {
                        if (onUpdate) onUpdate();
                        if (movedToAnotherBoard) {
                          onClose();
                        } else {
                          fetchCardDetails(true);
                        }
                      }}
                    />
                  )}
                  {activePopover === 'mobile_attachments' && (
                    <AttachmentPopover 
                      className="w-full border-0 shadow-none rounded-none bg-transparent"
                      onClose={() => setActivePopover(null)}
                      onUploadFile={handleFileUpload}
                      onAttachLink={handleAttachLink}
                      onOpenGoogleDrive={() => setIsDriveModalOpen(true)}
                      isUploading={isUploading}
                    />
                  )}
                  {activePopover === 'mobile_options' && (
                    <CardOptionsMenu 
                      className="w-full border-0 shadow-none rounded-none bg-transparent"
                      cardId={cardId || ''}
                      assignedMemberIds={assignedMemberIds}
                      onToggleJoin={handleToggleMember}
                      onArchive={handleArchiveCard}
                      onRestore={handleRestoreCard}
                      status={card?.status}
                      onClose={() => setActivePopover(null)}
                      canModerate={canModerate}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Labels & Members Display (Phase 2 & 3) - Desktop Only (hidden md:flex) */}
          <div className="hidden md:flex flex-wrap items-center gap-5 mb-4">
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

            {assignedMemberIds.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="cu-section-label">Responsables</span>
                <div
                  onClick={() => setActivePopover(activePopover === 'members' ? null : 'members')}
                  title="Gestionar responsables"
                  className="flex -space-x-2 cursor-pointer w-fit"
                >
                  {boardMembers.filter(m => assignedMemberIds.includes(m.id)).map(member => (
                    <div
                      key={member.id}
                      title={member.name}
                      className="w-8 h-8 rounded border-2 border-white dark:border-[#1C1F26] shadow-sm transition-transform hover:scale-110 hover:z-10"
                    >
                      <UserAvatar
                        name={member.name}
                        avatarUrl={member.avatarUrl}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(card?.startDate || card?.dueDate) && (
              <div className="flex flex-col gap-2">
                <span className="cu-section-label">Fechas</span>
                <div className="flex items-center gap-2">
                  <SmartPopover
                    isOpen={!isReadOnly && activePopover === 'dates_badge'}
                    onClose={() => setActivePopover(null)}
                    trigger={
                      <div 
                        onClick={() => !isReadOnly && setActivePopover(activePopover === 'dates_badge' ? null : 'dates_badge')}
                        className={`flex items-center gap-1.5 bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-lg font-semibold text-xs transition-all border border-zinc-200 dark:border-white/10 ${!isReadOnly ? 'cursor-pointer hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-[var(--lumins-accent-fg)]' : 'cursor-default'}`}
                      >
                        <Clock size={14} />
                        <span className="flex items-center gap-1 flex-wrap">
                          {card.startDate && `${format(parseISO(card.startDate), 'd MMM', { locale: es })} – `}
                          {card.dueDate ? (
                            <>
                              {format(parseISO(card.dueDate), 'd MMM', { locale: es })}
                              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                                · {formatTime12h(parseISO(card.dueDate))}
                              </span>
                            </>
                          ) : 'Sin vencimiento'}
                          {card.dueDate && new Date(card.dueDate) < new Date() && !card.isDone && !card.isDueDateDone && (
                            <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] uppercase">Vencido</span>
                          )}
                        </span>
                        {!isReadOnly && <ChevronDown size={14} className="ml-1 opacity-50" />}
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
                  isOpen={!isReadOnly && activePopover === 'properties'}
                  onClose={() => setActivePopover(null)}
                  trigger={
                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      {card.priority && card.priority !== 'P3' && (
                        <div 
                          onClick={() => !isReadOnly && setActivePopover(activePopover === 'properties' ? null : 'properties')}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-transform ${!isReadOnly ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                            ${card.priority === 'P0' ? 'bg-[#FF665E]/[0.10] text-[#D94841] dark:bg-[#FF665E]/15 dark:text-[#FF857E]' : 
                              card.priority === 'P1' ? 'bg-[#FFCC40]/[0.20] text-amber-900 dark:bg-[#FFCC40]/15 dark:text-[#FFCC40]' : 
                              'bg-[#12A9A8]/[0.10] text-[#0E8786] dark:bg-[#12A9A8]/15 dark:text-[#4ED4D2]'}`}
                        >
                          <Zap size={12} fill="currentColor" />
                          {card.priority === 'P0' ? 'P0 - Crítica' : card.priority === 'P1' ? 'P1 - Alta' : 'P2 - Media'}
                        </div>
                      )}
                      {card.priority === 'P3' && (
                        <div 
                          onClick={() => !isReadOnly && setActivePopover(activePopover === 'properties' ? null : 'properties')}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-zinc-300 flex items-center gap-2 transition-transform ${!isReadOnly ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                        >
                          <Zap size={12} />
                          P3 - Baja
                        </div>
                      )}
                      {card.riskLevel && (
                        <div 
                          onClick={() => !isReadOnly && setActivePopover(activePopover === 'properties' ? null : 'properties')}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-transform ${!isReadOnly ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                            ${card.riskLevel === 'high' ? 'bg-[#FF665E]/[0.10] text-[#D94841] dark:bg-[#FF665E]/15 dark:text-[#FF857E]' : 
                              card.riskLevel === 'med' ? 'bg-[#FFCC40]/[0.20] text-amber-900 dark:bg-[#FFCC40]/15 dark:text-[#FFCC40]' : 
                              'bg-[#12A9A8]/[0.10] text-[#0E8786] dark:bg-[#12A9A8]/15 dark:text-[#4ED4D2]'}`}
                        >
                          Riesgo {card.riskLevel === 'high' ? 'Alto' : card.riskLevel === 'med' ? 'Medio' : 'Bajo'}
                        </div>
                      )}
                      {card.module && (
                        <div 
                          onClick={() => !isReadOnly && setActivePopover(activePopover === 'properties' ? null : 'properties')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] border border-[var(--lumins-accent-border)] flex items-center gap-1.5 transition-transform ${!isReadOnly ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
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
          <div className="grid grid-cols-1 md:grid-cols-[1.65fr_1fr] gap-6 lg:gap-8">
            
            {/* LEFT COLUMN: Main Content */}
            <div className="space-y-6">
              
              {/* Quick Actions Bar */}
              {/* Quick Actions Bar - Desktop Only (hidden md:flex) */}
              {!isReadOnly && (
              <div className="hidden md:flex flex-wrap gap-1.5 relative">
                <SmartPopover
                  isOpen={activePopover === 'add' || activePopover === 'attachments_main' || activePopover === 'labels_main' || activePopover === 'members_main' || activePopover === 'dates_main' || activePopover === 'properties_main'}
                  onClose={() => setActivePopover(null)}
                  placement="bottom-start"
                  trigger={
                    <button 
                      onClick={() => setActivePopover(activePopover === 'add' ? null : 'add')}
                      className="flex-shrink-0 flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg bg-[var(--lumins-accent-soft)] border border-[var(--lumins-accent-border)] text-[var(--lumins-accent-fg)] font-bold text-xs hover:brightness-95 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                      <Plus size={14} /> Añadir
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
                          onOpenGoogleDrive={() => setIsDriveModalOpen(true)}
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
                      className="flex-shrink-0 flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-200/80 dark:hover:bg-white/10 hover:text-[var(--lumins-accent-fg)] transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                      <Tag size={13} /> Etiquetas
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
                      className="flex-shrink-0 flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-200/80 dark:hover:bg-white/10 hover:text-[var(--lumins-accent-fg)] transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                      <Users size={13} /> Responsables
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
                      className="flex-shrink-0 flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-200/80 dark:hover:bg-white/10 hover:text-[var(--lumins-accent-fg)] transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                      <Clock size={13} /> Fechas
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
                  className="flex-shrink-0 flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-200/80 dark:hover:bg-white/10 hover:text-[var(--lumins-accent-fg)] transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  <CheckSquare size={13} /> Checklist
                </button>

                <button
                  type="button"
                  onClick={() => setIsMeetModalOpen(true)}
                  className={`flex-shrink-0 flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg border font-semibold text-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                    card?.meetingData?.meetUrl
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                      : 'bg-zinc-100 dark:bg-white/5 border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-white/10 hover:text-emerald-600'
                  }`}
                >
                  <GoogleMeetIcon size={13} />
                  <span>{card?.meetingData?.meetUrl ? 'Editar Meet' : 'Google Meet'}</span>
                </button>
              </div>
              )}

              {/* Scheduled Google Meet Banner (Live status + Host + Mobile-native controls) */}
              {card?.meetingData?.meetUrl && (() => {
                const meet = card.meetingData!;
                const startMs = new Date(meet.scheduledStart).getTime();
                const endMs = meet.scheduledEnd
                  ? new Date(meet.scheduledEnd).getTime()
                  : startMs + (meet.durationMinutes || 45) * 60 * 1000;
                const lifecycle = meet.status || 'SCHEDULED';
                const isLive =
                  lifecycle === 'SCHEDULED' &&
                  !Number.isNaN(startMs) &&
                  meetNow >= startMs - 15 * 60 * 1000 &&
                  meetNow <= endMs;
                const isStartingSoon = isLive && meetNow < startMs;
                const isPastUnconfirmed =
                  lifecycle === 'SCHEDULED' && !Number.isNaN(endMs) && meetNow > endMs;

                const statusBadge =
                  lifecycle === 'COMPLETED'
                    ? {
                        label: 'Realizada',
                        cls: 'bg-[#12A9A8]/12 text-[#0E8786] dark:text-[#4ED4D2] border-[#12A9A8]/25',
                        dot: 'bg-[#12A9A8]',
                      }
                    : lifecycle === 'NO_SHOW'
                    ? {
                        label: 'No realizada',
                        cls: 'bg-[#FF665E]/12 text-[#d6453e] dark:text-[#ff8a84] border-[#FF665E]/25',
                        dot: 'bg-[#FF665E]',
                      }
                    : isLive
                    ? {
                        label: isStartingSoon ? 'Empieza pronto' : 'En curso',
                        cls: 'bg-[#12A9A8]/15 text-[#0E8786] dark:text-[#4ED4D2] border-[#12A9A8]/35',
                        dot: 'bg-[#12A9A8] animate-pulse',
                      }
                    : isPastUnconfirmed
                    ? {
                        label: 'Finalizada · ¿Se realizó?',
                        cls: 'bg-[#FFCC40]/20 text-[#9c6f00] dark:text-[#FFCC40] border-[#FFCC40]/35',
                        dot: 'bg-[#FFCC40]',
                      }
                    : {
                        label: 'Programada',
                        cls: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300 border-slate-200/80 dark:border-white/10',
                        dot: 'bg-slate-400',
                      };

                return (
                <div className="rounded-2xl sm:rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] px-3.5 py-3 sm:py-2.5 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg bg-white dark:bg-[#13151A] border border-slate-200/80 dark:border-white/10 flex items-center justify-center shrink-0">
                        <GoogleMeetIcon size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                            Google Meet
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 shrink-0">
                            · {meet.durationMinutes || 45} min
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusBadge.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                            {statusBadge.label}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-zinc-300 truncate mt-0.5">
                          {format(parseISO(meet.scheduledStart), "EEE d 'de' MMM · h:mm a", { locale: es })}
                        </p>
                        {(meet.organizerName || (meet.rescheduledCount || 0) > 0) && (
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                            {meet.organizerName ? `Anfitrión: ${meet.organizerName}` : ''}
                            {meet.organizerName && (meet.rescheduledCount || 0) > 0 ? ' · ' : ''}
                            {(meet.rescheduledCount || 0) > 0
                              ? `Pospuesta ${meet.rescheduledCount} ${meet.rescheduledCount === 1 ? 'vez' : 'veces'}`
                              : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(meet.meetUrl);
                          toast.success('Enlace de Google Meet copiado al portapapeles');
                        }}
                        title="Copiar enlace"
                        className="w-10 h-10 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg bg-white dark:bg-[#13151A] text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors inline-flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Copy size={14} className="sm:w-[13px] sm:h-[13px]" />
                      </button>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => setIsMeetModalOpen(true)}
                          title="Editar o posponer reunión"
                          className="w-10 h-10 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg bg-white dark:bg-[#13151A] text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors inline-flex items-center justify-center cursor-pointer shrink-0"
                        >
                          <Edit2 size={14} className="sm:w-[13px] sm:h-[13px]" />
                        </button>
                      )}
                      {lifecycle === 'NO_SHOW' && !isReadOnly ? (
                        <button
                          type="button"
                          onClick={() => setIsMeetModalOpen(true)}
                          className="flex-1 sm:flex-initial h-10 sm:h-8 px-3.5 sm:px-3 rounded-xl sm:rounded-lg text-xs font-semibold bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-2xs transition-colors inline-flex items-center justify-center whitespace-nowrap cursor-pointer"
                        >
                          Reagendar
                        </button>
                      ) : (
                        <a
                          href={meet.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-initial h-10 sm:h-8 px-3.5 sm:px-3 rounded-xl sm:rounded-lg text-xs font-semibold bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-2xs transition-colors inline-flex items-center justify-center whitespace-nowrap"
                        >
                          {isLive ? 'Unirse ahora' : 'Unirse'}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Post-meeting native confirmation bar */}
                  {isPastUnconfirmed && !isReadOnly && (
                    <div className="pt-2.5 border-t border-slate-200/70 dark:border-white/10 space-y-2">
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200">
                        La hora programada ya pasó. ¿Se realizó la reunión?
                      </p>
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isUpdatingMeetStatus}
                          onClick={() => handleUpdateMeetStatus('COMPLETED')}
                          className="h-10 sm:h-8 px-3 rounded-xl sm:rounded-lg text-xs font-bold bg-[#12A9A8] hover:bg-[#0E8786] text-white transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                          Sí, realizada
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingMeetStatus}
                          onClick={() => setIsMeetModalOpen(true)}
                          className="h-10 sm:h-8 px-3 rounded-xl sm:rounded-lg text-xs font-bold bg-white dark:bg-[#13151A] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                          Posponer
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingMeetStatus}
                          onClick={() => handleUpdateMeetStatus('NO_SHOW')}
                          className="col-span-2 sm:col-span-1 h-10 sm:h-8 px-3 rounded-xl sm:rounded-lg text-xs font-semibold text-[#d6453e] dark:text-[#ff8a84] bg-[#FF665E]/10 hover:bg-[#FF665E]/15 border border-[#FF665E]/25 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                          No se hizo
                        </button>
                      </div>
                    </div>
                  )}

                  {lifecycle === 'COMPLETED' && meet.completedByName && (
                    <div className="pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-zinc-300">
                      <span className="truncate">
                        Confirmada por <strong className="font-semibold">{meet.completedByName}</strong>
                      </span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          disabled={isUpdatingMeetStatus}
                          onClick={() => setIsMeetModalOpen(true)}
                          className="text-[11px] font-semibold text-[#0E8786] dark:text-[#4ED4D2] hover:underline shrink-0 cursor-pointer"
                        >
                          Agendar otra
                        </button>
                      )}
                    </div>
                  )}

                  {(card.meetingData.agendaNote ||
                    (card.meetingData.invitedAssignees?.length || 0) > 0 ||
                    (card.meetingData.externalGuests?.length || 0) > 0) && (
                    <div className="pt-2 border-t border-slate-200/70 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        {(card.meetingData.invitedAssignees?.length || 0) > 0 && (
                          <div className="flex items-center -space-x-1.5 shrink-0">
                            {card.meetingData.invitedAssignees.map(member => {
                              const status = card.meetingData?.attendeeStatuses?.[member.email.toLowerCase()];
                              const statusText =
                                status === 'accepted'
                                  ? 'Confirmado'
                                  : status === 'declined'
                                  ? 'Rechazado'
                                  : status === 'tentative'
                                  ? 'Tal vez'
                                  : 'Pendiente';
                              const ringColor =
                                status === 'accepted'
                                  ? 'ring-emerald-500'
                                  : status === 'declined'
                                  ? 'ring-rose-500'
                                  : status === 'tentative'
                                  ? 'ring-amber-400'
                                  : 'ring-white dark:ring-[#1C1F26]';

                              return (
                                <div
                                  key={member.id}
                                  title={`${member.name} (${member.email}) · ${statusText}`}
                                  className={`w-5 h-5 rounded-full ring-2 ${ringColor} overflow-hidden`}
                                >
                                  <UserAvatar
                                    name={member.name}
                                    avatarUrl={member.avatarUrl || undefined}
                                    size="xs"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(card.meetingData.externalGuests?.length || 0) > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            {card.meetingData.externalGuests.map(email => {
                              const status = card.meetingData?.attendeeStatuses?.[email.toLowerCase()];
                              const badge =
                                status === 'accepted'
                                  ? { text: 'Confirmado', cls: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25' }
                                  : status === 'declined'
                                  ? { text: 'Rechazado', cls: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25' }
                                  : status === 'tentative'
                                  ? { text: 'Tal vez', cls: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25' }
                                  : { text: 'Pendiente', cls: 'text-slate-500 dark:text-zinc-400 bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10' };

                              return (
                                <span
                                  key={email}
                                  title={`${email} · ${badge.text}`}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium truncate max-w-[260px] ${badge.cls}`}
                                >
                                  <span className="truncate">{email}</span>
                                  <span className="text-[9px] font-bold uppercase opacity-80 shrink-0">
                                    · {badge.text}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {card.meetingData.agendaNote && (
                          <span className="text-slate-500 dark:text-zinc-400 truncate max-w-[260px]">
                            {card.meetingData.agendaNote}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                );
              })()}

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <AlignLeft size={16} className="text-[var(--lumins-accent-fg)]" />
                  <h3 className="text-sm font-bold tracking-tight">Descripción</h3>
                </div>
                
                {!isEditingDescription ? (
                  card?.description ? (
                    <div 
                      onClick={() => !isReadOnly && setIsEditingDescription(true)}
                      className={`w-full ${!isReadOnly ? 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5' : ''} group relative rounded p-2 -ml-2 transition-colors`}
                    >
                      {!isReadOnly && <Edit2 size={16} className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-zinc-400 transition-opacity" />}
                      <div 
                        className="prose prose-sm prose-zinc dark:prose-invert prose-a:text-[#0E8786] dark:prose-a:text-[#4ED4D2] max-w-none" 
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
                        className="bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs hover:brightness-95 transition-all cursor-pointer"
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
                  onUpdateItemTitle={handleUpdateChecklistItemTitle}
                  onUpdateChecklistTitle={handleUpdateChecklistTitle}
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
            <div className="space-y-5">
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
        </motion.div>
        )}
        </AnimatePresence>

        {/* Sticky Mobile Bottom Bar */}
        {!isLoading && card && (
          <div className="sm:hidden border-t border-zinc-200/80 dark:border-white/10 bg-white/95 dark:bg-[#1C1F26]/95 backdrop-blur-md px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-2.5 flex-shrink-0 z-20">
            <button
              onClick={handleToggleDone}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-[0.98] ${
                card?.isDone
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] hover:brightness-95 shadow-md'
              }`}
            >
              <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                card?.isDone ? 'bg-emerald-500 text-white' : 'border-2 border-current opacity-75'
              }`}>
                {card?.isDone && <CheckSquare size={12} className="text-white" />}
              </div>
              <span>{card?.isDone ? 'Completada' : 'Completar tarea'}</span>
            </button>

            <SmartPopover
              isOpen={activePopover === 'mobile_duplicate'}
              onClose={() => setActivePopover(null)}
              placement="top-end"
              trigger={
                <button
                  onClick={() => setActivePopover(activePopover === 'mobile_duplicate' ? null : 'mobile_duplicate')}
                  className="px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Duplicar tarjeta"
                >
                  <Copy size={15} />
                  <span>Duplicar</span>
                </button>
              }
              content={
                <DuplicateCardPopover
                  currentBoardId={boardId || ''}
                  currentListId={card?.listId || ''}
                  currentCardPosition={card?.position}
                  onDuplicate={handleDuplicateCard}
                  onClose={() => setActivePopover(null)}
                  onDuplicateSuccess={(duplicatedToAnotherBoard) => {
                    if (onUpdate) onUpdate();
                    if (duplicatedToAnotherBoard) {
                      onClose();
                    } else {
                      fetchCardDetails(true);
                    }
                  }}
                />
              }
            />
          </div>
        )}
      </motion.div>
      <ConfirmActionModal
        isOpen={isArchiveConfirmOpen}
        title="Archivar tarjeta"
        description={`La tarjeta \"${card?.title || 'sin título'}\" pasará a archivadas. Puedes restaurarla más tarde.`}
        confirmLabel="Sí, archivar"
        cancelLabel="Cancelar"
        isLoading={isSaving}
        onClose={() => {
          if (!isSaving) setIsArchiveConfirmOpen(false);
        }}
        onConfirm={confirmArchiveCard}
      />
      {cardId && (
        <>
          <GoogleMeetScheduleModal
            isOpen={isMeetModalOpen}
            onClose={() => setIsMeetModalOpen(false)}
            backLabel="Volver a la tarjeta"
            cardId={cardId}
            cardTitle={card?.title || displayTitle}
            defaultDate={card?.dueDate || card?.startDate || null}
            assignees={boardMembers.filter(m => assignedMemberIds.includes(m.id))}
            existingMeeting={card?.meetingData || null}
            onScheduled={(newMeetingData) => {
              setCard(prev => (prev ? { ...prev, meetingData: newMeetingData } : null));
              fetchCardDetails(true);
              if (onUpdate) onUpdate();
              window.dispatchEvent(
                new CustomEvent('lumins:card-updated', { detail: { cardId, boardId } })
              );
            }}
          />
          <GoogleDrivePickerModal
            isOpen={isDriveModalOpen}
            onClose={() => setIsDriveModalOpen(false)}
            cardId={cardId}
            onAttached={() => {
              fetchCardDetails(true);
              if (onUpdate) onUpdate();
              window.dispatchEvent(
                new CustomEvent('lumins:card-updated', { detail: { cardId, boardId } })
              );
            }}
          />
        </>
      )}
    </div>
  );
};

export default CardDetailModal;
