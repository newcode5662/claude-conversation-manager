import { X, Database, FolderOpen, Info } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-claude-200">
          <h2 className="text-lg font-semibold text-claude-900">设置</h2>
          <button
            onClick={onClose}
            className="p-2 text-claude-500 hover:bg-claude-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* About */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-medium text-claude-900">关于</h3>
            </div>
            <div className="bg-claude-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-claude-700">
                <span className="font-medium">Claude Code CLI 历史管理</span>
              </p>
              <p className="text-xs text-claude-500">
                版本: 0.1.0
              </p>
              <p className="text-xs text-claude-500">
                用于管理 Claude Code CLI 的历史记录
              </p>
            </div>
          </section>

          {/* Storage */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-medium text-claude-900">数据存储</h3>
            </div>
            <div className="bg-claude-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-claude-500 mb-1">数据库位置</p>
                <p className="text-sm text-claude-700 font-mono break-all">
                  %APPDATA%\com.claude-conversation-manager.app
                </p>
              </div>
              <p className="text-xs text-claude-500">
                数据存储在本地 SQLite 数据库中
              </p>
            </div>
          </section>

          {/* Import Info */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-medium text-claude-900">导入说明</h3>
            </div>
            <div className="bg-claude-50 rounded-lg p-4 space-y-2 text-sm text-claude-700">
              <p>支持的文件：</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-claude-600">
                <li>history.jsonl - Claude Code CLI 历史记录</li>
              </ul>
              <p className="text-xs text-claude-500 mt-2">
                文件位置: %USERPROFILE%\.claude\history.jsonl
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-claude-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full py-2 bg-claude-900 text-white rounded-lg text-sm font-medium hover:bg-claude-800 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </>
  );
}
