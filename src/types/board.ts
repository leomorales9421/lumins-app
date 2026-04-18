export interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  listId: string;
  boardId: string;
  status: 'open' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  labels?: Array<{ id: string; name: string; color: string }>;
  commentsCount?: number;
  attachmentsCount?: number;
  assignees?: Array<{ user: { id: string; name: string; email: string } }>;
}

export interface List {
  id: string;
  name: string;
  position: number;
  boardId: string;
  cards?: Card[];
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  visibility: 'private' | 'team' | 'public';
  createdAt?: string;
  updatedAt?: string;
  starred?: boolean;
  ownerId?: string;
  lists?: List[];
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
  visibility: 'private' | 'team' | 'public';
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  visibility?: 'private' | 'team' | 'public';
}
