import { useState, useRef, useCallback } from 'react';
import { parseFile } from '../utils/fileParser';

interface ImportPanelProps {
  isOpen: boolean;
  onImport: (jsonString: string) => { success: boolean; error?: string };
  onClose: () => void;
}

/**
 * 가져오기 패널 - 파일 드래그앤드롭, 파일 선택, 텍스트 붙여넣기를 통합한 가져오기 UI.
 * 기존 JsonImportPanel을 대체하며, 탭 UI로 "파일" / "텍스트" 섹션을 분리한다.
 */
export function ImportPanel({ isOpen, onImport, onClose }: ImportPanelProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  /** 파일 파싱 후 onImport 호출 */
  async function handleFile(file: File) {
    setError(null);
    const result = await parseFile(file);
    if (!result.success) {
      setError(result.error);
      return;
    }
    const importResult = onImport(result.jsonString);
    if (!importResult.success) {
      setError(importResult.error || '알 수 없는 오류가 발생했습니다');
    } else {
      handleClose();
    }
  }

  /** 텍스트 가져오기 */
  function handleTextImport() {
    setError(null);
    const result = onImport(jsonText);
    if (!result.success) {
      setError(result.error || '알 수 없는 오류가 발생했습니다');
    } else {
      handleClose();
    }
  }

  /** 패널 닫기 시 상태 초기화 */
  function handleClose() {
    setJsonText('');
    setError(null);
    setIsDragOver(false);
    onClose();
  }

  /** 텍스트 변경 시 오류 초기화 */
  function handleTextChange(value: string) {
    setJsonText(value);
    if (error) setError(null);
  }

  // --- 드래그앤드롭 이벤트 핸들러 ---

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  /** 파일 선택 버튼 클릭 */
  function handleFileSelectClick() {
    fileInputRef.current?.click();
  }

  /** 파일 선택 다이얼로그에서 파일 선택 시 */
  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // input 값 초기화 (같은 파일 재선택 가능하도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">가져오기</h2>
        </div>

        {/* 탭 UI */}
        <div className="px-6 pt-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setActiveTab('file'); setError(null); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'file'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              파일
            </button>
            <button
              onClick={() => { setActiveTab('text'); setError(null); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'text'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              텍스트
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-6 py-4 space-y-4">
          {activeTab === 'file' ? (
            <FileTab
              isDragOver={isDragOver}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileSelectClick={handleFileSelectClick}
              fileInputRef={fileInputRef}
              onFileInputChange={handleFileInputChange}
            />
          ) : (
            <TextTab
              jsonText={jsonText}
              onTextChange={handleTextChange}
              error={error}
            />
          )}

          {/* 오류 메시지 */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            닫기
          </button>
          {activeTab === 'text' && (
            <button
              onClick={handleTextImport}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              가져오기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 내부 컴포넌트: FileTab ---

interface FileTabProps {
  isDragOver: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelectClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function FileTab({
  isDragOver,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelectClick,
  fileInputRef,
  onFileInputChange,
}: FileTabProps) {
  return (
    <div className="space-y-4">
      {/* FileDropZone */}
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <svg
            className={`w-10 h-10 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600">
            {isDragOver
              ? '여기에 파일을 놓으세요'
              : '.json 또는 .txt 파일을 드래그하여 놓으세요'}
          </p>
          <p className="text-xs text-gray-400">최대 10MB</p>
        </div>
      </div>

      {/* FileSelectButton */}
      <div className="flex justify-center">
        <button
          onClick={onFileSelectClick}
          className="px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
        >
          파일 선택
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.txt"
          onChange={onFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

// --- 내부 컴포넌트: TextTab ---

interface TextTabProps {
  jsonText: string;
  onTextChange: (value: string) => void;
  error: string | null;
}

function TextTab({ jsonText, onTextChange, error }: TextTabProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
        루틴 JSON 데이터를 아래에 붙여넣으세요.
      </p>
      <textarea
        value={jsonText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder='{"routine_name": "나의 루틴", "days": [...]}'
        rows={12}
        className={`w-full px-3 py-2 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
    </div>
  );
}
