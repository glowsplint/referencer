export interface ShareRequest {
  workspaceId: string;
  access: string;
}

export interface ShareResponse {
  code: string;
  url: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWorkspace {
  userId: string;
  workspaceId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  folderId: string | null;
}

export interface WorkspaceFolder {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
}
