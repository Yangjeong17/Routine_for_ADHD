import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportJsonPanel, sanitizeFileName, getDateString } from './ExportJsonPanel';

describe('sanitizeFileName', () => {
  it('파일명 불가 문자를 밑줄로 치환한다', () => {
    expect(sanitizeFileName('my/routine')).toBe('my_routine');
    expect(sanitizeFileName('test\\file')).toBe('test_file');
    expect(sanitizeFileName('a:b*c?d"e<f>g|h')).toBe('a_b_c_d_e_f_g_h');
  });

  it('불가 문자가 없으면 원본을 그대로 반환한다', () => {
    expect(sanitizeFileName('normal_routine')).toBe('normal_routine');
    expect(sanitizeFileName('아침 루틴')).toBe('아침 루틴');
  });

  it('빈 문자열을 처리한다', () => {
    expect(sanitizeFileName('')).toBe('');
  });

  it('모든 불가 문자가 포함된 경우 모두 치환한다', () => {
    expect(sanitizeFileName('/\\:*?"<>|')).toBe('_________');
  });
});

describe('getDateString', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('YYYYMMDD 형식으로 날짜를 반환한다', () => {
    vi.setSystemTime(new Date(2025, 5, 15)); // 2025-06-15
    expect(getDateString()).toBe('20250615');
  });

  it('월과 일이 한 자리일 때 0을 패딩한다', () => {
    vi.setSystemTime(new Date(2025, 0, 5)); // 2025-01-05
    expect(getDateString()).toBe('20250105');
  });
});

describe('ExportJsonPanel', () => {
  const defaultProps = {
    isOpen: true,
    jsonContent: '{"routine_name": "test"}',
    routineName: '아침 루틴',
    onClose: vi.fn(),
  };

  it('isOpen이 false이면 렌더링하지 않는다', () => {
    const { container } = render(
      <ExportJsonPanel {...defaultProps} isOpen={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('isOpen이 true이면 패널을 렌더링한다', () => {
    render(<ExportJsonPanel {...defaultProps} />);
    expect(screen.getByText('JSON 내보내기')).toBeDefined();
  });

  it('복사 버튼을 표시한다', () => {
    render(<ExportJsonPanel {...defaultProps} />);
    expect(screen.getByText('복사')).toBeDefined();
  });

  it('다운로드 버튼을 표시한다', () => {
    render(<ExportJsonPanel {...defaultProps} />);
    expect(screen.getByText('다운로드')).toBeDefined();
  });

  it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
    const onClose = vi.fn();
    render(<ExportJsonPanel {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('닫기'));
    expect(onClose).toHaveBeenCalled();
  });

  it('다운로드 버튼 클릭 시 Blob URL을 생성하고 다운로드를 실행한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15)); // 2025-06-15

    const createObjectURLMock = vi.fn(() => 'blob:http://localhost/fake-url');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    let downloadFileName = '';
    let clickCalled = false;

    render(<ExportJsonPanel {...defaultProps} />);

    // render 이후에 appendChild를 모킹하여 다운로드 <a> 태그만 캡처
    const originalAppendChild = document.body.appendChild.bind(document.body);
    const originalRemoveChild = document.body.removeChild.bind(document.body);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement && node.download) {
        downloadFileName = node.download;
        node.click = () => { clickCalled = true; };
        node.click();
        return node;
      }
      return originalAppendChild(node);
    });
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement && node.download) {
        return node;
      }
      return originalRemoveChild(node);
    });

    fireEvent.click(screen.getByText('다운로드'));

    // Blob URL 생성 확인
    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));

    // click 호출 확인
    expect(clickCalled).toBe(true);

    // 파일명 확인
    expect(downloadFileName).toBe('아침 루틴_20250615.json');

    // 리소스 정리 확인
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/fake-url');

    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('routineName에 불가 문자가 있으면 파일명에서 밑줄로 치환된다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15));

    const createObjectURLMock = vi.fn(() => 'blob:http://localhost/fake-url');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    let downloadFileName = '';

    render(
      <ExportJsonPanel
        {...defaultProps}
        routineName="my/routine:test"
      />
    );

    const originalAppendChild = document.body.appendChild.bind(document.body);
    const originalRemoveChild = document.body.removeChild.bind(document.body);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement && node.download) {
        downloadFileName = node.download;
        node.click = () => {};
        node.click();
        return node;
      }
      return originalAppendChild(node);
    });
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement && node.download) {
        return node;
      }
      return originalRemoveChild(node);
    });

    fireEvent.click(screen.getByText('다운로드'));

    expect(downloadFileName).toBe('my_routine_test_20250615.json');

    vi.restoreAllMocks();
    vi.useRealTimers();
  });
});
