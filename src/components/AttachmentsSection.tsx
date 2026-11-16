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
  const [showAll, setShowAll] = useState(false);

  if (attachments.length === 0) return null;

  const INITIAL_VISIBLE = 4;
  const hasMore = attachments.length > INITIAL_VISIBLE;
  const visibleAttachments = showAll ? attachments : attachments.slice(0, INITIAL_VISIBLE);

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
          <div className="text-[var(--lumins-accent-fg)]">
            <Video size={22} />
          </div>
        ) : isAudio ? (
          <div className="text-[var(--lumins-accent-fg)]">
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
    <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-white/5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <Paperclip size={16} className="text-[var(--lumins-accent-fg)]" />
          <h3 className="text-sm font-bold tracking-tight">Adjuntos</h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#12A9A8]/12 text-[#0E8786] dark:bg-[#12A9A8]/20 dark:text-[#4ED4D2] tabular-nums">
            {attachments.length}
          </span>
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-xs font-bold text-[#0E8786] dark:text-[#4ED4D2] hover:underline px-2 py-1 rounded-lg hover:bg-[#12A9A8]/10 transition-colors cursor-pointer shrink-0"
          >
            {showAll ? 'Mostrar menos' : `Ver todos (${attachments.length})`}
          </button>
        )}
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${
          showAll ? 'max-h-[340px] overflow-y-auto custom-scrollbar pr-1' : ''
        }`}
      >
        {visibleAttachments.map(attachment => {
          const isDrive = isGoogleDriveAttachment(attachment);
          const embedUrl = isDrive ? getGoogleDriveEmbedUrl(attachment.url) : null;

          return (
            <div
              key={attachment.id}
              className="group flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200/90 dark:border-white/10 bg-white dark:bg-[#13151A] hover:border-[#12A9A8]/50 dark:hover:border-[#4ED4D2]/40 hover:shadow-soft transition-all w-full min-w-0 relative overflow-hidden"
            >
              {/* Glossy background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/5 to-transparent pointer-events-none" />

              {renderThumbnail(attachment)}

              <div className="flex flex-col min-w-0 flex-1 z-10">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    title={attachment.name}
                    className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[var(--lumins-accent-fg)] transition-colors"
                  >
                    {attachment.name}
                  </span>
                  {isDrive && (
                    <span className="px-1.5 py-0.5 rounded bg-[#12A9A8]/12 text-[#0E8786] dark:text-[#4ED4D2] text-[9px] font-extrabold uppercase tracking-wider shrink-0">
                      {getDriveTypeLabel(attachment.mime, attachment.url)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-bold uppercase tracking-wide shrink-0">
                    {format(new Date(attachment.createdAt), 'dd/MM/yyyy')}
                  </span>
                  {attachment.sizeBytes && (
                    <>
                      <span className="w-1 h-1 bg-zinc-300 dark:bg-white/20 rounded-full shrink-0" />
                      <span className="font-semibold uppercase shrink-0">
                        {attachment.sizeBytes >= 1024 * 1024
                          ? `${(attachment.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                          : `${(attachment.sizeBytes / 1024).toFixed(1)} KB`}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-1.5">
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
                      className="inline-flex items-center gap-1 min-h-[28px] sm:min-h-0 text-[11px] font-bold text-[#0E8786] dark:text-[#4ED4D2] hover:underline cursor-pointer"
                    >
                      <Eye size={11} />
                      Vista previa
                    </button>
                  )}

                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 min-h-[28px] sm:min-h-0 text-[11px] font-bold text-[#0E8786] dark:text-[#4ED4D2] hover:underline cursor-pointer group/link"
                  >
                    <ExternalLink
                      size={11}
                      className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"
                    />
                    {isDrive ? 'Abrir' : 'Ver'}
                  </a>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onDelete(attachment.id)}
                      className="inline-flex items-center gap-1 min-h-[28px] sm:min-h-0 text-[11px] font-bold text-[#d6453e] dark:text-[#ff8a84] hover:underline cursor-pointer group/del"
                    >
                      <Trash2 size={11} className="group-hover/del:scale-110 transition-transform" />
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
          className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="w-full max-w-4xl h-[88dvh] sm:h-[80vh] bg-white dark:bg-[#1C1F26] rounded-t-[28px] sm:rounded-2xl shadow-2xl border-t sm:border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col pb-[env(safe-area-inset-bottom)] sm:pb-0"
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
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] hover:bg-[var(--lumins-accent)] hover:text-[var(--lumins-accent-on)] transition-colors"
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
