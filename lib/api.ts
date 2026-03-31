import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  DocumentResponse,
  DocumentProgress,
  Document,
  DocumentChunksResponse,
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
  timeout: 60000, // 60 seconds default timeout (increased from 30s)
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
      timeout: 300000, // 5 minutes for large file uploads
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
      timeout: 600000, // 10 minutes for batch uploads (multiple files)
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

  getDocumentChunks: async (
    documentId: string,
    skip = 0,
    limit = 100
  ): Promise<DocumentChunksResponse> => {
    const response = await api.get<DocumentChunksResponse>(
      `/api/admin/documents/${documentId}/chunks`,
      { params: { skip, limit } }
    );
    return response.data;
  },

  updateDocumentChunk: async (
    documentId: string,
    chunkId: string,
    content: string
  ): Promise<any> => {
    const response = await api.put(
      `/api/admin/documents/${documentId}/chunks/${chunkId}`,
      { content }
    );
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

  changeUserRole: async (userId: string, role: string): Promise<any> => {
    const response = await api.patch(`/api/admin/users/${userId}/role`, { role });
    return response.data;
  },

  getUserAccess: async (userId: string): Promise<any> => {
    const response = await api.get(`/api/admin/users/${userId}/access`);
    return response.data;
  },

  updateUserAccess: async (userId: string, features: Record<string, boolean>): Promise<any> => {
    const response = await api.patch(`/api/admin/users/${userId}/access`, { features });
    return response.data;
  },

  registerUser: async (userData: { email: string; full_name: string; password: string; role: string }): Promise<any> => {
    console.log('🌐 [API] registerUser called with:', userData);
    console.log('🌐 [API] Request details:', {
      url: '/api/admin/users/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    try {
      const response = await api.post('/api/admin/users/register', userData);
      console.log('🌐 [API] Response received:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('🌐 [API] Request failed:', {
        status: error.response?.status,
        data: error.response?.data,
        error: error.message
      });
      throw error;
    }
  },

  askQuestion: async (
    question: string,
    category?: string,
    includeSource: boolean = true,
    timeoutMs: number = 120000 // 120 seconds max
  ): Promise<{
    answer: string;
    confidence_score?: number;
    confidence_label?: string;
    response_time_ms?: number;
    sources?: any[];
  }> => {
    try {
      const response = await api.post('/api/chat/ask', 
        {
          question,
          ...(category ? { category } : {}),
          include_sources: includeSource,
        },
        {
          timeout: timeoutMs, // Override timeout for this request
        }
      );
      return response.data;
    } catch (error: any) {
      // Better error handling
      if (error.code === 'ECONNABORTED' || error.message === 'timeout of ' + timeoutMs + 'ms exceeded') {
        throw new Error('Request timeout - Backend is still processing. Please try again.');
      }
      throw error;
    }
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
export const handleApiError = (error: unknown, context?: string): string => {
  let message = '';
  if (axios.isAxiosError(error)) {
    message = error.response?.data?.detail || error.message || 'An error occurred';
  } else {
    message = 'An unexpected error occurred';
  }
  
  // If context provided, prepend it to message
  if (context) {
    return `${context}: ${message}`;
  }
  return message;
};

export default api;
