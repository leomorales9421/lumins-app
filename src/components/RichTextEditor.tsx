import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
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
}

export interface RichTextEditorRef {
  clearContent: () => void;
  getHTML: () => string;
}

const Separator = () => <div className="w-px h-4 bg-[#E8E9EC] mx-1 self-center" />;

const MenuBar = ({ editor, variant }: { editor: any, variant: 'default' | 'compact' }) => {
  if (!editor) {
    return null;
  }

  const isCompact = variant === 'compact';

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('URL de la imagen');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  return (
    <div className={`flex flex-wrap gap-1 border-b border-[#E8E9EC] bg-[#F4F5F7] ${isCompact ? 'p-1' : 'p-2'}`}>
      {/* Grupo 1: Historia - Solo en default */}
      {!isCompact && (
        <>
          <div className="flex gap-1">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded-md text-[#806F9B] hover:bg-white hover:text-[#7A5AF8] transition-colors disabled:opacity-30"
              title="Deshacer"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded-md text-[#806F9B] hover:bg-white hover:text-[#7A5AF8] transition-colors disabled:opacity-30"
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
              className={`p-1.5 rounded-md transition-colors ${
                editor.isActive('heading', { level: 1 }) 
                  ? 'bg-white text-[#7A5AF8] shadow-sm' 
                  : 'text-[#806F9B] hover:bg-white hover:text-[#7A5AF8]'
              }`}
              title="Título 1"
            >
              <Heading1 size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded-md transition-colors ${
                editor.isActive('heading', { level: 2 }) 
                  ? 'bg-white text-[#7A5AF8] shadow-sm' 
                  : 'text-[#806F9B] hover:bg-white hover:text-[#7A5AF8]'
              }`}
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
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('bold') 
              ? 'bg-white text-[#7A5AF8] shadow-sm' 
              : 'text-[#806F9B] hover:bg-white hover:text-[#7A5AF8]'
          }`}
          title="Negrita"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('italic') 
              ? 'bg-white text-[#7A5AF8] shadow-sm' 
              : 'text-[#806F9B] hover:bg-white hover:text-[#7A5AF8]'
          }`}
          title="Cursiva"
        >
          <Italic size={16} />
        </button>
        {!isCompact && (
          <>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded-md transition-colors ${
                editor.isActive('underline') 
                  ? 'bg-white text-[#7A5AF8] shadow-sm' 
                  : 'text-[#806F9B] hover:bg-white hover:text-[#7A5AF8]'
              }`}
              title="Subrayado"
            >
              <UnderlineIcon size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded-md transition-colors ${
                editor.isActive('strike') 
                ? 'bg-white text-[#7A5AF8] shadow-sm' 
                : 'text-[#806F9B] hover:bg-white hover:text-[#7A5AF8]'
              }`}
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
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('bulletList') 
              ? 'bg-white text-[#7A5AF8] shadow-sm' 
              : 'text-[#806F9B] hover:bg-white hover:text-[#7A5AF8]'
          }`}
          title="Lista de viñetas"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('orderedList') 
              ? 'bg-white text-[#7A5AF8] shadow-sm' 
              : 'text-[#806F9B] hover:bg-white hover:text-[#7A5AF8]'
          }`}
          title="Lista numerada"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('codeBlock') 
              ? 'bg-white text-[#7A5AF8] shadow-sm' 
              : 'text-[#806F9B] hover:bg-white hover:text-[#7A5AF8]'
          }`}
          title="Bloque de código"
        >
          <Code size={16} />
        </button>
        {!isCompact && (
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-md transition-colors ${
              editor.isActive('blockquote') 
                ? 'bg-white text-[#7A5AF8] shadow-sm' 
                : 'text-[#806F9B] hover:bg-white hover:text-[#7A5AF8]'
            }`}
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
          <button
            onClick={setLink}
            className={`p-1.5 rounded-md transition-colors ${
              editor.isActive('link') 
                ? 'bg-white text-[#7A5AF8] shadow-sm' 
                : 'text-[#806F9B] hover:bg-white hover:text-[#7A5AF8]'
            }`}
            title="Insertar enlace"
          >
            <LinkIcon size={16} />
          </button>
        )}
        <button
          onClick={addImage}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('image') 
              ? 'bg-white text-[#7A5AF8] shadow-sm' 
              : 'text-[#806F9B] hover:bg-white hover:text-[#7A5AF8]'
          }`}
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
      alert('Error al subir la imagen. Verifica la conexión con el servidor.');
    } finally {
      setIsUploading(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-[#7A5AF8] underline hover:text-[#E91E63] transition-colors cursor-pointer',
          },
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto my-4 border-2 border-[#E9D5FF]/50 shadow-md',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      setHasUnsavedChanges(editor.getHTML() !== initialContent);
    },
    editorProps: {
      attributes: {
        class: `prose-mirror-container focus:outline-none text-zinc-900 ${
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
      editor.commands.setContent(initialContent);
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
      editor.commands.setContent(initialContent);
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
        className="w-full bg-[#F4F5F7] rounded-lg p-3 text-sm text-[#9CA3AF] cursor-pointer hover:bg-[#EAECF0] transition-all min-h-[44px] flex items-center border border-[#E8E9EC]"
      >
        {placeholder}
      </div>
    );
  }

  if (!isEditing && variant === 'default') {
    return (
      <div 
        onClick={() => setIsEditing(true)}
        className="w-full bg-[#F4F5F7] rounded-lg p-5 text-[#374151] cursor-pointer hover:bg-[#EAECF0] transition-all min-h-[100px] border border-[#E8E9EC]"
      >
        {initialContent ? (
          <div 
            className="prose-mirror-container max-w-none text-zinc-900"
            dangerouslySetInnerHTML={{ __html: initialContent }} 
          />
        ) : (
          <p className="text-[#806F9B]">{placeholder}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full bg-[#F4F5F7] rounded-lg border border-[#E8E9EC] focus-within:ring-2 focus-within:ring-[#7A5AF8]/15 focus-within:border-[#7A5AF8]/30 transition-all overflow-hidden relative ${
      isCompact ? '' : ''
    }`}>
      {isUploading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-50 flex items-center justify-center flex-col gap-2">
          <Loader2 size={isCompact ? 24 : 32} className="text-[#7A5AF8] animate-spin" />
          <span className="text-[#7A5AF8] font-bold text-xs">Subiendo...</span>
        </div>
      )}
      
      {hasUnsavedChanges && !isCompact && (
        <div className="bg-[#FFFBEB] border-b border-[#FEF3C7] px-4 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <AlertCircle size={14} className="text-[#D97706]" />
          <span className="text-[10px] font-black text-[#B45309] uppercase tracking-[0.1em]">
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
        <div className="p-3 flex items-center gap-2 border-t border-[#E8E9EC] bg-[#F4F5F7]">
          <button
            onClick={handleSave}
            className="bg-[#7A5AF8] text-white font-bold text-sm px-4 py-2 rounded-[8px] hover:bg-[#694de3] transition-colors shadow-sm disabled:opacity-50"
            disabled={isUploading}
          >
            Guardar
          </button>
          <button
            onClick={handleCancel}
            className="text-[#806F9B] font-bold text-sm px-4 py-2 hover:text-zinc-900 transition-colors"
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
