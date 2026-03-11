import { useState } from 'react';
import { MessageSquare, BarChart3, Trash2, Upload, Settings } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';
import { SettingsPanel } from '../common/SettingsPanel';
import type { ViewMode } from '../../types';

export function Header() {
  const { viewMode, setViewMode, selectedIds, deleteSelected } = useSessionStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems: { mode: ViewMode; label: string; icon: typeof MessageSquare }[] = [
    { mode: 'list', label: '对话列表', icon: MessageSquare },
    { mode: 'stats', label: '统计分析', icon: BarChart3 },
  ];

  return (
    <header className="bg-white border-b border-claude-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-claude-900">
              Claude 对话管理
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-claude-100 text-claude-900'
                    : 'text-claude-600 hover:bg-claude-50 hover:text-claude-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={deleteSelected}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                删除 ({selectedIds.size})
              </button>
            )}
            <button
              onClick={() => document.getElementById('file-input')?.click()}
              className="flex items-center gap-2 px-3 py-2 bg-claude-900 text-white rounded-lg text-sm font-medium hover:bg-claude-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
              导入
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-claude-600 hover:bg-claude-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}
