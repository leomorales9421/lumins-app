import React, { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { List } from '../../pages/BoardDetailPage';
import type { Card } from '../../pages/BoardDetailPage';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface SortableListProps {
  list: List;
  cardIds: string[];
  children: React.ReactNode;
  onRename: (listId: string, newTitle: string) => Promise<void>;
  onDelete: (listId: string) => void | Promise<void>;
  onCreateCard: (listId: string, title: string) => Promise<void>;
  isCreatingCard?: boolean;
}

export const SortableList: React.FC<SortableListProps> = ({
  list,
  cardIds,
  children,
  onRename,
  onDelete,
  onCreateCard,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: list.id,
    data: {
      type: 'list',
      listId: list.id,
    }
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `list-${list.id}`,
    data: {
      type: 'list',
      listId: list.id,
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.name);
  const [isCreating, setIsCreating] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRename = async () => {
    if (editTitle.trim() && editTitle !== list.name) {
      await onRename(list.id, editTitle);
    }
    setIsEditing(false);
  };

  const handleCreateCard = async () => {
    if (!newCardTitle.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onCreateCard(list.id, newCardTitle);
      setNewCardTitle('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating card:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
      <div
        ref={(node) => {
          setNodeRef(node);
          setDroppableRef(node);
        }}
        style={style}
        className={`flex-shrink-0 w-80 bg-[#1c2327]/80 backdrop-blur-xl border ${isOver ? 'border-primary/50' : 'border-white/5'} rounded-2xl p-4 ${isDragging ? 'shadow-2xl shadow-primary/20' : ''}`}
        data-type="list"
        data-list-id={list.id}
      >
        {/* List Header with Drag Handle */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center flex-1">
            <button
              {...attributes}
              {...listeners}
              className="mr-2 text-[#9db0b9] hover:text-white cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/5"
              title="Arrastrar para reordenar"
            >
              <span className="material-symbols-outlined text-lg">drag_handle</span>
            </button>
            
            {isEditing ? (
              <div className="flex-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') {
                      setEditTitle(list.name);
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                  className="text-white"
                />
              </div>
            ) : (
              <h3 
                className="font-semibold text-white cursor-pointer hover:text-primary transition-colors flex-1 truncate max-w-[180px]"
                onDoubleClick={() => setIsEditing(true)}
                title={list.name}
              >
                {list.name}
              </h3>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <span className="text-sm text-[#9db0b9] bg-[#111618] px-2 py-1 rounded">
              {React.Children.count(children)}
            </span>
            
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="text-[#9db0b9] hover:text-white p-1 rounded hover:bg-white/5"
              title="Añadir tarjeta"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
            
            <button
              onClick={() => onDelete(list.id)}
              className="text-[#9db0b9] hover:text-red-400 p-1 rounded hover:bg-red-500/10"
              title="Eliminar lista"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
        
        {/* Cards Container */}
        <div className="space-y-3 mb-4">
          {children}
        </div>
      
      {/* Create Card Form */}
      {isCreating && (
        <div className="mb-3">
          <Input
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="Título de la tarjeta..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSubmitting) handleCreateCard();
              if (e.key === 'Escape') {
                setNewCardTitle('');
                setIsCreating(false);
              }
            }}
            disabled={isSubmitting}
            autoFocus
            className="mb-2"
          />
          <div className="flex space-x-2">
            <Button
              onClick={handleCreateCard}
              isLoading={isSubmitting}
              disabled={isSubmitting || !newCardTitle.trim()}
              size="sm"
            >
              Añadir
            </Button>
            <Button
              onClick={() => {
                setNewCardTitle('');
                setIsCreating(false);
              }}
              variant="outline"
              size="sm"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
      
      {/* Add Card Button (when not creating) */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full text-left p-3 text-[#9db0b9] hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center"
        >
          <span className="material-symbols-outlined text-sm mr-2">add</span>
          Añadir tarjeta
        </button>
      )}
      </div>
    </SortableContext>
  );
};
