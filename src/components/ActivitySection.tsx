import React, { useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityItem } from '../types/activity';

interface ActivitySectionProps {
  activities: ActivityItem[];
  onAddComment: (text: string) => void;
  isLoading?: boolean;
}

/**
 * Component for adding new comments with interactive states.
 */
const CommentInput: React.FC<{ onAddComment: (text: string) => void, isLoading?: boolean }> = ({ onAddComment, isLoading }) => {
  const [comment, setComment] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    if (comment.trim()) {
      onAddComment(comment);
      setComment('');
      setIsFocused(false);
    }
  };

  const handleCancel = () => {
    setComment('');
    setIsFocused(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          rows={isFocused ? 3 : 2}
          placeholder="Escribe un comentario..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className={`w-full bg-[#F3E8FF] rounded-xl p-3 text-sm text-zinc-900 outline-none placeholder:text-[#806F9B] transition-all resize-none
            ${isFocused ? 'min-h-[80px] ring-2 ring-[#7A5AF8]/50 bg-white shadow-sm' : ''}
          `}
          disabled={isLoading}
        />
        
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center gap-2 mt-2"
            >
              <button
                onClick={handleSave}
                disabled={!comment.trim() || isLoading}
                className="bg-[#7A5AF8] text-white px-4 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50 transition-all hover:bg-[#6948e5] active:scale-95 shadow-lg shadow-purple-100"
              >
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="text-[#806F9B] hover:text-zinc-900 text-sm font-bold px-3 transition-colors py-1.5"
              >
                Cancelar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * Component for a single activity feed item (comment or system event).
 */
const ActivityFeedItem: React.FC<{ item: ActivityItem }> = ({ item }) => {
  const isSystem = item.type === 'SYSTEM_EVENT';
  
  // Safe date parsing
  const dateObj = typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt;
  const relativeDate = formatDistanceToNow(dateObj, { addSuffix: true, locale: es });

  return (
    <div className="flex items-start gap-3 mb-6 relative group">
      {/* Avatar */}
      <div 
        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white
          ${isSystem ? 'bg-slate-200 text-slate-600' : 'bg-[#7A5AF8]'}
        `}
      >
        {item.user.avatarUrl ? (
          <img src={item.user.avatarUrl} alt={item.user.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          item.user.initials
        )}
      </div>

      <div className="flex-1 min-w-0">
        {isSystem ? (
          <div className="flex flex-col">
            <p className="text-sm leading-tight">
              <span className="font-bold text-zinc-900">{item.user.name}</span>{' '}
              <span className="text-[#806F9B]">{item.action}</span>
            </p>
            <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">{relativeDate}</span>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span className="font-bold text-zinc-900 text-sm">{item.user.name}</span>
              <span className="text-[11px] font-medium text-[#806F9B] ml-2">{relativeDate}</span>
            </div>
            
            {/* Comment Bubble */}
            <div className="bg-white border border-purple-50 shadow-sm rounded-lg rounded-tl-none p-3 mt-1 text-sm text-zinc-800 leading-relaxed max-w-full break-words relative">
              {item.content}
            </div>

            {/* Actions (Hover) */}
            <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-4 mt-1 pl-1">
              <button className="text-[10px] font-bold text-[#806F9B] hover:text-[#7A5AF8] cursor-pointer transition-colors">
                Editar
              </button>
              <button className="text-[10px] font-bold text-[#806F9B] hover:text-[#7A5AF8] cursor-pointer transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main ActivitySection component.
 */
export const ActivitySection: React.FC<ActivitySectionProps> = ({ activities, onAddComment, isLoading }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <CommentInput onAddComment={onAddComment} isLoading={isLoading} />
      
      <div className="mt-8 space-y-1">
        <AnimatePresence mode="popLayout">
          {activities.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <ActivityFeedItem item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {activities.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-[#806F9B] italic">No hay actividad todavía.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitySection;
