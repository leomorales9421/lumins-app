import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '../../pages/BoardDetailPage';

interface SortableCardProps {
  card: Card;
  onRename: (cardId: string, newTitle: string) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
  onClick?: () => void;
}

export const SortableCard: React.FC<SortableCardProps> = ({
  card,
  onRename,
  onDelete,
  onClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [isDeleting, setIsDeleting] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRename = async () => {
    if (editTitle.trim() && editTitle !== card.title) {
      await onRename(card.id, editTitle);
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete(card.id);
    } catch (error) {
      console.error('Error deleting card:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getLabelColor = (label: any): string => {
    const colors = [
      '#4F46E5', // Indigo
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Violet
      '#06B6D4', // Cyan
    ];
    
    // Handle both string labels and object labels
    let labelString: string;
    if (typeof label === 'string') {
      labelString = label;
    } else if (label && typeof label === 'object') {
      // Try to get name property from label object
      labelString = label.name || label.title || label.id || JSON.stringify(label);
    } else {
      labelString = String(label || '');
    }
    
    const hash = labelString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-[#111618] rounded-lg p-4 border border-[#3b4b54] hover:border-primary/30 cursor-pointer transition-all card-hover ${isDragging ? 'shadow-2xl shadow-primary/20 rotate-1' : ''}`}
      onClick={onClick}
    >
      {/* Card Header with Drag Handle */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          {isEditing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setEditTitle(card.title);
                  setIsEditing(false);
                }
              }}
              autoFocus
              className="w-full px-2 py-1 bg-[#1c2327] text-white border border-primary/50 rounded text-sm font-medium outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center">
              <button
                className="mr-2 text-[#9db0b9] hover:text-white cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/5"
                title="Arrastrar para mover"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="material-symbols-outlined text-sm">drag_handle</span>
              </button>
              <h4 
                className="font-medium text-white cursor-pointer hover:text-primary transition-colors flex-1"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                {card.title}
              </h4>
            </div>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="text-[#9db0b9] hover:text-red-400 p-1 rounded hover:bg-red-500/10 ml-2"
          title="Eliminar tarjeta"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="material-symbols-outlined text-sm">close</span>
          )}
        </button>
      </div>
      
      {/* Card Description */}
      {card.description && !isEditing && (
        <p className="text-sm text-[#9db0b9] mb-3 line-clamp-2">
          {card.description}
        </p>
      )}
      
      {/* Card Metadata */}
      <div className="flex items-center justify-between">
        {card.dueDate && (
          <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {new Date(card.dueDate).toLocaleDateString()}
          </span>
        )}
        
        {card.labels && card.labels.length > 0 && (
          <div className="flex space-x-1">
            {card.labels.slice(0, 2).map((label, idx) => {
              // Extract label text for title
              let labelText = '';
              if (typeof label === 'string') {
                labelText = label;
              } else if (label && typeof label === 'object') {
                labelText = label.name || label.title || label.id || '';
              }
              
              return (
                <span
                  key={idx}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getLabelColor(label) }}
                  title={labelText}
                />
              );
            })}
            {card.labels.length > 2 && (
              <span className="text-xs text-[#9db0b9]">
                +{card.labels.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
