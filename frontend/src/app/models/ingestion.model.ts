import { User } from "./user.model";

export interface IngestionJob {
  id: string;
  documentIds: string[];
  status: IngestionStatus;
  errorMessage?: string;
  metadata?: any;
  startedAt?: string;
  completedAt?: string;
  createdBy: User;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export enum IngestionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface TriggerIngestionRequest {
  documentIds: string[];
}

export interface QARequest {
  query: string;
  documentIds?: string[];
}

export interface QAResponse {
  query: string;
  answer: string;
  relevantDocuments: string[];
  confidence: number;
}