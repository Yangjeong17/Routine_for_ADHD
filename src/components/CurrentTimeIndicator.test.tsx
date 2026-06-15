import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';

describe('CurrentTimeIndicator', () => {
  const TOTAL_HEIGHT = 1440;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('KST 기준 현재 시간 위치에 빨간색 수평선을 렌더링한다', () => {
    // 2024-01-15 UTC 03:30 → KST 12:30 → 750분
    vi.setSystemTime(new Date('2024-01-15T03:30:00Z'));

    render(<CurrentTimeIndicator totalHeight={TOTAL_HEIGHT} />);

    const indicator = screen.getByTestId('current-time-indicator');
    expect(indicator).toBeDefined();

    // top = (750 / 1440) * 1440 = 750px
    expect(indicator.style.top).toBe('750px');
  });

  it('top 위치를 (현재시간_분 / 1440) × totalHeight 공식으로 계산한다', () => {
    // UTC 00:00 → KST 09:00 → 540분
    vi.setSystemTime(new Date('2024-01-15T00:00:00Z'));

    render(<CurrentTimeIndicator totalHeight={TOTAL_HEIGHT} />);

    const indicator = screen.getByTestId('current-time-indicator');
    const expectedTop = (540 / 1440) * TOTAL_HEIGHT;
    expect(indicator.style.top).toBe(`${expectedTop}px`);
  });

  it('1분마다 위치를 업데이트한다', () => {
    // UTC 00:00 → KST 09:00 → 540분
    vi.setSystemTime(new Date('2024-01-15T00:00:00Z'));

    render(<CurrentTimeIndicator totalHeight={TOTAL_HEIGHT} />);

    const indicator = screen.getByTestId('current-time-indicator');
    expect(indicator.style.top).toBe(`${(540 / 1440) * TOTAL_HEIGHT}px`);

    // 1분 경과: setSystemTime으로 시간을 설정한 후 advanceTimersByTime으로 interval 트리거
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    // advanceTimersByTime이 시간을 1분 진행시키므로 KST 09:01 → 541분
    const expectedTop = (541 / 1440) * TOTAL_HEIGHT;
    expect(indicator.style.top).toBe(`${expectedTop}px`);
  });

  it('컴포넌트 언마운트 시 interval을 정리한다', () => {
    vi.setSystemTime(new Date('2024-01-15T00:00:00Z'));
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    const { unmount } = render(<CurrentTimeIndicator totalHeight={TOTAL_HEIGHT} />);
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('width: 100%로 전체 너비에 걸쳐 표시된다', () => {
    vi.setSystemTime(new Date('2024-01-15T00:00:00Z'));

    render(<CurrentTimeIndicator totalHeight={TOTAL_HEIGHT} />);

    const indicator = screen.getByTestId('current-time-indicator');
    expect(indicator.className).toContain('w-full');
  });

  it('z-index로 블록 위에 표시된다', () => {
    vi.setSystemTime(new Date('2024-01-15T00:00:00Z'));

    render(<CurrentTimeIndicator totalHeight={TOTAL_HEIGHT} />);

    const indicator = screen.getByTestId('current-time-indicator');
    expect(indicator.style.zIndex).toBe('30');
  });

  it('자정을 넘기는 KST 시간을 올바르게 처리한다', () => {
    // UTC 16:00 → KST 01:00 (다음날) → 60분
    vi.setSystemTime(new Date('2024-01-15T16:00:00Z'));

    render(<CurrentTimeIndicator totalHeight={TOTAL_HEIGHT} />);

    const indicator = screen.getByTestId('current-time-indicator');
    const expectedTop = (60 / 1440) * TOTAL_HEIGHT;
    expect(indicator.style.top).toBe(`${expectedTop}px`);
  });

  it('다른 totalHeight 값에도 올바르게 계산한다', () => {
    // UTC 00:00 → KST 09:00 → 540분
    vi.setSystemTime(new Date('2024-01-15T00:00:00Z'));
    const customHeight = 2880;

    render(<CurrentTimeIndicator totalHeight={customHeight} />);

    const indicator = screen.getByTestId('current-time-indicator');
    const expectedTop = (540 / 1440) * customHeight;
    expect(indicator.style.top).toBe(`${expectedTop}px`);
  });
});
