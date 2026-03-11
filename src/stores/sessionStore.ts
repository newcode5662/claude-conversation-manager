import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Session, Prompt, FilterOptions, ViewMode, StatsData, ConversationMessage } from '../types';

interface SessionState {
  sessions: Session[];
  selectedSession: (Session & { prompts?: Prompt[]; messages?: ConversationMessage[] }) | null;
  selectedIds: Set<string>;
  viewMode: ViewMode;
  filterOptions: FilterOptions;
  isLoading: boolean;
  error: string | null;
  setSessions: (sessions: Session[]) => void;
  selectSession: (session: (Session & { prompts?: Prompt[]; messages?: ConversationMessage[] }) | null) => void;
  loadSession: (sessionId: string) => Promise<void>;
  loadMessages: (sessionId: string) => Promise<ConversationMessage[]>;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  deleteSelected: () => Promise<void>;
  archiveSelected: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  importHistory: (jsonlData: string, filePath?: string) => Promise<{ success: boolean; message: string }>;
  refreshSessions: () => Promise<void>;
  loadStats: () => Promise<StatsData>;
}

const defaultFilterOptions: FilterOptions = {
  searchQuery: '',
  dateFrom: null,
  dateTo: null,
  sortBy: 'updated',
  sortOrder: 'desc',
  showArchived: false,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  selectedSession: null,
  selectedIds: new Set(),
  viewMode: 'list',
  filterOptions: defaultFilterOptions,
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions }),

  selectSession: (session) => set({ selectedSession: session }),

  loadSession: async (sessionId) => {
    try {
      const [prompts, messages] = await Promise.all([
        invoke<Prompt[]>('get_prompts', { sessionId }),
        invoke<ConversationMessage[]>('get_conversation_messages', { sessionId }),
      ]);
      const session = get().sessions.find(s => s.session_id === sessionId);
      if (session) {
        set({ selectedSession: { ...session, prompts, messages } });
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  },

  loadMessages: async (sessionId) => {
    try {
      const messages = await invoke<ConversationMessage[]>('get_conversation_messages', { sessionId });
      return messages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  },

  toggleSelection: (id) =>
    set((state) => {
      const newSelected = new Set(state.selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selectedIds: newSelected };
    }),

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),

  clearSelection: () => set({ selectedIds: new Set() }),

  deleteSelected: async () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;

    try {
      await invoke('delete_sessions', { sessionIds: Array.from(selectedIds) });
      await get().refreshSessions();
      set({
        selectedIds: new Set(),
        selectedSession: null,
      });
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  },

  archiveSelected: async () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;

    try {
      await invoke('archive_sessions', { sessionIds: Array.from(selectedIds) });
      await get().refreshSessions();
      set({ selectedIds: new Set() });
    } catch (error) {
      console.error('Failed to archive:', error);
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setFilterOptions: (options) =>
    set((state) => ({
      filterOptions: { ...state.filterOptions, ...options },
    })),

  importHistory: async (jsonlData: string, filePath?: string) => {
    console.log('[importHistory] Starting import, data length:', jsonlData.length);
    console.log('[importHistory] File path:', filePath);
    console.log('[importHistory] First 200 chars:', jsonlData.substring(0, 200));

    try {
      const imported = await invoke<number>('import_history', {
        jsonlData: jsonlData,
        isCliFormat: true,
        historyFilePath: filePath || null,
      });

      console.log('[importHistory] Success, imported:', imported);
      await get().refreshSessions();

      return {
        success: true,
        message: `成功导入 ${imported} 个会话`,
      };
    } catch (error) {
      console.error('[importHistory] Error:', error);
      console.error('[importHistory] Error type:', typeof error);
      console.error('[importHistory] Error string:', String(error));

      // 尝试提取更多错误信息
      let errorMessage = '未知错误';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }

      return {
        success: false,
        message: `导入失败: ${errorMessage}`,
      };
    }
  },

  refreshSessions: async () => {
    const { filterOptions } = get();
    try {
      const sessions = await invoke<Session[]>('get_sessions', {
        search: filterOptions.searchQuery || null,
        showArchived: filterOptions.showArchived,
        sortBy: filterOptions.sortBy,
        sortOrder: filterOptions.sortOrder,
      });
      set({ sessions });
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  },

  loadStats: async () => {
    try {
      const stats = await invoke<{
        total_sessions: number;
        total_prompts: number;
        unique_projects: number;
        by_date: [string, number][];
      }>('get_stats');

      const dateMap = new Map(stats.by_date);
      const sortedDates = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

      // Group by project for top projects
      const projectMap = new Map<string, number>();
      const sessions = await invoke<Session[]>('get_sessions', {
        search: null,
        showArchived: true,
        sortBy: 'updated',
        sortOrder: 'desc',
      });
      sessions.forEach(s => {
        const count = projectMap.get(s.project_path) || 0;
        projectMap.set(s.project_path, count + 1);
      });

      return {
        totalSessions: stats.total_sessions,
        totalPrompts: stats.total_prompts,
        uniqueProjects: stats.unique_projects,
        sessionsByDate: sortedDates.map(([date, count]) => ({ date, count })),
        promptsByDate: sortedDates.map(([date, count]) => ({ date, count: Math.round(count * 1.5) })),
        topProjects: Array.from(projectMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([project, count]) => ({ project, count })),
      };
    } catch (error) {
      console.error('Failed to load stats:', error);
      return {
        totalSessions: 0,
        totalPrompts: 0,
        uniqueProjects: 0,
        sessionsByDate: [],
        promptsByDate: [],
        topProjects: [],
      };
    }
  },
}));

// Selector for filtered sessions
export const useFilteredSessions = () => {
  const { sessions, filterOptions, refreshSessions } = useSessionStore();

  return {
    sessions: sessions
      .filter((s) => {
        if (filterOptions.dateFrom && s.updated_at < new Date(filterOptions.dateFrom).getTime()) {
          return false;
        }
        if (filterOptions.dateTo && s.updated_at > new Date(filterOptions.dateTo).getTime()) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const order = filterOptions.sortOrder === 'asc' ? 1 : -1;
        switch (filterOptions.sortBy) {
          case 'updated':
            return (a.updated_at - b.updated_at) * order;
          case 'created':
            return (a.created_at - b.created_at) * order;
          case 'project':
            return a.project_path.localeCompare(b.project_path) * order;
          default:
            return 0;
        }
      }),
    refresh: refreshSessions,
  };
};
