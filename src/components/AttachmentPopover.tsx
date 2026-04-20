import React, { useState, useRef } from 'react';
import { X, Link, Upload, Paperclip } from 'lucide-react';

interface AttachmentPopoverProps {
  onClose: () => void;
  onUploadFile: (file: File) => void;
  onAttachLink: (url: string, name: string) => void;
}

const AttachmentPopover: React.FC<AttachmentPopoverProps> = ({ onClose, onUploadFile, onAttachLink }) => {
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
    <div className="w-[340px] bg-white dark:bg-[#1C1F26] rounded-2xl shadow-xl border border-zinc-200 dark:border-white/10 flex flex-col p-4 animate-in fade-in zoom-in duration-200 max-h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 mb-6">
        <h3 className="text-[10px] tracking-[0.3em] font-black text-zinc-500 dark:text-zinc-500 uppercase">
          Adjuntar
        </h3>
        <button 
          onClick={onClose}
          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Section 1: Physical File */}
      <div className="px-2 mb-2">
        <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 mb-1">
          Archivo de ordenador
        </p>
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-4 uppercase tracking-wider">
          Máximo 10MB por archivo
        </p>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-zinc-50/50 dark:bg-black/20 text-[#6C5DD3] dark:text-[#8E82E3] font-bold py-5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all cursor-pointer text-sm text-center border-2 border-dashed border-zinc-200 dark:border-white/5 flex flex-col items-center gap-2 group"
        >
          <div className="w-10 h-10 bg-[#6C5DD3]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload size={20} strokeWidth={2.5} />
          </div>
          <span>Seleccionar archivo</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>

      <div className="px-6 py-4 flex items-center gap-4">
        <div className="h-px flex-1 bg-zinc-100 dark:bg-white/5" />
        <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.3em]">o</span>
        <div className="h-px flex-1 bg-zinc-100 dark:border-white/5" />
      </div>

      {/* Section 2: External Link */}
      <div className="px-2 space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1 block">
            Enlace *
          </label>
          <div className="relative group">
            <Link size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-[#6C5DD3] transition-colors" />
            <input 
              type="text"
              placeholder="Pega un enlace aquí..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-bold w-full outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1 block">
            Nombre del enlace
          </label>
          <input 
            type="text"
            placeholder="Opcional"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            className="bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold w-full outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 mt-8 px-2 pb-2">
        <button 
          onClick={onClose}
          className="text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-4 py-2.5 transition-colors"
        >
          Cancelar
        </button>
        <button 
          onClick={handleInsertLink}
          disabled={!linkUrl.trim()}
          className="bg-[#6C5DD3] hover:bg-[#5a4cb3] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-[#6C5DD3]/20 transition-all disabled:opacity-50 active:scale-95"
        >
          Adjuntar enlace
        </button>
      </div>
    </div>
  );
};

export default AttachmentPopover;
