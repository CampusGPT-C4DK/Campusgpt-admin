/**
 * TAE API Client
 * Handles career guidance and recommendations via TAE (Talent Assessment Engine) model
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const getBaseUrl = () => {
  // Prefer explicit env var. Otherwise, derive from current host (same LAN)
  // so faculty/admin UI works on phone + other devices (not stuck on localhost).
  const env = process.env.NEXT_PUBLIC_TAE_BACKEND_URL;
  if (env) return env;
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:7000`;
  }
  return 'http://localhost:7000';
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

let refreshPromise: Promise<string | null> | null = null;
const refreshAccessToken = async (): Promise<string | null> => {
  const rt = getRefreshToken();
  if (!rt) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) return null;
      const data = await res.json();
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

const taeInstance: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 120000, // 2 minutes for AI processing
});

// Request interceptor: Add JWT token
taeInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Never force JSON content type for FormData uploads.
    // Browser must set multipart boundary automatically.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor: Handle 401
taeInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest: any = error.config;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return taeInstance.request(originalRequest);
        }
      } catch {
        // fall through
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// TAE CAREER GUIDANCE API
// ============================================

export interface CareerGuidanceRequest {
  interests: string[];
  skills: string[];
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  education_level?: string;
  goal?: string;
}

export interface CareerRecommendation {
  career_path: string;
  description: string;
  suitability_score: number; // 0-100
  required_skills: string[];
  skills_gap: string[];
  next_steps: string[];
  resources: {
    courses: string[];
    certifications: string[];
    books: string[];
  };
  job_market_outlook: string;
  average_salary: string;
  top_companies: string[];
}

export interface CareerGuidanceResponse {
  user_id: string;
  assessment_date: string;
  recommendations: CareerRecommendation[];
  overall_assessment: string;
  confidence_score: number;
}

export interface SkillGapAnalysis {
  current_skills: string[];
  target_skills: string[];
  gap: string[];
  learning_path: {
    skill: string;
    estimated_hours: number;
    resources: string[];
  }[];
}

export interface TaeAssignment {
  id: string;
  assignment_no: string;
  subject: string;
  branch: string;
  semester: string;
  difficulty: string;
  given_date: string;
  submission_date: string;
  status: string;
  created_by?: string;
  created_at?: string;
  pdf_url?: string;
  questions?: any[];
}

export interface TaePendingSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: string;
  is_late: boolean;
  days_late: number;
  submitted_at?: string;
  submitted_file_url?: string;
  student_email?: string;
  student_name?: string;
  evaluation?: {
    total_marks?: number;
    marks_obtained?: number;
    percentage?: number;
    grade?: string;
    feedback?: string;
    evaluated_at?: string;
  } | null;
  allow_resubmission?: boolean;
  assignments?: {
    assignment_no?: string;
    subject?: string;
    submission_date?: string;
  };
}

export interface TaeFacultyDashboard {
  status: string;
  assignment_statistics: {
    total_assignments: number;
    active_assignments: number;
    archived_assignments: number;
  };
  submission_statistics: {
    total_submissions: number;
    graded_submissions: number;
    pending_submissions: number;
    late_submissions: number;
  };
  evaluation_metrics: {
    average_marks: number | null;
    average_percentage: number | null;
    total_evaluations: number;
  };
  recent_assignments: TaeAssignment[];
  pending_by_assignment: Record<string, number>;
}

export interface TaeFacultyStudentsPerformance {
  status: string;
  students: Array<{
    student_id: string;
    email: string;
    full_name: string;
    average_percentage: number;
    submission_count: number;
    graded_count: number;
  }>;
  total_students: number;
  statistics: {
    average_score: number;
    highest_score: number;
    lowest_score: number;
    total_submissions: number;
    graded_submissions: number;
  };
}

export const taeAPI = {
  /**
   * Get career guidance based on user's interests and skills
   * Uses TAE model to analyze and provide recommendations
   */
  getCareerGuidance: async (
    request: CareerGuidanceRequest
  ): Promise<CareerGuidanceResponse> => {
    try {
      const response = await taeInstance.post<CareerGuidanceResponse>(
        '/api/career/guidance',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error getting career guidance:', error);
      throw error;
    }
  },

  /**
   * Get skill gap analysis for a specific career path
   */
  analyzeSkillGap: async (
    targetCareer: string,
    currentSkills: string[]
  ): Promise<SkillGapAnalysis> => {
    try {
      const response = await taeInstance.post<SkillGapAnalysis>(
        '/api/career/skill-gap',
        {
          target_career: targetCareer,
          current_skills: currentSkills,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error analyzing skill gap:', error);
      throw error;
    }
  },

  /**
   * Get learning resources for a specific skill or career path
   */
  getLearningResources: async (
    skillOrCareer: string,
    level?: string
  ): Promise<{ courses: any[]; certifications: any[]; books: any[] }> => {
    try {
      const response = await taeInstance.get(
        `/api/career/resources`,
        {
          params: {
            skill_or_career: skillOrCareer,
            level: level || 'intermediate',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting learning resources:', error);
      throw error;
    }
  },

  /**
   * Get job market insights for a career path
   */
  getJobMarketInsights: async (
    careerPath: string
  ): Promise<{
    demand: string;
    growth_rate: number;
    average_salary: string;
    top_locations: string[];
    top_companies: string[];
    job_titles: string[];
  }> => {
    try {
      const response = await taeInstance.get(
        `/api/career/market-insights`,
        {
          params: { career_path: careerPath },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting job market insights:', error);
      throw error;
    }
  },

  /**
   * Get user's career guidance history
   */
  getGuidanceHistory: async (
    limit: number = 10
  ): Promise<CareerGuidanceResponse[]> => {
    try {
      const response = await taeInstance.get<CareerGuidanceResponse[]>(
        '/api/career/guidance-history',
        {
          params: { limit },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting guidance history:', error);
      throw error;
    }
  },

  /**
   * Save/bookmark a career recommendation
   */
  saveRecommendation: async (
    guidanceId: string,
    careerPath: string
  ): Promise<{ saved: boolean }> => {
    try {
      const response = await taeInstance.post<{ saved: boolean }>(
        '/api/career/save-recommendation',
        {
          guidance_id: guidanceId,
          career_path: careerPath,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error saving recommendation:', error);
      throw error;
    }
  },

  /**
   * Get saved recommendations for user
   */
  getSavedRecommendations: async (): Promise<CareerRecommendation[]> => {
    try {
      const response = await taeInstance.get<CareerRecommendation[]>(
        '/api/career/saved-recommendations'
      );
      return response.data;
    } catch (error) {
      console.error('Error getting saved recommendations:', error);
      throw error;
    }
  },

  /**
   * Generate personalized learning plan
   */
  generateLearningPlan: async (
    targetCareer: string,
    currentSkills: string[],
    availableHoursPerWeek: number
  ): Promise<{
    career_path: string;
    duration_weeks: number;
    weekly_hours: number;
    modules: {
      week: number;
      topic: string;
      resources: string[];
      duration_hours: number;
    }[];
  }> => {
    try {
      const response = await taeInstance.post(
        '/api/career/learning-plan',
        {
          target_career: targetCareer,
          current_skills: currentSkills,
          available_hours_per_week: availableHoursPerWeek,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating learning plan:', error);
      throw error;
    }
  },

  /**
   * Set authentication token for API calls
   * (Token is automatically managed in localStorage and injected via interceptor)
   */
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  },

  getFacultyDashboard: async (): Promise<TaeFacultyDashboard> => {
    const response = await taeInstance.get<TaeFacultyDashboard>('/dashboard/faculty-dashboard');
    return response.data;
  },

  getFacultyStudentsPerformance: async (): Promise<TaeFacultyStudentsPerformance> => {
    const response = await taeInstance.get<TaeFacultyStudentsPerformance>('/dashboard/faculty-students-performance');
    return response.data;
  },

  getMyAssignments: async (): Promise<{ status: string; count: number; data: TaeAssignment[] }> => {
    const response = await taeInstance.get('/teacher/my-assignments');
    return response.data;
  },

  uploadTeacherNotes: async (payload: {
    files: File[];
    difficulty: string;
    assignment_no: string;
    subject: string;
    branch: string;
    semester: string;
    faculty: string;
    given_date: string;
    submission_date: string;
  }): Promise<{
    status: string;
    message: string;
    assignment_id: string;
    pdf_url: string;
    questions?: any[];
    storage_bucket?: string;
    storage_path?: string;
  }> => {
    const form = new FormData();
    payload.files.forEach((file) => form.append('files', file));
    form.append('difficulty', payload.difficulty);
    form.append('assignment_no', payload.assignment_no);
    form.append('subject', payload.subject);
    form.append('branch', payload.branch);
    form.append('semester', payload.semester);
    form.append('faculty', payload.faculty);
    form.append('given_date', payload.given_date);
    form.append('submission_date', payload.submission_date);

    // Let axios/browser set multipart boundary automatically.
    const response = await taeInstance.post('/teacher/upload-notes', form);
    return response.data;
  },

  trackSubmissions: async (assignmentId: string): Promise<{ status: string; count: number; data: any[] }> => {
    const response = await taeInstance.get(`/teacher/track-submissions/${assignmentId}`);
    return response.data;
  },

  deleteAssignment: async (assignmentId: string): Promise<{ status: string; message: string; assignment_id: string }> => {
    const response = await taeInstance.delete(`/teacher/assignments/${assignmentId}`);
    return response.data;
  },

  getAssignment: async (assignmentId: string): Promise<{ status: string; data: TaeAssignment }> => {
    const response = await taeInstance.get(`/teacher/assignments/${assignmentId}`);
    return response.data;
  },

  updateAssignment: async (assignmentId: string, payload: Partial<TaeAssignment>): Promise<{ status: string; message: string; assignment_id: string }> => {
    const response = await taeInstance.patch(`/teacher/assignments/${assignmentId}`, payload);
    return response.data;
  },

  getPendingSubmissions: async (): Promise<{ status: string; count: number; data: TaePendingSubmission[] }> => {
    const response = await taeInstance.get('/evaluation/pending-submissions');
    return response.data;
  },

  getSubmissionForGrading: async (submissionId: string): Promise<any> => {
    const response = await taeInstance.get(`/evaluation/submission/${submissionId}`);
    return response.data;
  },

  gradeSubmission: async (payload: {
    submission_id: string;
    total_marks: number;
    marks_obtained: number;
    grade: string;
    result_status?: 'passed' | 'failed';
    allow_resubmission?: boolean;
    feedback?: string;
    strengths?: string;
    areas_for_improvement?: string;
    model_evaluation?: string;
  }): Promise<any> => {
    const form = new FormData();
    form.append('submission_id', payload.submission_id);
    form.append('total_marks', String(payload.total_marks));
    form.append('marks_obtained', String(payload.marks_obtained));
    form.append('grade', payload.grade);
    if (payload.result_status) {
      form.append('result_status', payload.result_status);
    }
    form.append('allow_resubmission', String(Boolean(payload.allow_resubmission)));
    form.append('feedback', payload.feedback || '');
    form.append('strengths', payload.strengths || '');
    form.append('areas_for_improvement', payload.areas_for_improvement || '');
    form.append('model_evaluation', payload.model_evaluation || '');

    const response = await taeInstance.post('/evaluation/grade-submission', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getAssignmentStats: async (assignmentId: string): Promise<any> => {
    const response = await taeInstance.get(`/evaluation/assignment-stats/${assignmentId}`);
    return response.data;
  },
};
