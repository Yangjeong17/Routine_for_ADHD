import { useState, useEffect } from 'react';

interface CurrentTimeIndicatorProps {
  totalHeight: number; // 1440px
}

/**
 * KST(Asia/Seoul, UTC+9) 기준 현재 시간의 분(0~1439)을 계산한다.
 */
function getKSTMinutes(): number {
  const now = new Date();
  // UTC 시간에 9시간(KST 오프셋)을 더해 한국 시간 계산
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const kstTotalMinutes = utcHours * 60 + utcMinutes + 9 * 60;
  // 자정을 넘기는 경우 처리 (0~1439 범위 유지)
  return ((kstTotalMinutes % 1440) + 1440) % 1440;
}

/**
 * 현재 시간 표시선 컴포넌트
 *
 * KST(Asia/Seoul, UTC+9) 기준 현재 시간 위치에 빨간색 수평선을 표시한다.
 * 1분마다 위치를 업데이트하며, Timeline_Grid의 전체 너비에 걸쳐 표시된다.
 */
export function CurrentTimeIndicator({ totalHeight }: CurrentTimeIndicatorProps) {
  const [currentMinutes, setCurrentMinutes] = useState<number>(getKSTMinutes);

  useEffect(() => {
    // 1분마다 현재 시간 업데이트
    const intervalId = setInterval(() => {
      setCurrentMinutes(getKSTMinutes());
    }, 60_000);

    // 컴포넌트 언마운트 시 interval 정리
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // top 위치 = (현재시간_분 / 1440) × TOTAL_HEIGHT
  const top = (currentMinutes / 1440) * totalHeight;

  return (
    <div
      className="absolute left-0 w-full pointer-events-none"
      style={{
        top: `${top}px`,
        zIndex: 30,
      }}
      aria-hidden="true"
      data-testid="current-time-indicator"
    >
      {/* 빨간색 실선 */}
      <div className="w-full border-t-2 border-solid border-[#EF4444]" />
      {/* 좌측 원형 마커 */}
      <div
        className="absolute -top-[5px] -left-[5px] w-[10px] h-[10px] rounded-full bg-[#EF4444]"
      />
    </div>
  );
}
