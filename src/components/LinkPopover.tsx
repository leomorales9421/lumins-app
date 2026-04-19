import React, { useState, useEffect, useRef } from 'react';
import SmartPopover from './SmartPopover';
import { Editor } from '@tiptap/react';

interface LinkPopoverProps {
  editor: Editor;
  trigger: React.ReactNode;
}

const LinkPopover: React.FC<LinkPopoverProps> = ({ editor, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    const selectedText = editor.state.doc.cut(
      editor.state.selection.from,
      editor.state.selection.to
    ).textContent;
    
    setLinkText(selectedText);
    
    // Check if the current selection is a link and pre-fill URL
    const previousUrl = editor.getAttributes('link').href;
    setUrl(previousUrl || '');
    
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!url) return;

    let validatedUrl = url;
    if (!/^https?:\/\//i.test(validatedUrl)) {
      validatedUrl = `https://${validatedUrl}`;
    }

    if (linkText) {
      // Reemplaza la selección (o inserta) con una etiqueta <a> HTML
      editor.chain().focus().insertContent(`<a href="${validatedUrl}">${linkText}</a>`).run();
    } else {
      // Inserta la URL directamente como un enlace
      editor.chain().focus().extendMarkRange('link').setLink({ href: validatedUrl }).insertContent(validatedUrl).run();
    }

    setIsOpen(false);
    setLinkText('');
    setUrl('');
  };

  const handleCancel = () => {
    setIsOpen(false);
    setLinkText('');
    setUrl('');
  };

  const popoverContent = (
    <div className="w-[300px] bg-[#FFFFFF] rounded-xl shadow-[0_4px_20px_rgba(17,24,39,0.1)] border border-zinc-200 p-4 z-50">
      <div className="mb-3">
        <label className="text-xs font-semibold text-zinc-700 mb-1 block">
          Texto a mostrar (opcional)
        </label>
        <input
          type="text"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          placeholder="Ej. Mi Sitio Web"
          className="w-full bg-[#F4F6F9] border border-transparent focus:border-zinc-300 focus:bg-white rounded-lg p-2 text-sm text-[#111827] outline-none transition-all"
        />
      </div>

      <div className="mb-4">
        <label className="text-xs font-semibold text-zinc-700 mb-1 block">
          Enlace *
        </label>
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && url) {
              handleSave();
            }
          }}
          placeholder="https://ejemplo.com"
          className="w-full bg-[#F4F6F9] border border-transparent focus:border-zinc-300 focus:bg-white rounded-lg p-2 text-sm text-[#111827] outline-none transition-all"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={handleCancel}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 px-3 py-1.5"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!url}
          className="bg-[#6C5DD3] text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm hover:bg-[#5244b5] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Guardar
        </button>
      </div>
    </div>
  );

  return (
    <SmartPopover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <div onClick={handleOpen}>
          {trigger}
        </div>
      }
      content={popoverContent}
      placement="bottom-start"
    />
  );
};

export default LinkPopover;
