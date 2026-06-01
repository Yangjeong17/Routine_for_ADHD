interface HeaderProps {
  routineName: string;
  saveStatus: 'saved' | 'saving';
  onImportClick: () => void;
  onExportClick: () => void;
}

/**
 * 앱 상단 헤더: 앱 제목, 루틴 이름, Import/Export 버튼, 저장 상태 표시
 */
export default function Header({
  routineName,
  saveStatus,
  onImportClick,
  onExportClick,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-gray-900">주간 루틴 플래너</h1>
        <span className="text-sm text-gray-600 truncate max-w-[200px]">
          {routineName}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`text-xs px-2 py-1 rounded ${
            saveStatus === 'saved'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {saveStatus === 'saved' ? '저장됨' : '저장 중...'}
        </span>

        <button
          type="button"
          onClick={onImportClick}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          가져오기
        </button>

        <button
          type="button"
          onClick={onExportClick}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          내보내기
        </button>
      </div>
    </header>
  );
}
