// ============= AUTH TYPES =============
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'student' | 'super_admin' | 'faculty';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ============= DOCUMENT TYPES =============
export interface Document {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
  file_size?: number;
  file_type?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage?: string;
  progress?: number;
  total_chunks?: number;
  chunks_processed?: number;
  version?: number;
  category?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface DocumentResponse {
  total: number;
  documents: Document[];
}

export interface DocumentProgress {
  document_id: string;
  status: string;
  stage: string;
  progress: number;
  total_chunks: number;
  error?: string;
}

export interface DocumentChunk {
  id: string;
  chunk_index: number;
  content: string;
  word_count: number;
  importance_score: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunksResponse {
  total: number;
  skip: number;
  limit: number;
  chunks: DocumentChunk[];
}

export interface DocumentDetail extends Document {
  chunks?: DocumentChunk[];
}

// ============= CHAT TYPES =============
export interface ChatHistory {
  id: string;
  question: string;
  answer: string;
  document_ids?: string[];
  model_used?: string;
  response_time_ms?: number;
  retrieved_chunks?: Record<string, any>[];
  confidence_score?: number;
  confidence_label?: string;
  created_at: string;
  user_id?: string;
}

export interface ChatHistoryResponse {
  total: number;
  history: ChatHistory[];
}

// ============= ADMIN TYPES =============
export interface AdminStats {
  total_documents: number;
  total_chunks: number;
  total_students: number;
  total_chats: number;
  storage_used_mb?: number;
  avg_response_time_ms?: number;
  system_uptime_percent?: number;
  queries_today?: number;
  active_users_now?: number;
}

export interface SystemStatus {
  database: string;
  cache: string;
  llm_service: string;
}
