import React, { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAuth } from '../contexts/AuthContext';

export interface CardDetail {
  id: string;
  title: string;
  description?: string;
  listId: string;
  position: number;
  dueDate?: string;
  priority?: 'P0' | 'P1' | 'P2';
  module?: string;
  riskLevel?: 'low' | 'med' | 'high';
  blocked?: boolean;
  blockedReason?: string;
  createdAt?: string;
  updatedAt?: string;
  labels?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  assignees?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  checklists?: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      title: string;
      done: boolean;
      position: number;
    }>;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    sizeBytes?: number;
    mime?: string;
    createdAt: string;
  }>;
  comments?: Array<{
    id: string;
    body: string;
    author: {
      id: string;
      name: string;
      email: string;
    };
    createdAt: string;
    updatedAt: string;
  }>;
}

interface Label {
  id: string;
  name: string;
  color: string;
  boardId: string;
}

interface BoardMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Checklist {
  id: string;
  title: string;
  cardId: string;
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
  position: number;
  checklistId: string;
}

interface Comment {
  id: string;
  body: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  sizeBytes?: number;
  mime?: string;
  createdAt: string;
}

interface CardModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  onCardUpdated: (updatedCard: CardDetail) => void;
  onCardDeleted: (cardId: string) => void;
}

const CardModal: React.FC<CardModalProps> = ({
  cardId,
  isOpen,
  onClose,
  onCardUpdated,
  onCardDeleted,
}) => {
  const { user } = useAuth();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para edición
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  
  // Estados para funcionalidades adicionales
  const [labels, setLabels] = useState<Label[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState<Record<string, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch card details y datos relacionados
  useEffect(() => {
    if (!isOpen || !cardId) return;

    const fetchCardDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch card details
        const cardResponse = await apiClient.get<{ data: { card: CardDetail } }>(`/api/cards/${cardId}`);
        const cardData = cardResponse.data.card;
        setCard(cardData);
        setEditTitle(cardData.title);
        setEditDescription(cardData.description || '');
        
        // Fetch board labels - need to get boardId from list
        // Note: We can't get boardId directly, so we'll skip labels for now
        // or we could fetch all boards and find the one containing this list
        // For now, we'll skip labels to avoid the error
        console.log('Skipping labels fetch - boardId not available');
        setLabels([]);
        
        // Fetch checklists
        try {
          const checklistsResponse = await apiClient.get<{ data: { checklists: Checklist[] } }>(`/api/cards/${cardId}/checklists`);
          console.log('Checklists response:', checklistsResponse.data);
          setChecklists(checklistsResponse.data.checklists || []);
        } catch (err) {
          console.error('Error fetching checklists:', err);
        }
        
        // Fetch comments
        try {
          const commentsResponse = await apiClient.get<{ data: { comments: Comment[] } }>(`/api/cards/${cardId}/comments`);
          setComments(commentsResponse.data.comments || []);
        } catch (err) {
          console.error('Error fetching comments:', err);
        }
        
        // Fetch attachments
        try {
          const attachmentsResponse = await apiClient.get<{ data: { attachments: Attachment[] } }>(`/api/cards/${cardId}/attachments`);
          setAttachments(attachmentsResponse.data.attachments || []);
        } catch (err) {
          console.error('Error fetching attachments:', err);
        }
        
      } catch (err: any) {
        setError(err.message || 'Error al cargar los detalles de la tarjeta');
        console.error('Error fetching card details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCardDetails();
  }, [cardId, isOpen]);

  // Handle title update
  const handleUpdateTitle = async () => {
    if (!card || !editTitle.trim() || editTitle === card.title) {
      setIsEditingTitle(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.patch<{ data: { card: CardDetail } }>(`/api/cards/${card.id}`, {
        title: editTitle,
      });
      setCard(response.data.card);
      onCardUpdated(response.data.card);
      setIsEditingTitle(false);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el título');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle description update
  const handleUpdateDescription = async () => {
    if (!card || editDescription === card.description) {
      setIsEditingDescription(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.patch<{ data: { card: CardDetail } }>(`/api/cards/${card.id}`, {
        description: editDescription || null,
      });
      setCard(response.data.card);
      onCardUpdated(response.data.card);
      setIsEditingDescription(false);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la descripción');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle due date update
  const handleUpdateDueDate = async (dueDate: string | null) => {
    if (!card) return;

    setIsSubmitting(true);
    try {
      // Convert YYYY-MM-DD to ISO 8601 format if date is provided
      let formattedDueDate = null;
      if (dueDate) {
        // Create date at start of day in local timezone, then convert to ISO string
        const date = new Date(dueDate);
        // Set to start of day to avoid timezone issues
        date.setHours(0, 0, 0, 0);
        formattedDueDate = date.toISOString();
      }

      const response = await apiClient.patch<{ data: { card: CardDetail } }>(`/api/cards/${card.id}`, {
        dueDate: formattedDueDate,
      });
      setCard(response.data.card);
      onCardUpdated(response.data.card);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la fecha de vencimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle label toggle
  const handleToggleLabel = async (labelId: string) => {
    if (!card) return;

    const isLabelAssigned = card.labels?.some(label => label.id === labelId);
    
    setIsSubmitting(true);
    try {
      if (isLabelAssigned) {
        // Remove label
        await apiClient.delete(`/api/cards/${card.id}/labels/${labelId}`);
      } else {
        // Add label
        await apiClient.post(`/api/cards/${card.id}/labels`, { labelId });
      }
      
      // Refresh card data
      const response = await apiClient.get<{ data: { card: CardDetail } }>(`/api/cards/${cardId}`);
      setCard(response.data.card);
      onCardUpdated(response.data.card);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar las etiquetas');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle create checklist
  const handleCreateChecklist = async () => {
    if (!card || !newChecklistTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<{ data: { checklist: Checklist } }>(`/api/cards/${card.id}/checklists`, {
        title: newChecklistTitle,
      });
      setChecklists(prev => [...prev, response.data.checklist]);
      setNewChecklistTitle('');
    } catch (err: any) {
      setError(err.message || 'Error al crear el checklist');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle checklist item toggle
  const handleToggleChecklistItem = async (checklistId: string, itemId: string, done: boolean) => {
    setIsSubmitting(true);
    try {
      await apiClient.put(`/api/checklist-items/${itemId}`, {
        done: !done,
      });
      
      // Update local state
      setChecklists(prev => prev.map(checklist => {
        if (checklist.id === checklistId) {
          return {
            ...checklist,
            items: checklist.items.map(item => 
              item.id === itemId ? { ...item, done: !done } : item
            )
          };
        }
        return checklist;
      }));
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el item del checklist');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle add checklist item
  const handleAddChecklistItem = async (checklistId: string) => {
    const itemTitle = newChecklistItem[checklistId];
    if (!itemTitle?.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<{ data: { item: ChecklistItem } }>(`/api/checklists/${checklistId}/items`, {
        title: itemTitle,
      });
      
      setChecklists(prev => prev.map(checklist => {
        if (checklist.id === checklistId) {
          return {
            ...checklist,
            items: [...checklist.items, response.data.item]
          };
        }
        return checklist;
      }));
      
      setNewChecklistItem(prev => ({ ...prev, [checklistId]: '' }));
    } catch (err: any) {
      setError(err.message || 'Error al añadir item al checklist');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle create comment
  const handleCreateComment = async () => {
    if (!card || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<{ data: { comment: Comment } }>(`/api/cards/${card.id}/comments`, {
        body: newComment,
      });
      setComments(prev => [...prev, response.data.comment]);
      setNewComment('');
    } catch (err: any) {
      setError(err.message || 'Error al crear el comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;

    setIsSubmitting(true);
    try {
      await apiClient.delete(`/api/comments/${commentId}`);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err: any) {
      // Si el error es 404 (comment no encontrado), igual lo eliminamos del estado local
      if (err.response?.status === 404) {
        console.warn('Comment no encontrado en el servidor, eliminando del estado local:', commentId);
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      } else {
        setError(err.message || 'Error al eliminar el comentario');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!card || !event.target.files?.length) return;

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<{ data: { attachment: Attachment } }>(`/api/cards/${card.id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAttachments(prev => [...prev, response.data.attachment]);
    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setIsSubmitting(false);
      event.target.value = ''; // Reset file input
    }
  };

  // Handle delete attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este archivo?')) return;

    setIsSubmitting(true);
    try {
      await apiClient.delete(`/api/attachments/${attachmentId}`);
      setAttachments(prev => prev.filter(attachment => attachment.id !== attachmentId));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el archivo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle card deletion (now archives instead of deleting)
  const handleDeleteCard = async () => {
    if (!card) return;

    if (!confirm('¿Estás seguro de que deseas archivar esta tarjeta? Esta acción la marcará como cerrada pero mantendrá todos sus datos.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Archive card by setting status to 'closed' instead of deleting
      await apiClient.patch(`/api/cards/${card.id}`, { status: 'closed' });
      onCardDeleted(card.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al archivar la tarjeta');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle assignee toggle
  const handleToggleAssignee = async (userId: string) => {
    if (!card) return;

    const isAssigned = card.assignees?.some(assignee => assignee.id === userId);
    
    setIsSubmitting(true);
    try {
      if (isAssigned) {
        // Remove assignee
        await apiClient.delete(`/api/cards/${card.id}/assign/${userId}`);
      } else {
        // Add assignee
        await apiClient.post(`/api/cards/${card.id}/assign`, { userId });
      }
      
      // Refresh card data
      const response = await apiClient.get<{ data: { card: CardDetail } }>(`/api/cards/${cardId}`);
      setCard(response.data.card);
      onCardUpdated(response.data.card);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar los asignados');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle archive card
  const handleArchiveCard = async () => {
    if (!card) return;

    if (!confirm('¿Estás seguro de que deseas archivar esta tarjeta? Puedes restaurarla más tarde.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Archive card by setting status to 'closed'
      await apiClient.patch(`/api/cards/${card.id}`, { status: 'closed' });
      onCardDeleted(card.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al archivar la tarjeta');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle move card to another list
  const handleMoveCard = async (targetListId: string) => {
    if (!card) return;

    setIsSubmitting(true);
    try {
      await apiClient.post(`/api/cards/${card.id}/move`, {
        destinationBoardId: card.boardId,
        destinationListId: targetListId,
        newPosition: 0,
      });
      
      // Refresh card data
      const response = await apiClient.get<{ data: { card: CardDetail } }>(`/api/cards/${cardId}`);
      setCard(response.data.card);
      onCardUpdated(response.data.card);
    } catch (err: any) {
      setError(err.message || 'Error al mover la tarjeta');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate checklist progress
  const getChecklistProgress = (checklist: Checklist): number => {
    const totalItems = checklist.items.length;
    const completedItems = checklist.items.filter(item => item.done).length;
    if (totalItems === 0) return 0;
    const progress = Math.round((completedItems / totalItems) * 100);
    return progress;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-0 sm:p-4 text-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative transform overflow-hidden sm:rounded bg-gradient-to-b from-[#1c2327] to-[#111618] border border-white/10 shadow-2xl transition-all w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-white/5 sticky top-0 bg-[#1c2327] z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={handleUpdateTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateTitle();
                        if (e.key === 'Escape') {
                          setEditTitle(card?.title || '');
                          setIsEditingTitle(false);
                        }
                      }}
                      autoFocus
                      className="text-xl font-bold"
                      disabled={isSubmitting}
                    />
                  </div>
                ) : (
                  <h2 
                    className="text-xl font-bold text-white cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {isLoading ? 'Cargando...' : card?.title}
                  </h2>
                )}
                
                {card?.listId && (
                  <p className="text-sm text-[#9db0b9] mt-1">
                    En lista: <span className="text-white">{/* List name would go here */}</span>
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="text-[#9db0b9] hover:text-white p-2 rounded hover:bg-white/5 transition-colors"
                  title="Cerrar"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded h-8 w-8 border-b-2 border-primary"></div>
                <p className="ml-3 text-[#9db0b9]">Cargando detalles de la tarjeta...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <div className="mx-auto w-12 h-12 text-red-500/30 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p className="text-red-400 mb-4">{error}</p>
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                >
                  Cerrar
                </Button>
              </div>
            ) : card ? (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white flex items-center">
                      <span className="material-symbols-outlined text-lg mr-2">description</span>
                      Descripción
                    </h3>
                    {!isEditingDescription && (
                      <Button
                        onClick={() => setIsEditingDescription(true)}
                        variant="outline"
                        size="sm"
                      >
                        {card.description ? 'Editar' : 'Añadir descripción'}
                      </Button>
                    )}
                  </div>
                  
                  {isEditingDescription ? (
                    <div className="space-y-3">
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Añade una descripción más detallada..."
                        className="w-full px-4 py-3 border border-[#3b4b54] bg-[#111618] text-white rounded focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none placeholder:text-[#586872] min-h-[100px]"
                        autoFocus
                        disabled={isSubmitting}
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleUpdateDescription}
                          isLoading={isSubmitting}
                          disabled={isSubmitting}
                          size="sm"
                        >
                          Guardar
                        </Button>
                        <Button
                          onClick={() => {
                            setEditDescription(card.description || '');
                            setIsEditingDescription(false);
                          }}
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="p-4 bg-[#111618] border border-[#3b4b54] rounded min-h-[60px] cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => setIsEditingDescription(true)}
                    >
                      {card.description ? (
                        <p className="text-[#9db0b9] whitespace-pre-wrap">{card.description}</p>
                      ) : (
                        <p className="text-[#586872] italic">Añade una descripción más detallada...</p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Due Date */}
                <div>
                  <h3 className="font-semibold text-white flex items-center mb-3">
                    <span className="material-symbols-outlined text-lg mr-2">calendar_today</span>
                    Fecha de vencimiento
                  </h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="date"
                      value={card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleUpdateDueDate(e.target.value || null)}
                      className="px-4 py-2 border border-[#3b4b54] bg-[#111618] text-white rounded focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                      disabled={isSubmitting}
                    />
                    {card.dueDate && (
                      <Button
                        onClick={() => handleUpdateDueDate(null)}
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                      >
                        Eliminar fecha
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Labels - Ocultado temporalmente */}
                {/* <div>
                  <h3 className="font-semibold text-white flex items-center mb-3">
                    <span className="material-symbols-outlined text-lg mr-2">label</span>
                    Etiquetas
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {labels.map(label => {
                      const isAssigned = card.labels?.some(l => l.id === label.id);
                      return (
                        <button
                          key={label.id}
                          onClick={() => handleToggleLabel(label.id)}
                          className={`px-3 py-1.5 rounded text-sm font-medium border transition-all ${isAssigned ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                          style={{
                            backgroundColor: `${label.color}20`,
                            borderColor: label.color,
                            color: label.color,
                          }}
                          disabled={isSubmitting}
                        >
                          {label.name}
                          {isAssigned && (
                            <span className="ml-1.5">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {labels.length === 0 && (
                    <p className="text-[#586872] italic text-sm">
                      No hay etiquetas disponibles en este tablero.
                    </p>
                  )}
                </div> */}
                
                {/* Assignees - Ocultado temporalmente */}
                {/* <div>
                  <h3 className="font-semibold text-white flex items-center mb-3">
                    <span className="material-symbols-outlined text-lg mr-2">person</span>
                    Asignados
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {card.assignees && card.assignees.length > 0 ? (
                      card.assignees.map(assignee => (
                        <button
                          key={assignee.id}
                          onClick={() => handleToggleAssignee(assignee.id)}
                          className="px-3 py-1.5 rounded text-sm font-medium bg-primary/20 border border-primary text-primary hover:bg-primary/30 transition-colors flex items-center"
                          disabled={isSubmitting}
                        >
                          <div className="w-5 h-5 rounded bg-primary/30 flex items-center justify-center mr-1.5">
                            <span className="text-xs">{(assignee.name || assignee.email || '?').charAt(0).toUpperCase()}</span>
                          </div>
                          {assignee.name}
                          <span className="ml-1.5">✓</span>
                        </button>
                      ))
                    ) : (
                      <p className="text-[#586872] italic text-sm">
                        No hay miembros asignados a esta tarjeta.
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-[#9db0b9]">
                    <p>Haz clic en un miembro para asignarlo o desasignarlo de esta tarjeta.</p>
                  </div>
                </div> */}
                
                {/* Checklists */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white flex items-center">
                      <span className="material-symbols-outlined text-lg mr-2">checklist</span>
                      Checklists
                    </h3>
                    <Button
                      onClick={() => setNewChecklistTitle('Nuevo checklist')}
                      variant="outline"
                      size="sm"
                    >
                      Añadir checklist
                    </Button>
                  </div>
                  
                  {newChecklistTitle && (
                    <div className="mb-4 p-4 bg-[#111618] border border-[#3b4b54] rounded">
                      <Input
                        value={newChecklistTitle}
                        onChange={(e) => setNewChecklistTitle(e.target.value)}
                        placeholder="Título del checklist..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateChecklist();
                          if (e.key === 'Escape') setNewChecklistTitle('');
                        }}
                        autoFocus
                        className="mb-3"
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleCreateChecklist}
                          isLoading={isSubmitting}
                          disabled={isSubmitting || !newChecklistTitle.trim()}
                          size="sm"
                        >
                          Crear
                        </Button>
                        <Button
                          onClick={() => setNewChecklistTitle('')}
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {checklists.map(checklist => (
                    <div key={checklist.id} className="mb-6 p-5 bg-[#111618] border border-[#3b4b54] rounded">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-white text-lg">{checklist.title}</h4>
                        <div className="text-sm font-bold bg-[#00a8ff] text-white px-3 py-1.5 rounded shadow-md shadow-[#00a8ff]/40">
                          {getChecklistProgress(checklist)}% completado
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-5">
                        {checklist.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded transition-colors">
                            {/* Contenedor izquierdo: Checkbox + Texto PEGADOS */}
                            <div className="flex items-start flex-1 min-w-0">
                              <button
                                onClick={() => handleToggleChecklistItem(checklist.id, item.id, item.done)}
                                className={`w-5 h-5 rounded border mt-0.5 mr-3 flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-[#00a8ff] border-[#00a8ff]' : 'border-[#586872] hover:border-[#00a8ff]'}`}
                                disabled={isSubmitting}
                                title={item.done ? 'Marcar como pendiente' : 'Marcar como completado'}
                              >
                                {item.done && (
                                  <span className="text-white text-xs font-bold">✓</span>
                                )}
                              </button>
                              <span className={`font-semibold text-[15px] leading-snug flex-1 ${item.done ? 'text-[#9db0b9] line-through' : 'text-white'}`}>
                                {item.title}
                              </span>
                            </div>
                            
                            {/* Contenedor derecho: Badge completamente separado */}
                            {item.done && (
                              <span className="ml-4 text-xs font-bold bg-[#00a8ff] text-white px-3 py-1.5 rounded flex-shrink-0 shadow-md shadow-[#00a8ff]/40">
                                Completado
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center pt-5 border-t border-white/10">
                        <Input
                          value={newChecklistItem[checklist.id] || ''}
                          onChange={(e) => setNewChecklistItem(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                          placeholder="Escribe un nuevo item..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddChecklistItem(checklist.id);
                          }}
                          className="flex-1 mr-3 bg-[#1a2226] border-[#3b4b54] text-white placeholder:text-[#9db0b9] focus:border-[#00a8ff] focus:ring-2 focus:ring-[#00a8ff]/40"
                          size="sm"
                        />
                        <Button
                          onClick={() => handleAddChecklistItem(checklist.id)}
                          size="sm"
                          disabled={!newChecklistItem[checklist.id]?.trim() || isSubmitting}
                          leftIcon={<span className="material-symbols-outlined text-sm">add</span>}
                          className="bg-[#00a8ff] hover:bg-[#0097e6] text-white whitespace-nowrap font-bold shadow-md shadow-[#00a8ff]/40"
                        >
                          + Añadir item
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {checklists.length === 0 && !newChecklistTitle && (
                    <p className="text-[#586872] italic text-sm">
                      No hay checklists. Crea uno para organizar tareas.
                    </p>
                  )}
                </div>
                
                {/* Comments */}
                <div>
                  <h3 className="font-semibold text-white flex items-center mb-3">
                    <span className="material-symbols-outlined text-lg mr-2">comment</span>
                    Comentarios
                  </h3>
                  
                  <div className="mb-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe un comentario..."
                      className="w-full px-4 py-3 border border-[#3b4b54] bg-[#111618] text-white rounded focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none placeholder:text-[#586872] min-h-[80px]"
                      disabled={isSubmitting}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={handleCreateComment}
                        isLoading={isSubmitting}
                        disabled={isSubmitting || !newComment.trim()}
                        size="sm"
                      >
                        Comentar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="p-4 bg-[#111618] border border-[#3b4b54] rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold mr-2">
                              {(comment.author.name || comment.author.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">{comment.author.name}</p>
                              <p className="text-xs text-[#586872]">
                                {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          
                          {comment.author.id === user?.id && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-[#9db0b9] hover:text-red-400 p-1 rounded hover:bg-red-500/10"
                              title="Eliminar comentario"
                              disabled={isSubmitting}
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[#9db0b9] whitespace-pre-wrap">{comment.body}</p>
                      </div>
                    ))}
                    
                    {comments.length === 0 && (
                      <p className="text-[#586872] italic text-sm text-center py-4">
                        No hay comentarios aún. Sé el primero en comentar.
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Attachments */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white flex items-center">
                      <span className="material-symbols-outlined text-lg mr-2">attach_file</span>
                      Adjuntos
                    </h3>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<span className="material-symbols-outlined text-sm">upload</span>}
                        disabled={isSubmitting}
                      >
                        Subir archivo
                      </Button>
                    </label>
                  </div>
                  
                  <div className="space-y-2">
                    {attachments.map(attachment => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 bg-[#111618] border border-[#3b4b54] rounded">
                        <div className="flex items-center">
                          <span className="material-symbols-outlined text-[#9db0b9] mr-3">description</span>
                          <div>
                            <p className="text-white font-medium">{attachment.name}</p>
                            <p className="text-xs text-[#586872]">
                              {new Date(attachment.createdAt).toLocaleDateString()}
                              {attachment.sizeBytes && ` • ${Math.round(attachment.sizeBytes / 1024)} KB`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#9db0b9] hover:text-primary p-1.5 rounded hover:bg-white/5"
                            title="Descargar"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                          </a>
                          <button
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            className="text-[#9db0b9] hover:text-red-400 p-1.5 rounded hover:bg-red-500/10"
                            title="Eliminar"
                            disabled={isSubmitting}
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {attachments.length === 0 && (
                      <p className="text-[#586872] italic text-sm text-center py-4">
                        No hay archivos adjuntos.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 bg-[#111618]/50 flex justify-between items-center">
            <div className="text-sm text-[#9db0b9]">
              {card?.createdAt && (
                <p>Creada: {new Date(card.createdAt).toLocaleDateString()}</p>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleArchiveCard}
                variant="secondary"
                size="sm"
                disabled={isSubmitting}
                leftIcon={<span className="material-symbols-outlined text-sm">archive</span>}
              >
                Archivar
              </Button>
              <Button
                onClick={handleDeleteCard}
                variant="danger"
                size="sm"
                disabled={isSubmitting}
                leftIcon={<span className="material-symbols-outlined text-sm">delete</span>}
              >
                Eliminar
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                disabled={isSubmitting}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
