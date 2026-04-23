import React from 'react';
import { Paperclip, FileText, Archive, ExternalLink, Trash2, Link } from 'lucide-react';
import { format } from 'date-fns';

interface Attachment {
  id: string;
  url: string;
  name: string;
  mime?: string;
  sizeBytes?: number;
  createdAt: string | Date;
}

interface AttachmentsSectionProps {
  attachments: Attachment[];
  onDelete: (id: string) => void;
  isReadOnly?: boolean;
}

const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({ attachments, onDelete, isReadOnly }) => {
  if (attachments.length === 0) return null;

  const renderThumbnail = (attachment: Attachment) => {
    const isImageMime = attachment.mime?.startsWith('image/');
    const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(attachment.url);
    const isImage = isImageMime || (attachment.mime === 'link' && isImageUrl);
    
    return (
      <div className="w-16 h-12 bg-zinc-900 rounded overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
        {isImage ? (
          <img 
            src={attachment.url} 
            alt={attachment.name} 
            className="object-cover w-full h-full hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <div className="text-white/80">
            {attachment.mime === 'link' ? (
              <Link size={20} />
            ) : attachment.mime?.includes('pdf') ? (
              <FileText size={20} />
            ) : attachment.mime?.includes('zip') || attachment.mime?.includes('rar') ? (
              <Archive size={20} />
            ) : (
              <FileText size={20} />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-white/5">
      <div className="flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
        <Paperclip size={20} className="text-[#6C5DD3]" />
        <h3 className="text-lg font-extrabold tracking-tight">Adjuntos</h3>
      </div>

      <div className="flex flex-col gap-1">
        {attachments.map((attachment) => (
          <div 
            key={attachment.id} 
            className="group flex items-center gap-4 p-3 rounded border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#13151A] hover:shadow-soft transition-all mb-3 w-fit pr-10 relative overflow-hidden"
          >
            {/* Glossy background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/5 to-transparent pointer-events-none" />
            
            {renderThumbnail(attachment)}

            <div className="flex flex-col min-w-0 z-10">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[240px] group-hover:text-[#6C5DD3] transition-colors">
                {attachment.name}
              </span>
              
              <div className="flex items-center gap-2">
                 <span className="text-[10px] tracking-widest font-black text-zinc-500 dark:text-zinc-400 uppercase">
                  {format(new Date(attachment.createdAt), 'dd/MM/yyyy')}
                </span>
                {attachment.sizeBytes && (
                  <>
                    <span className="w-1 h-1 bg-zinc-200 dark:bg-white/10 rounded" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      {(attachment.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 mt-1.5">
                <a 
                  href={attachment.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold text-[#6C5DD3] hover:underline cursor-pointer group/link"
                >
                  <ExternalLink size={10} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  Ver
                </a>
                
                {!isReadOnly && (
                  <button 
                    onClick={() => onDelete(attachment.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-500 dark:text-rose-400 hover:underline cursor-pointer group/del"
                  >
                    <Trash2 size={10} className="group-hover/del:scale-110 transition-transform" />
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentsSection;
