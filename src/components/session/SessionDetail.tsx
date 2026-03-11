import { useEffect, useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { MessageSquare, Clock, Folder, User, Bot, Brain } from 'lucide-react';
import type { ConversationMessage } from '../../types';

export function SessionDetail() {
  const { selectedSession } = useSessionStore();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSession?.session_id) {
      loadMessages();
    }
  }, [selectedSession?.session_id]);

  const loadMessages = async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const msgs = await useSessionStore.getState().loadMessages(selectedSession.session_id);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Parse content to separate thinking blocks
  const parseContent = (content: string) => {
    const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
    const cleanContent = content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
    return {
      thinking: thinkingMatch ? thinkingMatch[1].trim() : null,
      content: cleanContent,
    };
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-claude-50">
      {/* Session Header */}
      <div className="bg-white border-b border-claude-200 px-6 py-4 sticky top-0 z-10">
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
              {hasMessages ? `${messages.length} 条消息` : `${selectedSession.prompt_count} 条提示`}
            </span>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="p-6 space-y-6">
        {loading && (
          <div className="text-center py-12 text-claude-500">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>加载完整对话中...</p>
          </div>
        )}

        {!loading && hasMessages && messages.map((message, index) => {
          const isUser = message.role === 'user';
          const { thinking, content } = isUser ? { thinking: null, content: message.content } : parseContent(message.content);

          return (
            <div
              key={message.uuid || index}
              className={`flex gap-4 ${isUser ? 'flex-row' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isUser ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className={`rounded-2xl px-4 py-3 ${
                  isUser
                    ? 'bg-orange-50 border border-orange-200'
                    : 'bg-white border border-claude-200 shadow-sm'
                }`}>
                  {/* Role Label */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium ${
                      isUser ? 'text-orange-700' : 'text-blue-700'
                    }`}>
                      {isUser ? '用户' : 'Claude'}
                    </span>
                    {message.model && (
                      <span className="text-xs text-claude-400">· {message.model}</span>
                    )}
                  </div>

                  {/* Thinking Block (for assistant) */}
                  {thinking && (
                    <div className="mb-3 p-3 bg-claude-100 rounded-lg border border-claude-200">
                      <div className="flex items-center gap-1 mb-1 text-claude-500">
                        <Brain className="w-3 h-3" />
                        <span className="text-xs font-medium">思考过程</span>
                      </div>
                      <div className="text-sm text-claude-600 whitespace-pre-wrap">{thinking}</div>
                    </div>
                  )}

                  {/* Main Content */}
                  <div className="text-claude-900 whitespace-pre-wrap">{content || message.content}</div>
                </div>

                {/* Timestamp */}
                <div className="mt-1 text-xs text-claude-400 ml-1">
                  {formatDate(message.timestamp)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Fallback to prompts if no messages loaded */}
        {!loading && !hasMessages && selectedSession.prompts?.map((prompt) => (
          <div
            key={prompt.id}
            className="flex gap-4"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
                <div className="text-xs font-medium text-orange-700 mb-2">用户</div>
                <div className="text-claude-900 whitespace-pre-wrap">{prompt.display}</div>
              </div>
              <div className="mt-1 text-xs text-claude-400 ml-1">
                {formatDate(prompt.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {!loading && !hasMessages && (!selectedSession.prompts || selectedSession.prompts.length === 0) && (
          <div className="text-center py-12 text-claude-500">
            <p>暂无对话记录</p>
            <p className="text-sm mt-1">点击上方导入按钮加载历史记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
