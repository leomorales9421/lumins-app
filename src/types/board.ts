export interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  listId: string;
  boardId: string;
  status: 'open' | 'closed';
  priority?: 'P0' | 'P1' | 'P2' | 'P3' | null;
  riskLevel?: 'low' | 'med' | 'high' | null;
  module?: string | null;
  isDone?: boolean;
  startDate?: string | null;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  labels?: Array<{ id: string; name: string; color: string }>;
  commentsCount?: number;
  attachmentsCount?: number;
  assignees?: Array<{ user: { id: string; name: string; email: string; avatarUrl?: string } }>;
  checklists?: Array<{
    id: string;
    items: Array<{ id: string; done: boolean }>;
  }>;
  _count?: {
    comments: number;
    checklists: number;
    attachments: number;
  };
}

export interface List {
  id: string;
  name: string;
  position: number;
  boardId: string;
  cards?: Card[];
}

export interface BoardMember {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  visibility: 'PRIVATE' | 'WORKSPACE';
  backgroundType?: 'PRESET' | 'IMAGE';
  workspaceId: string;
  createdAt?: string;
  updatedAt?: string;
  starred?: boolean;
  ownerId?: string;
  members?: BoardMember[];
  lists?: List[];
  background?: string;
  backgroundImageUrl?: string | null;
  backgroundThumbUrl?: string | null;
  backgroundStorageKey?: string | null;
  backgroundVersion?: number;
  completedCardsCount?: number;
  workspace?: {
    id: string;
    name: string;
  };
  _count?: {
    lists?: number;
    cards?: number;
    labels?: number;
    members?: number;
  };
}

export interface BoardListResponse {
  success: boolean;
  data: {
    boards: Board[];
  };
  message: string;
}

export interface BoardResponse {
  success: boolean;
  data: Board;
  message: string;
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
  visibility: 'PRIVATE' | 'WORKSPACE';
  background?: string;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  visibility?: 'PRIVATE' | 'WORKSPACE';
  background?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
  position: number;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}
