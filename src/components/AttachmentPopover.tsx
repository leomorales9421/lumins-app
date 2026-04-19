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
    <div className="w-[340px] bg-white rounded-[16px] shadow-dropdown border border-[#E8E9EC] flex flex-col p-4 animate-in fade-in zoom-in duration-200 max-h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] tracking-[0.4em] font-black text-[#806F9B] uppercase">
          Adjuntar
        </h3>
        <button 
          onClick={onClose}
          className="p-1 text-[#806F9B] hover:bg-slate-50 rounded-md transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Section 1: Physical File */}
      <div className="mb-2">
        <p className="text-xs font-bold text-zinc-900 mb-1">
          Adjunta un archivo de tu ordenador
        </p>
        <p className="text-[10px] font-bold text-[#806F9B] mb-3 uppercase tracking-wider">
          También puedes arrastrar y soltar archivos.
        </p>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-[#F4F5F7] text-[#7A5AF8] font-bold py-3 rounded-xl hover:bg-[#EAECF0] transition-all cursor-pointer text-sm text-center border border-dashed border-[#D1D5DB] flex flex-col items-center gap-1 group"
        >
          <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
          <span>Elige un archivo</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>

      <hr className="border-[#E8E9EC] my-6" />

      {/* Section 2: External Link */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-zinc-900 mb-1.5 block">
            Busca o pega un enlace *
          </label>
          <div className="relative">
            <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#806F9B]" />
            <input 
              type="text"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="bg-[#F4F5F7] border border-[#E8E9EC] rounded-lg py-2.5 pl-9 pr-3 text-sm w-full outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 transition-all font-medium text-zinc-800"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-900 mb-1.5 block">
            Texto que se muestra (opcional)
          </label>
          <input 
            type="text"
            placeholder="Nombre del enlace"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            className="bg-[#F4F5F7] border border-[#E8E9EC] rounded-lg py-2.5 px-3 text-sm w-full outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 transition-all font-medium text-zinc-800"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 mt-6">
        <button 
          onClick={onClose}
          className="text-xs font-bold text-[#806F9B] hover:text-zinc-900 px-4 py-2 transition-colors"
        >
          Cancelar
        </button>
        <button 
          onClick={handleInsertLink}
          disabled={!linkUrl.trim()}
          className="bg-[#7A5AF8] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg  hover:bg-[#6948e5] transition-all disabled:opacity-50 active:scale-95"
        >
          Insertar
        </button>
      </div>
    </div>
  );
};

export default AttachmentPopover;
