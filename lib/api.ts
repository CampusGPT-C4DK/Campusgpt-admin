import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  DocumentResponse,
  DocumentProgress,
  Document,
  ChatHistoryResponse,
  ChatHistory,
  AdminStats,
  LoginRequest,
  AuthResponse,
  UserProfile,
} from './types';

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
};

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

const api: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: Add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor: Handle 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTHENTICATION
// ============================================
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },
  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/api/auth/me');
    return response.data;
  },
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/api/auth/logout');
    return response.data;
  },
};

// ============================================
// ADMIN - DOCUMENTS
// ============================================
export const adminAPI = {
  uploadDocument: async (
    file: File, title: string, description: string, category: string
  ): Promise<{ document_id: string; status: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    const response = await api.post('/api/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadBatchDocuments: async (
    files: File[], titles: string[], descriptions?: string[], categories?: string[]
  ): Promise<{
    batch_id: string;
    total_files: number;
    successful: number;
    failed: number;
    results: Array<{ file_index: number; file_name: string; status: string; error?: string }>;
  }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('titles', JSON.stringify(titles));
    formData.append('descriptions', JSON.stringify(descriptions || []));
    formData.append('categories', JSON.stringify(categories || []));
    const response = await api.post('/api/admin/upload-batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getDocuments: async (skip = 0, limit = 10): Promise<DocumentResponse> => {
    const response = await api.get<DocumentResponse>('/api/admin/documents', {
      params: { skip, limit },
    });
    return response.data;
  },

  getDocument: async (documentId: string): Promise<Document> => {
    const response = await api.get<Document>(`/api/admin/documents/${documentId}`);
    return response.data;
  },

  getDocumentProgress: async (documentId: string): Promise<DocumentProgress> => {
    const response = await api.get<DocumentProgress>(`/api/admin/document-progress/${documentId}`);
    return response.data;
  },

  deleteDocument: async (documentId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/api/admin/documents/${documentId}`);
    return response.data;
  },

  getStats: async (): Promise<AdminStats> => {
    const response = await api.get<AdminStats>('/api/admin/stats');
    return response.data;
  },

  getUsers: async (skip = 0, limit = 20): Promise<{ total: number; users: any[] }> => {
    const response = await api.get('/api/admin/users', { params: { skip, limit } });
    return response.data;
  },

  toggleUserStatus: async (userId: string, isActive: boolean): Promise<any> => {
    const response = await api.put(`/api/admin/users/${userId}`, { is_active: isActive });
    return response.data;
  },
};

// ============================================
// CHAT
// ============================================
export const chatAPI = {
  getHistory: async (skip = 0, limit = 20): Promise<ChatHistoryResponse> => {
    const response = await api.get<ChatHistoryResponse>('/api/chat/history', {
      params: { skip, limit },
    });
    return response.data;
  },

  getChat: async (chatId: string): Promise<ChatHistory> => {
    const response = await api.get<ChatHistory>(`/api/chat/history/${chatId}`);
    return response.data;
  },
};

// ============================================
// ERROR HANDLING
// ============================================
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || error.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};

export default api;
