import React, { useState, useRef } from 'react';
import { X, Link, Upload, Info } from 'lucide-react';

interface AttachmentPopoverProps {
  onClose: () => void;
  onUploadFile: (file: File) => void;
  onAttachLink: (url: string, name: string) => void;
  isUploading?: boolean;
  className?: string;
}

const AttachmentPopover: React.FC<AttachmentPopoverProps> = ({ 
  onClose, 
  onUploadFile, 
  onAttachLink,
  isUploading = false,
  className
}) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  const handleInsertLink = () => {
    if (linkUrl.trim()) {
      onAttachLink(linkUrl, linkName);
    }
  };

  return (
    <div className={`bg-white dark:bg-[#1C1F26] flex flex-col p-4 max-h-full overflow-hidden relative ${className || 'w-[360px] rounded-xl shadow-xl border border-zinc-200 dark:border-white/10 animate-in fade-in zoom-in duration-200'}`}>
      {/* Loading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-[#1C1F26]/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#6C5DD3]/20 border-t-[#6C5DD3] rounded-full animate-spin" />
          <p className="text-[10px] font-black text-[#6C5DD3] uppercase tracking-[0.2em]">Cargando...</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-2 mb-4">
        <h3 className="text-[10px] tracking-[0.3em] font-black text-zinc-500 dark:text-zinc-500 uppercase">
          Adjuntar
        </h3>
        <button 
          onClick={onClose}
          disabled={isUploading}
          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded transition-all disabled:opacity-50"
        >
          <X size={16} />
        </button>
      </div>

      {/* Section 1: Physical File */}
      <div className="px-2 mb-2">
        <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 mb-1">
          Archivo de ordenador
        </p>
        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mb-3">
          Archivos hasta 25 MB • Videos máx. 20 MB
        </p>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full bg-zinc-50/50 dark:bg-black/20 text-[#6C5DD3] dark:text-[#8E82E3] font-bold py-5 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/5 transition-all cursor-pointer text-sm text-center border-2 border-dashed border-zinc-200 dark:border-white/5 flex flex-col items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 bg-[#6C5DD3]/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload size={20} strokeWidth={2.5} />
          </div>
          <span>Seleccionar archivo</span>
          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">Imágenes, documentos, audios y videos</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          disabled={isUploading}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
        />

        {/* Tip banner for heavy files */}
        <div className="mt-3 p-2.5 rounded-lg bg-[#6C5DD3]/5 border border-[#6C5DD3]/15 flex items-start gap-2 text-zinc-600 dark:text-zinc-300">
          <Info size={14} className="text-[#6C5DD3] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            ¿Tu video o archivo supera el límite? Súbelo a <strong>Google Drive</strong> o <strong>Dropbox</strong> y pega el enlace abajo.
          </p>
        </div>
      </div>

      <div className="px-6 py-3 flex items-center gap-4">
        <div className="h-px flex-1 bg-zinc-100 dark:bg-white/5" />
        <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.3em]">o</span>
        <div className="h-px flex-1 bg-zinc-100 dark:border-white/5" />
      </div>

      {/* Section 2: External Link */}
      <div className="px-2 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1 block">
            Enlace *
          </label>
          <div className="relative group">
            <Link size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-[#6C5DD3] transition-colors" />
            <input 
              type="text"
              placeholder="Pega un enlace de Drive, Dropbox o web..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              disabled={isUploading}
              className="bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs font-medium w-full outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1 block">
            Nombre del enlace
          </label>
          <input 
            type="text"
            placeholder="Opcional (ej. Video en Google Drive)"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            disabled={isUploading}
            className="bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-lg py-2.5 px-4 text-xs font-medium w-full outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 mt-6 px-2 pb-1">
        <button 
          onClick={onClose}
          disabled={isUploading}
          className="text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-4 py-2 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button 
          onClick={handleInsertLink}
          disabled={!linkUrl.trim() || isUploading}
          className="bg-[#6C5DD3] hover:bg-[#5848C2] text-white px-5 py-2 rounded-lg text-xs font-bold shadow-lg shadow-[#6C5DD3]/20 transition-all disabled:opacity-50 active:scale-95"
        >
          Adjuntar enlace
        </button>
      </div>
    </div>
  );
};

export default AttachmentPopover;
