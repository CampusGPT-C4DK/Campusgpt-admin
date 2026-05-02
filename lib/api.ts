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

const getChatTimeoutMs = (): number => {
  const configured = Number(process.env.NEXT_PUBLIC_CHAT_TIMEOUT_MS);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }
  // Default to 5 minutes for long retrieval/generation flows.
  return 300000;
};

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const rt = localStorage.getItem('refresh_token');
  return rt || null;
};

const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

let refreshPromise: Promise<string | null> | null = null;
const refreshAccessToken = async (): Promise<string | null> => {
  const rt = getRefreshToken();
  if (!rt) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await api.post<AuthResponse>(
        '/api/auth/refresh',
        { refresh_token: rt },
        { headers: { Authorization: '' } as any }
      );
      const data = response.data;
      if (typeof window !== 'undefined') {
        if (data.access_token) localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data.access_token || null;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const api: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000, // 60 seconds default timeout (increased from 30s)
  headers: { 'Content-Type': 'application/json' },
});

export interface ExamPartInput {
  bt: string;
  marks: number;
}

export interface ExamQuestionInput {
  unit: string;
  co: string;
  subparts: boolean;
  or_choice: boolean;
  parts: ExamPartInput[];
  or_parts?: ExamPartInput[];
}

export interface ExamPaperGenerateRequest {
  semester: string;
  subject: string;
  exam_type: string;
  questions: ExamQuestionInput[];
}

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

// Response interceptor: Handle 401 and 5xx retry
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest: any = error.config;
    const requestUrl = String(originalRequest?.url || '');
    const isAuthRoute = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/refresh');

    // Auto-refresh once on 401 (access token expired)
    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api.request(originalRequest);
        }
      } catch {
        // refresh failed, clear stale session
        clearAuthSession();
        redirectToLogin();
      }
    }

    // If still unauthorized (or refresh token is missing/invalid), force clean re-login.
    if (status === 401) {
      clearAuthSession();
      if (!isAuthRoute) {
        redirectToLogin();
      }
    }

    // Retry on 5xx errors with exponential backoff (but not for auth routes)
    if (status && status >= 500 && originalRequest && !isAuthRoute) {
      // Get or initialize retry count
      originalRequest._retryCount = originalRequest._retryCount || 0;
      const maxRetries = 3;
      const retryCount = originalRequest._retryCount;

      // Only retry if under max retries
      if (retryCount < maxRetries) {
        originalRequest._retryCount = retryCount + 1;
        // Exponential backoff: 500ms, 1000ms, 2000ms
        const delayMs = Math.pow(2, retryCount) * 500;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return api.request(originalRequest);
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
    try {
      const response = await api.get<DocumentChunksResponse>(
        `/api/admin/documents/${encodeURIComponent(documentId)}/chunks`,
        { params: { skip, limit } }
      );
      return response.data;
    } catch (error) {
      // Some historical/failed documents can exist in UI state without retrievable chunks.
      // Treat backend 404/timeouts as "no chunks" to keep document details page usable.
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 404 || error.code === 'ECONNABORTED')
      ) {
        return {
          total: 0,
          skip,
          limit,
          chunks: [],
        };
      }
      throw error;
    }
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
    timeoutMs: number = getChatTimeoutMs()
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
        throw new Error(
          'Request timed out while waiting for the backend. Please retry, or increase NEXT_PUBLIC_CHAT_TIMEOUT_MS for longer answers.'
        );
      }
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const detail = (error.response?.data as any)?.detail;
        
        // ✅ Handle rate limiting (429)
        if (status === 429) {
          throw new Error(
            '⏱️ Too many requests. Please wait a moment before sending another question.'
          );
        }
        
        // ✅ Handle server errors (5xx)
        if (status && status >= 500) {
          const errorMessage = detail || `Backend error (${status}). Please try again or contact support.`;
          const enhancedError = new Error(errorMessage) as any;
          enhancedError.response = error.response;
          throw enhancedError;
        }
        
        // ✅ Handle other errors with detail messages
        if (typeof detail === 'string' && detail.trim().length > 0) {
          throw new Error(detail);
        }
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
// EXAM PAPER
// ============================================
export const examPaperAPI = {
  generatePaper: async (payload: ExamPaperGenerateRequest): Promise<{ message: string; download: string }> => {
    const response = await api.post('/api/exampaper/generate', payload);
    return response.data;
  },

  health: async (): Promise<{ status: string; service: string; service_url: string }> => {
    const response = await api.get('/api/exampaper/health');
    return response.data;
  },

  downloadPaper: async (): Promise<Blob> => {
    const response = await api.get('/api/exampaper/download', {
      responseType: 'blob',
    });
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
