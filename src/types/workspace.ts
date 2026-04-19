export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  user: User;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  owner: User;
  members: WorkspaceMember[];
  boards: {
    id: string;
    name: string;
    _count: {
      cards: number;
      members: number;
    }
  }[];
  _count: {
    boards: number;
    members: number;
  };
  createdAt: string;
  updatedAt: string;
}
