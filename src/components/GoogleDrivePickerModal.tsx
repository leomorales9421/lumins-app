import React, { useState, useEffect, useRef } from 'react';
import LuminsLogoLoader from './ui/LuminsLogoLoader';
import {
  X,
  Search,
  Upload,
  Check,
  FileText,
  Film,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  Globe,
  Lock,
  Loader2,
  ExternalLink,
  RefreshCw,
  Link as LinkIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api-client';
import { GoogleDriveIcon } from './ui/GoogleIcons';

export interface UserDriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number | null;
  webViewLink: string;
  iconLink?: string | null;
  thumbnailLink?: string | null;
  modifiedTime?: string | null;
  shared: boolean;
  ownerName?: string | null;
}

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  onAttached: (attachment: any) => void;
}

type DriveCategory = 'all' | 'docs' | 'sheets' | 'slides' | 'pdf' | 'video' | 'image';

const CATEGORIES: Array<{ id: DriveCategory; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'docs', label: 'Docs' },
  { id: 'sheets', label: 'Sheets' },
  { id: 'slides', label: 'Slides' },
  { id: 'pdf', label: 'PDF' },
  { id: 'video', label: 'Videos' },
  { id: 'image', label: 'Imágenes' },
];

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return 'Google Doc';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  cardId,
  onAttached,
}) => {
  const navigate = useNavigate();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | undefined>();

  const [activeTab, setActiveTab] = useState<'browse' | 'upload' | 'link'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<DriveCategory>('all');
  const [files, setFiles] = useState<UserDriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UserDriveFileItem | null>(null);
  const [shareWithAnyone, setShareWithAnyone] = useState(true);
  const [isAttaching, setIsAttaching] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');
  const [pasteName, setPasteName] = useState('');
  const [isPastingLink, setIsPastingLink] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    checkStatusAndLoad();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isConnected || activeTab !== 'browse') return;
    const timer = setTimeout(() => {
      fetchDriveFiles(searchQuery, category);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery, category, isConnected, activeTab, isOpen]);

  const checkStatusAndLoad = async () => {
    try {
      setIsCheckingStatus(true);
      const res: any = await apiClient.get('/api/integrations/google-drive/status');
      const payload = res?.status !== undefined ? res : res?.data;
      const connected = Boolean(payload?.status?.connected);
      setIsConnected(connected);
      setConnectedEmail(payload?.status?.accountEmail);

      if (connected) {
        await fetchDriveFiles('', 'all');
      }
    } catch {
      setIsConnected(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const fetchDriveFiles = async (q: string, cat: DriveCategory) => {
    try {
      setIsLoadingFiles(true);
      const res: any = await apiClient.get('/api/integrations/google-drive/files', {
        params: { q: q.trim() || undefined, category: cat },
      });
      const payload = res?.data || res;
      const list = payload?.files || payload?.data?.files || [];
      setFiles(list);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar archivos de Google Drive');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleAttachSelected = async () => {
    if (!selectedFile) return;
    setIsAttaching(true);
    try {
      const res: any = await apiClient.post(
        `/api/integrations/google-drive/cards/${cardId}/attach`,
        {
          fileId: selectedFile.id,
          name: selectedFile.name,
          mimeType: selectedFile.mimeType,
          sizeBytes: selectedFile.sizeBytes,
          webViewLink: selectedFile.webViewLink,
          shareWithAnyone,
        }
      );

      const payload = res?.data || res;
      const attachment = payload?.attachment || payload?.data?.attachment;
      toast.success(`"${selectedFile.name}" vinculado desde Google Drive`);
      onAttached(attachment);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo vincular el archivo de Google Drive');
    } finally {
      setIsAttaching(false);
    }
  };

  const handleUploadFileToDrive = async (file: File) => {
    setIsUploadingToDrive(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('shareWithAnyone', String(shareWithAnyone));

      const res: any = await apiClient.post(
        `/api/integrations/google-drive/cards/${cardId}/upload`,
        formData
      );

      const payload = res?.data || res;
      const attachment = payload?.attachment || payload?.data?.attachment;
      toast.success(`"${file.name}" subido a tu Google Drive y adjuntado a la tarjeta`);
      onAttached(attachment);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Error al subir archivo a tu Google Drive');
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const extractDriveId = (url: string): string | null => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const handleAttachPastedLink = async () => {
    if (!pasteUrl.trim()) return;
    const extractedId = extractDriveId(pasteUrl) || `drive-${Date.now()}`;
    const nameToUse = pasteName.trim() || 'Documento de Google Drive';

    let mimeType = 'application/octet-stream';
    if (pasteUrl.includes('spreadsheets') || pasteUrl.includes('sheets')) {
      mimeType = 'application/vnd.google-apps.spreadsheet';
    } else if (pasteUrl.includes('presentation') || pasteUrl.includes('slides')) {
      mimeType = 'application/vnd.google-apps.presentation';
    } else if (pasteUrl.includes('document') || pasteUrl.includes('docs')) {
      mimeType = 'application/vnd.google-apps.document';
    } else if (pasteUrl.includes('drive.google.com/file/d/')) {
      mimeType = 'gdrive:application/octet-stream';
    }

    setIsPastingLink(true);
    try {
      const res: any = await apiClient.post(
        `/api/integrations/google-drive/cards/${cardId}/attach`,
        {
          fileId: extractedId,
          name: nameToUse,
          mimeType,
          webViewLink: pasteUrl.trim(),
          shareWithAnyone: false,
        }
      );
      const payload = res?.data || res;
      const attachment = payload?.attachment || payload?.data?.attachment;
      toast.success(`"${nameToUse}" vinculado desde Google Drive`);
      onAttached(attachment);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Error al vincular el enlace de Google Drive');
    } finally {
      setIsPastingLink(false);
    }
  };

  const renderFileTypeIcon = (mime: string) => {
    if (mime.includes('spreadsheet') || mime.includes('csv') || mime.includes('excel')) {
      return <FileSpreadsheet size={18} className="text-emerald-500" />;
    }
    if (mime.includes('presentation') || mime.includes('powerpoint')) {
      return <Presentation size={18} className="text-amber-500" />;
    }
    if (mime.includes('video/')) {
      return <Film size={18} className="text-rose-500" />;
    }
    if (mime.includes('image/')) {
      return <ImageIcon size={18} className="text-sky-500" />;
    }
    if (mime.includes('pdf')) {
      return <FileText size={18} className="text-red-500" />;
    }
    return <FileText size={18} className="text-blue-500" />;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1C1F26] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-zinc-50/60 dark:bg-black/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#13151A] border border-zinc-200/80 dark:border-white/10 flex items-center justify-center shadow-xs shrink-0">
              <GoogleDriveIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                Google Drive
              </h3>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {connectedEmail
                  ? `Cuenta vinculada: ${connectedEmail}`
                  : 'Selecciona o sube archivos a tu unidad personal de Google Drive'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {isCheckingStatus ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <LuminsLogoLoader size="xs" />
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              Comprobando conexión con Google Drive...
            </p>
          </div>
        ) : !isConnected ? (
          <div className="p-8 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#6C5DD3]/10 border border-[#6C5DD3]/20 flex items-center justify-center mx-auto">
              <GoogleDriveIcon size={28} />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                Conecta tu Google Drive
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Vincula tu cuenta en <strong>Configuración &gt; Integraciones</strong> para elegir documentos de tu unidad o subir videos y archivos pesados directamente a tu Drive.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/settings/integrations');
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6C5DD3] hover:bg-[#5848C2] shadow-md shadow-[#6C5DD3]/20 transition-all"
              >
                <span>Ir a Configuración &gt; Integraciones</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Tabs */}
            <div className="px-5 pt-3 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between gap-2 bg-zinc-50/30 dark:bg-black/10 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('browse')}
                  className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-colors ${
                    activeTab === 'browse'
                      ? 'border-[#6C5DD3] text-[#6C5DD3] dark:text-[#8E82E3]'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Mi Unidad de Drive
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-colors ${
                    activeTab === 'upload'
                      ? 'border-[#6C5DD3] text-[#6C5DD3] dark:text-[#8E82E3]'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Subir archivo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('link')}
                  className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-colors ${
                    activeTab === 'link'
                      ? 'border-[#6C5DD3] text-[#6C5DD3] dark:text-[#8E82E3]'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Pegar enlace de Drive
                </button>
              </div>

              {activeTab === 'browse' && (
                <button
                  type="button"
                  onClick={() => fetchDriveFiles(searchQuery, category)}
                  disabled={isLoadingFiles}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg"
                  title="Actualizar lista"
                >
                  <RefreshCw size={13} className={isLoadingFiles ? 'animate-spin' : ''} />
                </button>
              )}
            </div>

            {activeTab === 'browse' ? (
              <div className="p-4 flex-1 flex flex-col min-h-0 space-y-3">
                {/* Search + Category Pills */}
                <div className="space-y-2.5 shrink-0">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre en tu Google Drive..."
                      className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#13151A] text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#6C5DD3]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                          category === cat.id
                            ? 'bg-[#6C5DD3] text-white'
                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Files Grid / List */}
                <div className="flex-1 overflow-y-auto min-h-[240px] max-h-[340px] pr-1">
                  {isLoadingFiles ? (
                    <div className="h-56 flex flex-col items-center justify-center gap-2">
                      <Loader2 size={22} className="animate-spin text-[#6C5DD3]" />
                      <span className="text-xs font-semibold text-zinc-400">
                        Cargando tus archivos de Google Drive...
                      </span>
                    </div>
                  ) : files.length === 0 ? (
                    <div className="h-56 flex flex-col items-center justify-center text-center p-4">
                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        {searchQuery ? 'No se encontraron archivos con ese filtro.' : 'No tienes archivos subidos con Lumins aún.'}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">
                        Con el permiso seguro <code>drive.file</code>, puedes subir archivos a tu Drive o vincular cualquier archivo existente pegando su enlace.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setActiveTab('upload')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#6C5DD3] text-white hover:bg-[#5848C2] transition-colors"
                        >
                          Subir archivo nuevo
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('link')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/20 transition-colors"
                        >
                          Pegar enlace de Drive
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {files.map(file => {
                        const isSelected = selectedFile?.id === file.id;
                        return (
                          <button
                            key={file.id}
                            type="button"
                            onClick={() => setSelectedFile(file)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'border-[#6C5DD3] bg-[#6C5DD3]/10 ring-2 ring-[#6C5DD3]/20'
                                : 'border-zinc-200/80 dark:border-white/10 bg-zinc-50/40 dark:bg-[#13151A]/60 hover:border-zinc-300 dark:hover:border-white/20'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200/70 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                              {file.thumbnailLink ? (
                                <img
                                  src={file.thumbnailLink}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                renderFileTypeIcon(file.mimeType)
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-semibold text-zinc-400">
                                <span>{formatFileSize(file.sizeBytes)}</span>
                                {file.modifiedTime && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      {format(new Date(file.modifiedTime), 'dd/MM/yyyy')}
                                    </span>
                                  </>
                                )}
                                <span>•</span>
                                {file.shared ? (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-500">
                                    <Globe size={9} /> Compartido
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                                    <Lock size={9} /> Privado
                                  </span>
                                )}
                              </div>
                            </div>

                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#6C5DD3] text-white flex items-center justify-center shrink-0">
                                <Check size={11} strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'upload' ? (
              /* Upload directly to user's Google Drive */
              <div className="p-6 flex flex-col items-center justify-center space-y-4">
                <button
                  type="button"
                  disabled={isUploadingToDrive}
                  onClick={() => uploadInputRef.current?.click()}
                  className="w-full py-10 px-6 rounded-2xl border-2 border-dashed border-[#6C5DD3]/30 hover:border-[#6C5DD3] bg-[#6C5DD3]/5 hover:bg-[#6C5DD3]/10 transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingToDrive ? (
                    <>
                      <Loader2 size={28} className="animate-spin text-[#6C5DD3]" />
                      <span className="text-xs font-extrabold text-[#6C5DD3]">
                        Subiendo a tu Google Drive y vinculando a la tarjeta...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-[#6C5DD3]/15 text-[#6C5DD3] flex items-center justify-center">
                        <Upload size={22} />
                      </div>
                      <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                        Seleccionar archivo para subir a tu Google Drive
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md text-center">
                        Se guardará en la carpeta <strong>"Lumins - Adjuntos"</strong> de tu Google Drive personal (soporta videos pesados, documentos y comprimidos hasta 200 MB) y quedará adjunto a esta tarjeta.
                      </span>
                    </>
                  )}
                </button>
                <input
                  ref={uploadInputRef}
                  type="file"
                  className="hidden"
                  disabled={isUploadingToDrive}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFileToDrive(file);
                  }}
                />
              </div>
            ) : (
              /* Paste link to ANY Google Drive file */
              <div className="p-6 flex flex-col justify-center space-y-4">
                <div className="bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200/70 dark:border-white/10 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Enlace de Google Drive *
                    </label>
                    <div className="relative">
                      <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="url"
                        value={pasteUrl}
                        onChange={e => setPasteUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/... o https://docs.google.com/..."
                        className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#13151A] text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#6C5DD3]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nombre o título del archivo (opcional)
                    </label>
                    <input
                      type="text"
                      value={pasteName}
                      onChange={e => setPasteName(e.target.value)}
                      placeholder="Ej. Hoja de cálculo Q4, Video de diseño..."
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#13151A] text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#6C5DD3]"
                    />
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Puedes pegar cualquier enlace de archivo, carpeta o documento de Google Drive con acceso compartido.
                  </p>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('browse')}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      disabled={!pasteUrl.trim() || isPastingLink}
                      onClick={handleAttachPastedLink}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#6C5DD3] hover:bg-[#5848C2] shadow-md shadow-[#6C5DD3]/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isPastingLink ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Vinculando...</span>
                        </>
                      ) : (
                        <>
                          <GoogleDriveIcon size={14} />
                          <span>Vincular enlace de Drive</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer with Link Sharing Toggle & Action */}
            <div className="px-5 py-3.5 border-t border-zinc-100 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
              <label
                onClick={() => setShareWithAnyone(!shareWithAnyone)}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    shareWithAnyone
                      ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white'
                      : 'border-zinc-300 dark:border-white/20 bg-white dark:bg-black/20'
                  }`}
                >
                  {shareWithAnyone && <Check size={10} strokeWidth={3} />}
                </div>
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                  Permitir lectura con el enlace para que los miembros del tablero puedan verlo
                </span>
              </label>

              {activeTab === 'browse' && (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!selectedFile || isAttaching}
                    onClick={handleAttachSelected}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#6C5DD3] hover:bg-[#5848C2] shadow-md shadow-[#6C5DD3]/20 disabled:opacity-50 transition-all"
                  >
                    {isAttaching ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Vinculando...</span>
                      </>
                    ) : (
                      <>
                        <GoogleDriveIcon size={14} />
                        <span>Adjuntar archivo</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleDrivePickerModal;
