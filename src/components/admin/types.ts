export interface AdminStats {
  users: number;
  activeUsers: number;
  workspaces: number;
  boards: number;
  cards: number;
  cardsDone: number;
  cardsOpen: number;
  attachments: number;
  storageBytes: number;
  comments: number;
  growth: Array<{
    day: string;
    date: string;
    users: number;
    boards: number;
    cards: number;
  }>;
}

export interface AdminWorkspace {
  id: string;
  name: string;
  description?: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  totalCards?: number;
  _count: {
    members: number;
    boards: number;
  };
  createdAt: string;
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  globalRole: string;
  avatarUrl?: string | null;
  phone?: string | null;
  country?: string | null;
  boardsOwned: number;
  workspacesOwned: number;
  workspacesJoined: number;
  boardMemberships: number;
  attachmentsCount?: number;
  assignedCardsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserSession {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

export interface AdminUserCardEvent {
  id: string;
  type: string;
  payload?: any;
  createdAt: string;
  cardId?: string;
  cardTitle?: string;
  boardId?: string;
  boardName?: string;
  workspaceId?: string;
  workspaceName?: string;
}

export interface AdminUserDetails {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    globalRole: string;
    authProvider?: string;
    avatarUrl?: string | null;
    phone?: string | null;
    country?: string | null;
    language?: string | null;
    theme?: string | null;
    notificationPrefs?: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
  };
  boards: Array<{
    id: string;
    name: string;
    workspaceName: string;
    workspaceId: string;
    role: string;
    membersCount: number;
    cardsCount: number;
    updatedAt: string;
  }>;
  workspaces: Array<{
    id: string;
    name: string;
    role: string;
    membersCount: number;
    boardsCount: number;
  }>;
  guests: Array<{
    id: string;
    name: string;
    email: string;
    boardName: string;
    role: string;
    status: string;
  }>;
  storageBytes: number;
  attachmentsCount: number;
  assignedCardsCount: number;
  completedAssignedCards: number;
  lastLoginAt?: string | null;
  sessions?: AdminUserSession[];
  cardEvents?: AdminUserCardEvent[];
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    resourceId?: string | null;
    ipAddress?: string | null;
    createdAt: string;
    metadata?: any;
  }>;
}

export interface AdminActivityItem {
  id: string;
  type: 'user' | 'board' | 'workspace' | 'card' | 'system';
  action: string;
  actionCode: string;
  target: string;
  resource?: string;
  resourceId?: string | null;
  user: string;
  userId?: string;
  userEmail?: string;
  createdAt: string;
  ipAddress?: string | null;
  metadata?: any;
}

export interface SystemSettingsState {
  integrations: {
    googleDrive: boolean;
    googleCalendar: boolean;
    googleMeet: boolean;
    trelloImport: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    inAppEnabled: boolean;
  };
  platform: {
    allowPublicRegistrations: boolean;
    maintenanceBanner: string;
  };
}

export interface AdminTelemetryData {
  summary: {
    totalSamples: number;
    uniqueBoardsCount: number;
    globalAvgFps: number;
    globalAvgInteractionMs: number;
    totalSlowFrames: number;
  };
  boards: Array<{
    boardId: string;
    boardName: string;
    workspaceName: string;
    avgFps: number;
    minFps: number;
    avgInteractionMs: number;
    maxInteractionMs: number;
    avgCardsCount: number;
    totalSlowFrames: number;
    samplesCount: number;
    lastReportAt: string;
    status: 'critical' | 'warning' | 'healthy';
  }>;
  recentSpikes: Array<{
    id: string;
    boardId: string;
    boardName: string;
    userName: string;
    avgFps: number;
    avgInteractionMs: number;
    slowFrames: number;
    createdAt: string;
  }>;
}

export interface AdminClarityData {
  isConfigured: boolean;
  isCached?: boolean;
  error?: string;
  summary: {
    totalSessions: number;
    distinctUsers: number;
    pagesPerSession: number;
    avgScrollDepth: number;
    engagementTimeSeconds: number;
  };
  frustrations: {
    deadClicks: { count: number; sessionsPct: number };
    rageClicks: { count: number; sessionsPct: number };
    quickBacks: { count: number; sessionsPct: number };
    excessiveScrolling: { count: number; sessionsPct: number };
  };
  errors: {
    scriptErrors: { count: number; sessionsPct: number };
  };
  topPages: Array<{ url: string; sessionsCount: number }>;
  topDevices: Array<{ name: string; sessionsCount: number }>;
  topBrowsers: Array<{ name: string; sessionsCount: number }>;
  topCountries: Array<{ name: string; sessionsCount: number }>;
}

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const parseUserAgentLabel = (ua?: string | null): string => {
  if (!ua) return 'Dispositivo desconocido';
  const os = ua.includes('Windows')
    ? 'Windows'
    : ua.includes('Mac OS') || ua.includes('Macintosh')
      ? 'macOS'
      : ua.includes('Android')
        ? 'Android'
        : ua.includes('iPhone') || ua.includes('iPad')
          ? 'iOS'
          : ua.includes('Linux')
            ? 'Linux'
            : 'Otro SO';
  const browser = ua.includes('Edg/')
    ? 'Edge'
    : ua.includes('Chrome/')
      ? 'Chrome'
      : ua.includes('Firefox/')
        ? 'Firefox'
        : ua.includes('Safari/') && !ua.includes('Chrome/')
          ? 'Safari'
          : 'Navegador';
  return `${os} · ${browser}`;
};
