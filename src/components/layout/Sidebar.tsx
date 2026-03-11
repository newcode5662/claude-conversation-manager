import { Search, Archive, Folder } from 'lucide-react';
import { useEffect } from 'react';
import { useSessionStore, useFilteredSessions } from '../../stores/sessionStore';

export function Sidebar() {
  const { sessions, refresh } = useFilteredSessions();
  const {
    selectedSession,
    selectSession,
    loadSession,
    selectedIds,
    toggleSelection,
    filterOptions,
    setFilterOptions,
  } = useSessionStore();

  // Initial load and filter change refresh
  useEffect(() => {
    refresh();
  }, [filterOptions.searchQuery, filterOptions.showArchived, filterOptions.sortBy, filterOptions.sortOrder]);

  const handleSelectSession = async (session: typeof selectedSession) => {
    if (session) {
      await loadSession(session.session_id);
    } else {
      selectSession(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 30) return `${days} 天前`;
    return formatDate(timestamp);
  };

  return (
    <aside className="w-80 bg-claude-50 border-r border-claude-200 flex flex-col h-[calc(100vh-64px)]">
      {/* Search & Filters */}
      <div className="p-4 space-y-3 border-b border-claude-200">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-claude-400" />
          <input
            type="text"
            placeholder="搜索项目路径..."
            value={filterOptions.searchQuery}
            onChange={(e) => setFilterOptions({ searchQuery: e.target.value })}
            className="w-full pl-9 pr-4 py-2 bg-white border border-claude-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={`${filterOptions.sortBy}-${filterOptions.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [
                typeof filterOptions.sortBy,
                typeof filterOptions.sortOrder
              ];
              setFilterOptions({ sortBy, sortOrder });
            }}
            className="flex-1 px-3 py-1.5 bg-white border border-claude-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="updated-desc">最近更新</option>
            <option value="updated-asc">最早更新</option>
            <option value="created-desc">最近创建</option>
            <option value="created-asc">最早创建</option>
            <option value="project-asc">项目 A-Z</option>
            <option value="project-desc">项目 Z-A</option>
          </select>

          {/* Archive Toggle */}
          <button
            onClick={() => setFilterOptions({ showArchived: !filterOptions.showArchived })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filterOptions.showArchived
                ? 'bg-claude-900 text-white border-claude-900'
                : 'bg-white text-claude-600 border-claude-200 hover:border-claude-300'
            }`}
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-claude-400">
            <p className="text-sm">没有找到会话</p>
            <p className="text-xs mt-1">导入 Claude Code CLI 的 history.jsonl 开始使用</p>
          </div>
        ) : (
          <ul className="divide-y divide-claude-100">
            {sessions.map((session) => (
              <li
                key={session.session_id}
                className={`group relative hover:bg-white transition-colors cursor-pointer ${
                  selectedSession?.session_id === session.session_id ? 'bg-white' : ''
                }`}
                onClick={() => handleSelectSession(session)}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(session.session_id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelection(session.session_id);
                      }}
                      className="mt-1 w-4 h-4 rounded border-claude-300 text-orange-500 focus:ring-orange-500"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Project Path */}
                      <div className="flex items-center gap-1.5 text-sm text-claude-900">
                        <Folder className="w-3.5 h-3.5 text-claude-400 flex-shrink-0" />
                        <span className="font-mono text-xs truncate" title={session.project_path}>
                          {session.project_path.split('\\').pop() || session.project_path}
                        </span>
                      </div>

                      {/* Session ID */}
                      <p className="mt-1 text-xs text-claude-500 font-mono">
                        {session.session_id.slice(0, 16)}...
                      </p>

                      {/* Stats */}
                      <p className="mt-1 text-xs text-claude-500">
                        {session.prompt_count} 条提示 · {getRelativeTime(session.updated_at)}
                      </p>

                      {session.is_archived && (
                        <span className="inline-flex items-center px-2 py-0.5 mt-2 text-xs font-medium bg-claude-100 text-claude-600 rounded">
                          已归档
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active indicator */}
                {selectedSession?.session_id === session.session_id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-claude-200 bg-claude-100">
        <p className="text-xs text-claude-500">
          共 {sessions.length} 个会话
          {selectedIds.size > 0 && ` · 已选择 ${selectedIds.size} 个`}
        </p>
      </div>
    </aside>
  );
}
