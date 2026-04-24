import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import LinkPopover from './LinkPopover';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Code,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
  Underline as UnderlineIcon,
  Image as ImageIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { fixEncoding } from '../lib/encoding';

interface RichTextEditorProps {
  initialContent: string;
  onSave: (html: string) => void;
  onUploadSuccess?: (attachment: any) => void;
  cardId?: string;
  placeholder?: string;
  variant?: 'default' | 'compact';
  onCancel?: () => void;
  autoFocus?: boolean;
  alwaysEditing?: boolean;
  hideFooter?: boolean;
}

export interface RichTextEditorRef {
  clearContent: () => void;
  getHTML: () => string;
}

const Separator = () => <div className="w-px h-4 bg-zinc-200 dark:bg-white/10 mx-1 self-center" />;

const MenuBar = ({ editor, variant }: { editor: any, variant: 'default' | 'compact' }) => {
  if (!editor) {
    return null;
  }

  const isCompact = variant === 'compact';

  const addImage = useCallback(() => {
    const url = window.prompt('URL de la imagen');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const buttonClass = (active: boolean) => `
    p-1.5 rounded transition-all duration-200
    ${active 
      ? 'bg-white dark:bg-white/10 text-[#6C5DD3] shadow-sm' 
      : 'text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-white/5 hover:text-[#6C5DD3] dark:hover:text-zinc-100'}
  `;

  return (
    <div className={`flex flex-wrap gap-1 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 ${isCompact ? 'p-1' : 'p-2'}`}>
      {/* Grupo 1: Historia - Solo en default */}
      {!isCompact && (
        <>
          <div className="flex gap-1">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-white/5 hover:text-[#6C5DD3] dark:hover:text-zinc-100 transition-colors disabled:opacity-30"
              title="Deshacer"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-white/5 hover:text-[#6C5DD3] dark:hover:text-zinc-100 transition-colors disabled:opacity-30"
              title="Rehacer"
            >
              <Redo size={16} />
            </button>
          </div>
          <Separator />
        </>
      )}

      {/* Grupo 2: Títulos - Solo en default */}
      {!isCompact && (
        <>
          <div className="flex gap-1">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={buttonClass(editor.isActive('heading', { level: 1 }))}
              title="Título 1"
            >
              <Heading1 size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={buttonClass(editor.isActive('heading', { level: 2 }))}
              title="Título 2"
            >
              <Heading2 size={16} />
            </button>
          </div>
          <Separator />
        </>
      )}

      {/* Grupo 3: Formato Base */}
      <div className="flex gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={buttonClass(editor.isActive('bold'))}
          title="Negrita"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={buttonClass(editor.isActive('italic'))}
          title="Cursiva"
        >
          <Italic size={16} />
        </button>
        {!isCompact && (
          <>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={buttonClass(editor.isActive('underline'))}
              title="Subrayado"
            >
              <UnderlineIcon size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={buttonClass(editor.isActive('strike'))}
              title="Tachado"
            >
              <Strikethrough size={16} />
            </button>
          </>
        )}
      </div>

      <Separator />

      {/* Grupo 4: Listas y Bloques */}
      <div className="flex gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={buttonClass(editor.isActive('bulletList'))}
          title="Lista de viñetas"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={buttonClass(editor.isActive('orderedList'))}
          title="Lista numerada"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={buttonClass(editor.isActive('codeBlock'))}
          title="Bloque de código"
        >
          <Code size={16} />
        </button>
        {!isCompact && (
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={buttonClass(editor.isActive('blockquote'))}
            title="Cita"
          >
            <Quote size={16} />
          </button>
        )}
      </div>

      <Separator />

      {/* Grupo 5: Extras */}
      <div className="flex gap-1">
        {!isCompact && (
          <LinkPopover
            editor={editor}
            trigger={
              <button
                className={buttonClass(editor.isActive('link'))}
                title="Insertar enlace"
              >
                <LinkIcon size={16} />
              </button>
            }
          />
        )}
        <button
          onClick={addImage}
          className={buttonClass(editor.isActive('image'))}
          title="Insertar imagen"
        >
          <ImageIcon size={16} />
        </button>
      </div>
    </div>
  );
};

const RichTextEditor = React.forwardRef<RichTextEditorRef, RichTextEditorProps>(({ 
  initialContent, 
  onSave,
  onUploadSuccess,
  cardId,
  placeholder = 'Añadir una descripción más detallada...',
  variant = 'default',
  hideFooter = false,
  onCancel,
  autoFocus = false,
  alwaysEditing = false
}, ref) => {
  const [isEditing, setIsEditing] = useState(alwaysEditing);
  const [isUploading, setIsUploading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isCompact = variant === 'compact';

  const uploadImage = async (file: File, view: any, pos?: number) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      if (cardId) {
        formData.append('cardId', cardId);
      }
      formData.append('file', file);

      const response = await apiClient.post<{ success: boolean; url: string; attachment?: any }>('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success) {
        const { schema } = view.state;
        const node = schema.nodes.image.create({ src: response.url });
        
        let tr = view.state.tr;
        if (pos !== undefined) {
          tr = tr.insert(pos, node);
        } else {
          tr = tr.replaceSelectionWith(node);
        }
        
        view.dispatch(tr);

        if (onUploadSuccess && response.attachment) {
          onUploadSuccess(response.attachment);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir imagen', {
        description: 'Verifica la conexión con el servidor.'
      });

    } finally {
      setIsUploading(false);
    }
  };

  const extensions = React.useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Underline.configure({}),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-[#6C5DD3] underline hover:text-[#5244b5] transition-colors cursor-pointer',
      },
    }),
    Image.configure({
      inline: true,
      allowBase64: false,
      HTMLAttributes: {
        class: 'rounded max-w-full h-auto my-4 border-2 border-[#E9D5FF]/50 dark:border-indigo-500/20 shadow-md block mx-auto',
      },
    }),
    Placeholder.configure({
      placeholder,
    }),
  ], [placeholder]);

  const editor = useEditor({
    extensions,
    content: fixEncoding(initialContent),
    autofocus: autoFocus,
    onUpdate: () => {
      setHasUnsavedChanges(true); 
    },
    editorProps: {
      attributes: {
        class: `prose-mirror-container dark:prose-invert focus:outline-none text-zinc-900 dark:text-zinc-100 ${
          isCompact ? 'min-h-[60px] p-2' : 'min-h-[120px] p-4'
        }`,
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image'));

        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            uploadImage(file, view);
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image')) {
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            uploadImage(file, view, coordinates?.pos);
            return true;
          }
        }
        return false;
      },
    },
  });

  React.useImperativeHandle(ref, () => ({
    clearContent: () => {
      if (editor) {
        editor.commands.clearContent();
        setHasUnsavedChanges(false);
      }
    },
    getHTML: () => {
      return editor ? editor.getHTML() : '';
    }
  }));

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML() && !isEditing) {
      editor.commands.setContent(fixEncoding(initialContent));
      setHasUnsavedChanges(false);
    }
  }, [initialContent, editor, isEditing]);

  const handleSave = () => {
    if (editor) {
      const html = editor.getHTML();
      onSave(html);
      setHasUnsavedChanges(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (editor) {
      editor.commands.setContent(fixEncoding(initialContent));
      setHasUnsavedChanges(false);
      setIsEditing(false);
      if (onCancel) onCancel();
    }
  };

  const showAsInput = isCompact && !isEditing;

  if (showAsInput && !initialContent) {
    return (
      <div 
        onClick={() => setIsEditing(true)}
        className="w-full bg-zinc-50 dark:bg-[#13151A] rounded p-3 text-sm text-zinc-400 dark:text-zinc-500 cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#1C1F26] transition-all min-h-[44px] flex items-center border border-zinc-200 dark:border-white/10"
      >
        {placeholder}
      </div>
    );
  }

  if (!isEditing && variant === 'default') {
    return (
      <div 
        onClick={() => setIsEditing(true)}
        className="w-full bg-zinc-50 dark:bg-[#13151A] rounded p-5 text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#1C1F26] transition-all min-h-[100px] border border-zinc-200 dark:border-white/10"
      >
        {initialContent ? (
          <div 
            className="prose-mirror-container dark:prose-invert max-w-none text-zinc-900 dark:text-zinc-100"
            dangerouslySetInnerHTML={{ __html: fixEncoding(initialContent) }} 
          />
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400 italic">{placeholder}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full bg-zinc-50 dark:bg-[#1C1F26] rounded border border-zinc-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-[#6C5DD3]/15 transition-all overflow-hidden relative`}>
      {isUploading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center flex-col gap-2">
          <Loader2 size={isCompact ? 24 : 32} className="text-[#6C5DD3] animate-spin" />
          <span className="text-[#6C5DD3] font-bold text-xs">Subiendo...</span>
        </div>
      )}
      
      {hasUnsavedChanges && !isCompact && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-100 dark:border-amber-500/20 px-4 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />
          <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-[0.1em]">
            Tienes cambios sin guardar
          </span>
        </div>
      )}
      
      <MenuBar editor={editor} variant={variant} />
      
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${
        isCompact ? 'max-h-[200px]' : 'max-h-[400px]'
      }`}>
        <EditorContent editor={editor} />
      </div>

      {!hideFooter && (
        <div className="p-3 flex items-center gap-2 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5">
          <button
            onClick={handleSave}
            disabled={isUploading || (isEditing && !hasUnsavedChanges)}
            className="bg-[#6C5DD3] text-white font-bold text-sm px-4 py-2 rounded hover:bg-[#312e81] transition-colors shadow-lg shadow-[#6C5DD3]/20 disabled:opacity-50"
          >
            {isEditing ? 'Guardar' : 'Comentar'}
          </button>
          <button
            onClick={handleCancel}
            className="text-zinc-500 dark:text-zinc-400 font-bold text-sm px-4 py-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            disabled={isUploading}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
