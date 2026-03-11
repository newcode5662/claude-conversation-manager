// Session represents a Claude Code CLI session (grouped by sessionId)
export interface Session {
  session_id: string;
  project_path: string;
  created_at: number;
  updated_at: number;
  prompt_count: number;
  is_archived: boolean;
}

// Prompt represents a single user prompt in a session
export interface Prompt {
  id: number;
  session_id: string;
  display: string;
  timestamp: number;
  idx: number;
}

// Extended session with prompts loaded
export interface SessionWithPrompts extends Session {
  prompts?: Prompt[];
}

// CLI History entry from history.jsonl
export interface CliHistoryEntry {
  display: string;
  timestamp: number;
  project: string;
  session_id: string;
}

export interface StatsData {
  totalSessions: number;
  totalPrompts: number;
  uniqueProjects: number;
  sessionsByDate: { date: string; count: number }[];
  promptsByDate: { date: string; count: number }[];
  topProjects: { project: string; count: number }[];
}

export type ViewMode = 'list' | 'stats';

export interface FilterOptions {
  searchQuery: string;
  dateFrom: string | null;
  dateTo: string | null;
  showArchived: boolean;
  sortBy: 'updated' | 'created' | 'project';
  sortOrder: 'asc' | 'desc';
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

// Full conversation message from session file
export interface ConversationMessage {
  uuid: string;
  parent_uuid?: string;
  role: 'user' | 'assistant' | string;
  content: string;
  model?: string;
  timestamp: number;
}
