export type Role = 'PARTICIPANT' | 'ADMIN';
export type HackathonStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type TeamRole = 'LEADER' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  emailVerified: boolean;
  image: string | null;
}

export interface Hackathon {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string | null;
  maxTeams: number | null;
  maxTeamSize?: number | null;
  status?: HackathonStatus;
  _count?: { teams: number };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  user: { id: string; name: string | null; email: string };
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  hackathonId: string;
  members: TeamMember[];
}

export interface HackathonDetail extends Hackathon {
  teams: Team[];
}

export interface Submission {
  id: string;
  teamId: string;
  link: string;
  description: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface TeamSubmission {
  teamId: string;
  teamName: string;
  submission: Submission | null;
}

export interface Task {
  id: string;
  hackathonId: string;
  title: string;
  description: string | null;
  order: number;
  createdAt: string;
  completedByMyTeam?: boolean;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  teamId: string;
  completedByUserId: string;
  completedAt: string;
}

export interface ScheduleItem {
  id: string;
  hackathonId: string;
  title: string;
  time: string;
}
