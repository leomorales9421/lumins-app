import React, { useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Loader2 } from 'lucide-react';
import type { ActivityItem } from '../types/activity';
import UserAvatar from './ui/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from './RichTextEditor';
import type { RichTextEditorRef } from './RichTextEditor';

interface ActivitySectionProps {
  activities: ActivityItem[];
  onAddComment: (text: string) => void;
  onUpdateComment?: (commentId: string, newContent: string) => void;
  onDeleteComment?: (commentId: string) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isFetchingMore?: boolean;
  cardId?: string;
}

/**
 * Component for adding new comments with rich text support.
 */
const CommentInput: React.FC<{ onAddComment: (text: string) => void, isLoading?: boolean, cardId?: string }> = ({ onAddComment, isLoading, cardId }) => {
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);

  const handleSave = () => {
    const html = editorRef.current?.getHTML();
    const hasText = html && html.replace(/<[^>]*>/g, '').trim().length > 0;
    const hasImage = html && html.includes('<img');
    
    if (hasText || hasImage) {
      onAddComment(html || '');
      editorRef.current?.clearContent();
      setIsFocused(false);
    }
  };

  const handleCancel = () => {
    editorRef.current?.clearContent();
    setIsFocused(false);
  };

  return (
    <div className="space-y-3 mb-8">
      <div 
        className="relative"
        onFocus={() => setIsFocused(true)}
      >
        <RichTextEditor
          ref={editorRef}
          variant="compact"
          hideFooter={true}
          initialContent=""
          onSave={() => {}} 
          placeholder="Escribe un comentario o pega una imagen..."
          cardId={cardId}
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
                disabled={isLoading}
                className="bg-[#6C5DD3] text-white px-4 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50 transition-all hover:bg-[#5a4cb3] active:scale-95 shadow-sm shadow-[#6C5DD3]/20"
              >
                Guardar
              </button>
               <button
                onClick={handleCancel}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm font-bold px-3 transition-colors py-1.5"
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
const ActivityFeedItem: React.FC<{ 
  item: ActivityItem;
  onUpdate?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  cardId?: string;
}> = ({ item, onUpdate, onDelete, cardId }) => {
  const { user: currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const isSystem = item.type === 'SYSTEM_EVENT';
  const isComment = item.type === 'COMMENT';
  const canManage = isComment && currentUser?.id === item.user.id;
  
  // Safe date parsing and formatting
  const dateObj = typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt;
  let relativeDate = formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
  
  relativeDate = relativeDate.replace('alrededor de ', '').replace('casi ', '');

  const handleUpdate = (newHtml: string) => {
    if (newHtml && newHtml !== item.content) {
      const targetId = item.comment?.id || item.commentId || item.id;
      onUpdate?.(targetId, newHtml);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('¿Eliminar este comentario?')) {
      const targetId = item.comment?.id || item.commentId || item.id;
      onDelete?.(targetId);
    }
  };

  return (
    <div className="flex items-start gap-3 mb-6 relative group">
      <div className="shrink-0">
         <UserAvatar 
          name={item.user.name} 
          avatarUrl={item.user.avatarUrl} 
          size="sm"
          className={`ring-2 ring-white dark:ring-[#1C1F26] shadow-sm ${isSystem ? 'opacity-70' : ''}`}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col items-start">
        <div className="w-full flex flex-col items-start">
           <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{item.user.name}</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{relativeDate}</span>
          </div>
                    {isSystem ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-300">
              {item.action || 'ha realizado una acción'}
            </p>
          ) : isEditing ? (
            <div className="w-full mt-1">
              <RichTextEditor
                variant="compact"
                initialContent={item.content || ''}
                onSave={handleUpdate}
                onCancel={handleCancelEdit}
                onUploadSuccess={() => {}} 
                alwaysEditing
                cardId={cardId}
              />
            </div>
          ) : (
             <>
              <div className="text-sm text-zinc-800 dark:text-zinc-100 leading-relaxed break-words prose-mirror-container dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: item.content || '' }} />
              </div>

              {canManage && (
                <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-[#6C5DD3] hover:underline cursor-pointer transition-colors"
                  >
                    Editar
                  </button>
                   <button 
                    onClick={handleDelete}
                    className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:underline cursor-pointer transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Main ActivitySection component.
 */
export const ActivitySection: React.FC<ActivitySectionProps> = ({ 
  activities, 
  onAddComment, 
  onUpdateComment,
  onDeleteComment,
  isLoading,
  hasMore,
  onLoadMore,
  isFetchingMore,
  cardId
}) => {
  const [showAllActivity, setShowAllActivity] = useState(true);

  const filteredActivities = showAllActivity 
    ? activities 
    : activities.filter(item => item.type === 'COMMENT');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
          <MessageSquare size={20} className="text-[#6C5DD3]" />
          <h3 className="text-lg font-extrabold tracking-tight">Actividad</h3>
        </div>
         <button 
          onClick={() => setShowAllActivity(!showAllActivity)}
          className="text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-[#6C5DD3] hover:bg-zinc-100 dark:hover:bg-white/5 px-2 py-1 rounded transition-colors cursor-pointer"
        >
          {showAllActivity ? 'Ocultar detalles' : 'Mostrar detalles'}
        </button>
      </div>

      <CommentInput onAddComment={onAddComment} isLoading={isLoading} cardId={cardId} />
      
      <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
        <AnimatePresence mode="popLayout">
          {filteredActivities.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <ActivityFeedItem 
                item={item} 
                onUpdate={onUpdateComment}
                onDelete={onDeleteComment}
                cardId={cardId}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {hasMore && (
           <button
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className="w-full bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 text-xs font-bold py-3 mt-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-[#6C5DD3] transition-colors flex items-center justify-center gap-2 border border-zinc-200 dark:border-white/5"
          >
            {isFetchingMore ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Cargando...
              </>
            ) : (
              'Cargar actividad anterior'
            )}
          </button>
        )}

         {filteredActivities.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">No hay actividad todavía.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitySection;
