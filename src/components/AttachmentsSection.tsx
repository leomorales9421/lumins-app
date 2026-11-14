import React, { useState } from 'react';
import {
  Paperclip,
  FileText,
  Archive,
  ExternalLink,
  Trash2,
  Link,
  Video,
  Music,
  Eye,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { GoogleDriveIcon } from './ui/GoogleIcons';

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

function isGoogleDriveAttachment(attachment: Attachment): boolean {
  return (
    Boolean(attachment.mime?.startsWith('gdrive:')) ||
    /drive\.google\.com|docs\.google\.com/i.test(attachment.url)
  );
}

function getGoogleDriveEmbedUrl(url: string): string | null {
  const fileMatch =
    url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!fileMatch) return null;
  const id = fileMatch[1];

  if (url.includes('docs.google.com/document')) {
    return `https://docs.google.com/document/d/${id}/preview`;
  }
  if (url.includes('docs.google.com/spreadsheets')) {
    return `https://docs.google.com/spreadsheets/d/${id}/preview`;
  }
  if (url.includes('docs.google.com/presentation')) {
    return `https://docs.google.com/presentation/d/${id}/preview`;
  }
  return `https://drive.google.com/file/d/${id}/preview`;
}

function getDriveTypeLabel(mime?: string, url?: string): string {
  const cleanMime = (mime || '').replace(/^gdrive:/, '');
  if (cleanMime.includes('document') || url?.includes('/document/')) return 'Google Docs';
  if (cleanMime.includes('spreadsheet') || url?.includes('/spreadsheets/')) return 'Google Sheets';
  if (cleanMime.includes('presentation') || url?.includes('/presentation/')) return 'Google Slides';
  if (cleanMime.startsWith('video/')) return 'Video en Drive';
  if (cleanMime.includes('pdf')) return 'PDF en Drive';
  return 'Google Drive';
}

const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({
  attachments,
  onDelete,
  isReadOnly,
}) => {
  const [previewAttachment, setPreviewAttachment] = useState<{
    name: string;
    embedUrl: string;
    originalUrl: string;
  } | null>(null);

  if (attachments.length === 0) return null;

  const renderThumbnail = (attachment: Attachment) => {
    const isDrive = isGoogleDriveAttachment(attachment);
    if (isDrive) {
      return (
        <div className="w-16 h-12 bg-zinc-900 rounded overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
          <GoogleDriveIcon size={22} />
        </div>
      );
    }

    const isImageMime = attachment.mime?.startsWith('image/');
    const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(attachment.url);
    const isImage = isImageMime || (attachment.mime === 'link' && isImageUrl);

    const isVideoMime = attachment.mime?.startsWith('video/');
    const isVideoUrl =
      /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(attachment.url) ||
      /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(attachment.name);
    const isVideo = isVideoMime || isVideoUrl;

    const isAudioMime = attachment.mime?.startsWith('audio/');
    const isAudioUrl =
      /\.(mp3|wav|ogg|m4a)$/i.test(attachment.url) ||
      /\.(mp3|wav|ogg|m4a)$/i.test(attachment.name);
    const isAudio = isAudioMime || isAudioUrl;

    return (
      <div className="w-16 h-12 bg-zinc-900 rounded overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
        {isImage ? (
          <img
            src={attachment.url}
            alt={attachment.name}
            className="object-cover w-full h-full hover:scale-110 transition-transform duration-500"
          />
        ) : isVideo ? (
          <div className="text-indigo-400">
            <Video size={22} />
          </div>
        ) : isAudio ? (
          <div className="text-violet-400">
            <Music size={22} />
          </div>
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
        {attachments.map(attachment => {
          const isDrive = isGoogleDriveAttachment(attachment);
          const embedUrl = isDrive ? getGoogleDriveEmbedUrl(attachment.url) : null;

          return (
            <div
              key={attachment.id}
              className="group flex items-center gap-4 p-3 rounded border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#13151A] hover:shadow-soft transition-all mb-3 w-fit pr-10 relative overflow-hidden"
            >
              {/* Glossy background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/5 to-transparent pointer-events-none" />

              {renderThumbnail(attachment)}

              <div className="flex flex-col min-w-0 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[240px] group-hover:text-[#6C5DD3] transition-colors">
                    {attachment.name}
                  </span>
                  {isDrive && (
                    <span className="px-1.5 py-0.5 rounded bg-[#6C5DD3]/10 text-[#6C5DD3] dark:text-[#8E82E3] text-[9px] font-extrabold uppercase tracking-wider shrink-0">
                      {getDriveTypeLabel(attachment.mime, attachment.url)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] tracking-widest font-black text-zinc-500 dark:text-zinc-400 uppercase">
                    {format(new Date(attachment.createdAt), 'dd/MM/yyyy')}
                  </span>
                  {attachment.sizeBytes && (
                    <>
                      <span className="w-1 h-1 bg-zinc-200 dark:bg-white/10 rounded" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        {attachment.sizeBytes >= 1024 * 1024
                          ? `${(attachment.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                          : `${(attachment.sizeBytes / 1024).toFixed(1)} KB`}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-1.5">
                  {embedUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewAttachment({
                          name: attachment.name,
                          embedUrl,
                          originalUrl: attachment.url,
                        })
                      }
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      <Eye size={11} />
                      Vista previa
                    </button>
                  )}

                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-bold text-[#6C5DD3] hover:underline cursor-pointer group/link"
                  >
                    <ExternalLink
                      size={10}
                      className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"
                    />
                    {isDrive ? 'Abrir en Drive' : 'Ver'}
                  </a>

                  {!isReadOnly && (
                    <button
                      onClick={() => onDelete(attachment.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-rose-500 dark:text-rose-400 hover:underline cursor-pointer group/del"
                    >
                      <Trash2 size={10} className="group-hover/del:scale-110 transition-transform" />
                      {isDrive ? 'Desvincular' : 'Eliminar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Google Drive Preview Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="w-full max-w-4xl h-[80vh] bg-white dark:bg-[#1C1F26] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between bg-zinc-50 dark:bg-[#13151A]">
              <div className="flex items-center gap-2.5 min-w-0">
                <GoogleDriveIcon size={18} />
                <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                  {previewAttachment.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewAttachment.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#6C5DD3]/10 text-[#6C5DD3] dark:text-[#8E82E3] hover:bg-[#6C5DD3] hover:text-white transition-colors"
                >
                  <span>Abrir en Google Drive</span>
                  <ExternalLink size={12} />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <iframe
              src={previewAttachment.embedUrl}
              title={previewAttachment.name}
              className="w-full flex-1 border-0 bg-zinc-950"
              allow="autoplay; fullscreen"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentsSection;
