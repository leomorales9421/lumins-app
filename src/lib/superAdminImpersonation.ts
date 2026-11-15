export interface ImpersonatedWorkspaceInfo {
  id: string;
  name?: string;
  ownerName?: string;
  ownerEmail?: string;
}

const STORAGE_KEY = 'lumins_impersonated_workspace';

export const isSystemAdminUser = (user: any): boolean => {
  return user?.globalRole === 'SYSTEM_ADMIN';
};

export const getImpersonatedWorkspace = (): ImpersonatedWorkspaceInfo | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === 'string') {
      return parsed as ImpersonatedWorkspaceInfo;
    }
    return null;
  } catch {
    return null;
  }
};

export const setImpersonatedWorkspace = (info: ImpersonatedWorkspaceInfo): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {
    // Ignorar errores de almacenamiento
  }
};

export const clearImpersonatedWorkspace = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorar errores de almacenamiento
  }
};
