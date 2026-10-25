import type {
  Hackathon,
  HackathonDetail,
  Paginated,
  ScheduleItem,
  Submission,
  Task,
  Team,
  TeamSubmission,
  User,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const NETWORK_ERROR = 'Cannot reach the server. Please check your connection and try again.';
const RETRY_DELAYS_MS = [400, 1200];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Reads are safe to repeat. The session check is a POST but also read only.
function isSafeToRetry(path: string, options: RequestInit) {
  const method = (options.method ?? 'GET').toUpperCase();
  return method === 'GET' || path === '/auth/session';
}

/**
 * fetch() rejects with a TypeError ("Failed to fetch") when the server cannot be reached at all,
 * for example while the backend restarts. Retry safe requests a couple of times before giving up.
 */
async function fetchWithRetry(path: string, options: RequestInit): Promise<Response> {
  const init: RequestInit = {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  };
  const retries = isSafeToRetry(path, options) ? RETRY_DELAYS_MS : [];

  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${API_URL}${path}`, init);
      // A 5xx on a read is usually a momentary backend or database hiccup.
      if (res.status >= 500 && attempt < retries.length) {
        await sleep(retries[attempt]);
        continue;
      }
      return res;
    } catch {
      if (attempt >= retries.length) throw new ApiError(NETWORK_ERROR, 0);
      await sleep(retries[attempt]);
    }
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetchWithRetry(path, options);

  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    throw new ApiError(body?.message ?? `Request failed (${res.status})`, res.status);
  }

  return body as T;
}

export interface SessionResponse {
  user: User;
}

export const api = {
  signUp: (data: { email: string; password: string; name?: string }) =>
    request('/auth/sign-up', { method: 'POST', body: JSON.stringify(data) }),

  signIn: (data: { email: string; password: string }) =>
    request('/auth/sign-in', { method: 'POST', body: JSON.stringify(data) }),

  signOut: () => request('/auth/sign-out', { method: 'POST' }),

  getSession: () => request<SessionResponse | null>('/auth/session', { method: 'POST' }),

  listHackathons: () => request<Paginated<Hackathon>>('/hackathons').then((r) => r.items),

  getHackathon: (id: string) => request<HackathonDetail>(`/hackathons/${id}`),

  listTeams: (hackathonId: string) =>
    request<Paginated<Team>>(`/teams?hackathonId=${encodeURIComponent(hackathonId)}`).then((r) => r.items),

  createTeam: (data: { hackathonId: string; name: string; description?: string }) =>
    request<Team>('/teams', { method: 'POST', body: JSON.stringify(data) }),

  joinTeam: (teamId: string) => request<Team>(`/teams/${teamId}/join`, { method: 'POST' }),

  leaveTeam: (teamId: string) =>
    request<{ success: boolean }>(`/teams/${teamId}/leave`, { method: 'POST' }),

  me: () => request<User>('/users/me'),

  updateProfile: (data: { name?: string }) =>
    request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),

  resendVerificationEmail: (email: string) =>
    request<{ success: boolean }>('/auth/send-verification-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  sendContactMessage: (data: { name: string; email: string; topic: string; message: string }) =>
    request<{ success: boolean }>('/contact', { method: 'POST', body: JSON.stringify(data) }),

  getSubmission: (teamId: string) => request<Submission | null>(`/teams/${teamId}/submission`),

  upsertSubmission: (teamId: string, data: { link: string; description?: string }) =>
    request<Submission>(`/teams/${teamId}/submission`, { method: 'PUT', body: JSON.stringify(data) }),

  listSubmissions: (hackathonId: string) =>
    request<Paginated<TeamSubmission>>(`/hackathons/${hackathonId}/submissions?pageSize=100`).then((r) => r.items),

  listTasks: (hackathonId: string) =>
    request<Paginated<Task>>(`/hackathons/${hackathonId}/tasks?pageSize=100`).then((r) => r.items),

  createTask: (hackathonId: string, data: { title: string; description?: string }) =>
    request<Task>(`/hackathons/${hackathonId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),

  updateTask: (taskId: string, data: { title?: string; description?: string; order?: number }) =>
    request<Task>(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteTask: (taskId: string) => request<{ success: boolean }>(`/tasks/${taskId}`, { method: 'DELETE' }),

  completeTask: (taskId: string) => request(`/tasks/${taskId}/complete`, { method: 'POST' }),

  uncompleteTask: (taskId: string) => request(`/tasks/${taskId}/complete`, { method: 'DELETE' }),

  listSchedule: (hackathonId: string) =>
    request<Paginated<ScheduleItem>>(`/hackathons/${hackathonId}/schedule?pageSize=100`).then((r) => r.items),

  createScheduleItem: (hackathonId: string, data: { title: string; time: string }) =>
    request<ScheduleItem>(`/hackathons/${hackathonId}/schedule`, { method: 'POST', body: JSON.stringify(data) }),

  updateScheduleItem: (id: string, data: { title?: string; time?: string }) =>
    request<ScheduleItem>(`/schedule/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteScheduleItem: (id: string) => request<{ success: boolean }>(`/schedule/${id}`, { method: 'DELETE' }),
};

export { ApiError };
