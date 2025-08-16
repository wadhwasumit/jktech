import { User } from "./user.model";

export interface AppDocument {
  id: string;
  title: string;
  description?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  isIngested: boolean;
  uploadedBy: User;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  file: File;
}