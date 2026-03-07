export interface ShareRequest {
  documentId: string;
  access: string;
  expiresAt?: string | null;
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

export interface UserDocument {
  userId: string;
  documentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  folderId: string | null;
}

export interface DocumentFolder {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}
