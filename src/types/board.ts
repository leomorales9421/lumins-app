export interface Board {
  id: string;
  name: string;
  description?: string;
  visibility: 'private' | 'team' | 'public';
  createdAt?: string;
  updatedAt?: string;
  starred?: boolean;
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
