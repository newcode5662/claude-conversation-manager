import { useState, useRef } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

export function FileImport() {
  const { importHistory } = useSessionStore();
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({ show: false, success: false, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    console.log('[handleFileSelect] File selected:', file.name, 'Size:', file.size);

    const isJsonl = file.name.endsWith('.jsonl') || file.name.endsWith('.jsonlines');
    if (!isJsonl) {
      setImportStatus({
        show: true,
        success: false,
        message: '请选择 Claude Code CLI 的 history.jsonl 文件',
      });
      return;
    }

    try {
      const text = await file.text();
      console.log('[handleFileSelect] File read success, length:', text.length);
      console.log('[handleFileSelect] First 200 chars:', text.substring(0, 200));

      const result = await importHistory(text);
      console.log('[handleFileSelect] Import result:', result);

      setImportStatus({
        show: true,
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        setTimeout(() => {
          setImportStatus((prev) => ({ ...prev, show: false }));
        }, 3000);
      }
    } catch (error) {
      console.error('[handleFileSelect] Error:', error);
      setImportStatus({
        show: true,
        success: false,
        message: '文件读取失败: ' + String(error),
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="file-input"
        type="file"
        accept=".jsonl,.jsonlines"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
        }}
        className="hidden"
      />

      {/* Status Toast */}
      {importStatus.show && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg z-50 ${
            importStatus.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {importStatus.success ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <span className="text-sm font-medium">{importStatus.message}</span>
          <button
            onClick={() => setImportStatus((prev) => ({ ...prev, show: false }))}
            className="ml-2 hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drag Overlay */}
      {isDragging && (
        <div
          className="fixed inset-0 bg-claude-900/50 flex items-center justify-center z-50"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-claude-900">松开以导入文件</h3>
            <p className="text-claude-500 mt-2">支持 Claude Code CLI 的 history.jsonl 文件</p>
          </div>
        </div>
      )}
    </>
  );
}
