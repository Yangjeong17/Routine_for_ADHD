import { useState } from 'react';

interface ExportJsonPanelProps {
  isOpen: boolean;
  jsonContent: string;
  routineName: string;  // 파일명 생성용
  onClose: () => void;
}

/**
 * 파일명에 사용할 수 없는 문자(/, \, :, *, ?, ", <, >, |)를 밑줄(_)로 치환한다.
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '_');
}

/**
 * 현재 날짜를 YYYYMMDD 형식으로 반환한다.
 */
export function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * JSON 내보내기 패널 - Pretty_Printer로 변환된 JSON을 표시하고 클립보드 복사 및 파일 다운로드 기능을 제공한다.
 */
export function ExportJsonPanel({ isOpen, jsonContent, routineName, onClose }: ExportJsonPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(jsonContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 API 실패 시 폴백
      try {
        const textarea = document.createElement('textarea');
        textarea.value = jsonContent;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // 폴백도 실패 시 오류 무시
      }
    }
  }

  /**
   * Blob + URL.createObjectURL + <a> 태그 click으로 JSON 파일 다운로드를 실행한다.
   * 파일명: {routine_name}_{YYYYMMDD}.json
   */
  function handleDownload() {
    const sanitizedName = sanitizeFileName(routineName);
    const dateStr = getDateString();
    const fileName = `${sanitizedName}_${dateStr}.json`;

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();

    // 리소스 정리
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">JSON 내보내기</h2>
          {copied && (
            <span className="text-sm text-green-600 font-medium">복사됨!</span>
          )}
        </div>

        {/* 본문 */}
        <div className="px-6 py-4">
          <pre className="w-full px-3 py-3 border border-gray-300 rounded-md text-xs font-mono bg-gray-50 overflow-auto max-h-96 whitespace-pre-wrap break-words">
            {jsonContent}
          </pre>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            다운로드
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            {copied ? '복사됨!' : '복사'}
          </button>
        </div>
      </div>
    </div>
  );
}
