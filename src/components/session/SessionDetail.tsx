import { useSessionStore } from '../../stores/sessionStore';
import { MessageSquare, Clock, Folder } from 'lucide-react';

export function SessionDetail() {
  const { selectedSession } = useSessionStore();

  if (!selectedSession) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-claude-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-claude-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-12 h-12 text-claude-400" />
          </div>
          <h2 className="text-xl font-semibold text-claude-700 mb-2">选择一个会话查看详情</h2>
          <p className="text-claude-500">从左侧列表中选择或导入新的历史记录</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return `${days} 天前`;
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-claude-50">
      {/* Session Header */}
      <div className="bg-white border-b border-claude-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-claude-900 mb-2">
              会话 {selectedSession.session_id.slice(0, 8)}...
            </h2>
            <div className="flex items-center gap-4 text-sm text-claude-600">
              <div className="flex items-center gap-1">
                <Folder className="w-4 h-4" />
                <span className="font-mono text-xs">{selectedSession.project_path}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatRelativeTime(selectedSession.updated_at)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
              {selectedSession.prompt_count} 条提示
            </span>
          </div>
        </div>
      </div>

      {/* Prompts List */}
      <div className="p-6 space-y-4">
        {selectedSession.prompts?.map((prompt, index) => (
          <div
            key={prompt.id}
            className="bg-white rounded-lg border border-claude-200 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-claude-900 whitespace-pre-wrap">{prompt.display}</div>
                <div className="mt-2 text-xs text-claude-500">
                  {formatDate(prompt.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {(!selectedSession.prompts || selectedSession.prompts.length === 0) && (
          <div className="text-center py-12 text-claude-500">
            <p>暂无提示记录</p>
            <p className="text-sm mt-1">点击上方导入按钮加载历史记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
