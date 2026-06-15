import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportPanel } from './ImportPanel';

// fileParser 모듈 모킹
vi.mock('../utils/fileParser', () => ({
  parseFile: vi.fn(),
}));

import { parseFile } from '../utils/fileParser';

const mockedParseFile = vi.mocked(parseFile);

describe('ImportPanel', () => {
  const defaultProps = {
    isOpen: true,
    onImport: vi.fn(() => ({ success: true })),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('isOpen이 false이면 렌더링하지 않는다', () => {
      const { container } = render(
        <ImportPanel {...defaultProps} isOpen={false} />
      );
      expect(container.innerHTML).toBe('');
    });

    it('isOpen이 true이면 패널을 렌더링한다', () => {
      render(<ImportPanel {...defaultProps} />);
      expect(screen.getByText('가져오기')).toBeDefined();
    });
  });

  describe('탭 전환 동작', () => {
    it('기본 탭은 "파일" 탭이다', () => {
      render(<ImportPanel {...defaultProps} />);
      const fileTab = screen.getByText('파일');
      // 파일 탭이 활성 상태 (border-blue-600 클래스 포함)
      expect(fileTab.className).toContain('border-blue-600');
    });

    it('"텍스트" 탭 클릭 시 텍스트 입력 영역이 표시된다', () => {
      render(<ImportPanel {...defaultProps} />);
      fireEvent.click(screen.getByText('텍스트'));

      // 텍스트 탭이 활성 상태
      const textTab = screen.getByText('텍스트');
      expect(textTab.className).toContain('border-blue-600');

      // 텍스트 입력 안내 문구 표시
      expect(screen.getByText('루틴 JSON 데이터를 아래에 붙여넣으세요.')).toBeDefined();
    });

    it('"파일" 탭 클릭 시 드롭존 영역이 표시된다', () => {
      render(<ImportPanel {...defaultProps} />);
      // 먼저 텍스트 탭으로 전환
      fireEvent.click(screen.getByText('텍스트'));
      // 다시 파일 탭으로 전환
      fireEvent.click(screen.getByText('파일'));

      expect(screen.getByText('.json 또는 .txt 파일을 드래그하여 놓으세요')).toBeDefined();
    });

    it('탭 전환 시 오류 메시지가 초기화된다', () => {
      render(<ImportPanel {...defaultProps} />);

      // 텍스트 탭에서 빈 텍스트로 가져오기 시도하여 오류 발생
      fireEvent.click(screen.getByText('텍스트'));
      defaultProps.onImport.mockReturnValueOnce({ success: false, error: '파싱 오류' });
      fireEvent.click(screen.getByRole('button', { name: '가져오기' }));
      expect(screen.getByText('파싱 오류')).toBeDefined();

      // 파일 탭으로 전환하면 오류 사라짐
      fireEvent.click(screen.getByText('파일'));
      expect(screen.queryByText('파싱 오류')).toBeNull();
    });
  });

  describe('파일 드롭 처리', () => {
    it('드래그 진입 시 isDragOver 하이라이트가 표시된다', () => {
      render(<ImportPanel {...defaultProps} />);
      const dropZone = screen.getByText('.json 또는 .txt 파일을 드래그하여 놓으세요').closest('div[class*="border-dashed"]')!;

      fireEvent.dragEnter(dropZone, {
        dataTransfer: { files: [] },
      });

      // 하이라이트 상태: border-blue-500, bg-blue-50
      expect(dropZone.className).toContain('border-blue-500');
      expect(dropZone.className).toContain('bg-blue-50');
    });

    it('드래그 오버 시 하이라이트가 유지된다', () => {
      render(<ImportPanel {...defaultProps} />);
      const dropZone = screen.getByText('.json 또는 .txt 파일을 드래그하여 놓으세요').closest('div[class*="border-dashed"]')!;

      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [] },
      });

      expect(dropZone.className).toContain('border-blue-500');
    });

    it('드래그 리브 시 하이라이트가 제거된다', () => {
      render(<ImportPanel {...defaultProps} />);
      const dropZone = screen.getByText('.json 또는 .txt 파일을 드래그하여 놓으세요').closest('div[class*="border-dashed"]')!;

      // 먼저 드래그 진입
      fireEvent.dragEnter(dropZone, {
        dataTransfer: { files: [] },
      });
      expect(dropZone.className).toContain('border-blue-500');

      // 드래그 리브
      fireEvent.dragLeave(dropZone, {
        dataTransfer: { files: [] },
      });

      // 하이라이트 제거: border-gray-300으로 복귀
      expect(dropZone.className).toContain('border-gray-300');
    });

    it('파일 드롭 시 첫 번째 파일만 처리한다', async () => {
      mockedParseFile.mockResolvedValue({ success: true, jsonString: '{"test": true}' });

      render(<ImportPanel {...defaultProps} />);
      const dropZone = screen.getByText('.json 또는 .txt 파일을 드래그하여 놓으세요').closest('div[class*="border-dashed"]')!;

      const file1 = new File(['{"test": true}'], 'routine1.json', { type: 'application/json' });
      const file2 = new File(['{"test": false}'], 'routine2.json', { type: 'application/json' });

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file1, file2],
        },
      });

      await waitFor(() => {
        // parseFile이 첫 번째 파일로만 호출됨
        expect(mockedParseFile).toHaveBeenCalledTimes(1);
        expect(mockedParseFile).toHaveBeenCalledWith(file1);
      });
    });

    it('파일 드롭 후 isDragOver가 false로 리셋된다', () => {
      mockedParseFile.mockResolvedValue({ success: true, jsonString: '{}' });

      render(<ImportPanel {...defaultProps} />);
      const dropZone = screen.getByText('.json 또는 .txt 파일을 드래그하여 놓으세요').closest('div[class*="border-dashed"]')!;

      // 드래그 진입
      fireEvent.dragEnter(dropZone, { dataTransfer: { files: [] } });
      expect(dropZone.className).toContain('border-blue-500');

      // 드롭
      const file = new File(['{}'], 'test.json', { type: 'application/json' });
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      // 하이라이트 제거됨
      expect(dropZone.className).toContain('border-gray-300');
    });

    it('파일 파싱 실패 시 오류 메시지를 표시한다', async () => {
      mockedParseFile.mockResolvedValue({ success: false, error: '현재 .json과 .txt 파일만 지원합니다.' });

      render(<ImportPanel {...defaultProps} />);
      const dropZone = screen.getByText('.json 또는 .txt 파일을 드래그하여 놓으세요').closest('div[class*="border-dashed"]')!;

      const file = new File(['data'], 'test.docx', { type: 'application/msword' });
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      await waitFor(() => {
        expect(screen.getByText('현재 .json과 .txt 파일만 지원합니다.')).toBeDefined();
      });
    });
  });

  describe('파일 크기 초과 오류', () => {
    it('10MB 초과 파일 드롭 시 오류 메시지를 표시한다', async () => {
      mockedParseFile.mockResolvedValue({ success: false, error: '파일 크기가 10MB를 초과합니다.' });

      render(<ImportPanel {...defaultProps} />);
      const dropZone = screen.getByText('.json 또는 .txt 파일을 드래그하여 놓으세요').closest('div[class*="border-dashed"]')!;

      // 10MB 초과 파일 시뮬레이션
      const largeFile = new File(['x'], 'large.json', { type: 'application/json' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [largeFile] },
      });

      await waitFor(() => {
        expect(screen.getByText('파일 크기가 10MB를 초과합니다.')).toBeDefined();
      });
    });
  });

  describe('텍스트 탭 가져오기', () => {
    it('텍스트 입력 후 가져오기 버튼 클릭 시 onImport를 호출한다', () => {
      render(<ImportPanel {...defaultProps} />);
      fireEvent.click(screen.getByText('텍스트'));

      const textarea = screen.getByPlaceholderText('{"routine_name": "나의 루틴", "days": [...]}');
      fireEvent.change(textarea, { target: { value: '{"routine_name": "test"}' } });
      fireEvent.click(screen.getByRole('button', { name: '가져오기' }));

      expect(defaultProps.onImport).toHaveBeenCalledWith('{"routine_name": "test"}');
    });

    it('텍스트 가져오기 실패 시 오류 메시지를 표시한다', () => {
      defaultProps.onImport.mockReturnValueOnce({ success: false, error: 'JSON 형식이 올바르지 않습니다.' });

      render(<ImportPanel {...defaultProps} />);
      fireEvent.click(screen.getByText('텍스트'));

      const textarea = screen.getByPlaceholderText('{"routine_name": "나의 루틴", "days": [...]}');
      fireEvent.change(textarea, { target: { value: 'invalid json' } });
      fireEvent.click(screen.getByRole('button', { name: '가져오기' }));

      expect(screen.getByText('JSON 형식이 올바르지 않습니다.')).toBeDefined();
    });
  });

  describe('패널 닫기', () => {
    it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
      const onClose = vi.fn();
      render(<ImportPanel {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('닫기'));
      expect(onClose).toHaveBeenCalled();
    });

    it('배경 오버레이 클릭 시 onClose를 호출한다', () => {
      const onClose = vi.fn();
      render(<ImportPanel {...defaultProps} onClose={onClose} />);
      // 배경 오버레이는 최상위 fixed div
      const overlay = screen.getByText('가져오기').closest('.fixed')!;
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
