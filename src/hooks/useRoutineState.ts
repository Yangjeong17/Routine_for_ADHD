import { useState, useCallback, useEffect } from 'react';
import type { RoutineData, CompletionRecords, Block, DayValue } from '../types';
import {
  saveRoutineData,
  loadRoutineData,
  saveCompletionRecords,
  loadCompletionRecords,
} from '../utils/storageManager';
import { sampleRoutineData } from '../utils/sampleData';
import { generateId } from '../utils/idGenerator';
import { timeToMinutes } from '../utils/parser';

type SaveStatus = 'saving' | 'saved';

function sortBlocksByStartTime(blocks: Block[]): Block[] {
  return [...blocks].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

export function useRoutineState() {
  const [routineData, setRoutineData] = useState<RoutineData | null>(null);
  const [completionRecords, setCompletionRecords] = useState<CompletionRecords>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // 앱 시작 시 localStorage에서 데이터 로드
  useEffect(() => {
    const loadedRoutine = loadRoutineData();
    const loadedRecords = loadCompletionRecords();

    if (loadedRoutine !== null) {
      setRoutineData(loadedRoutine);
    } else {
      // localStorage에 저장된 데이터가 없는 경우에만 샘플 데이터 사용
      setRoutineData(sampleRoutineData);
      saveRoutineData(sampleRoutineData);
    }

    setCompletionRecords(loadedRecords);
  }, []);

  /**
   * 루틴 데이터를 저장하고 saveStatus를 업데이트한다.
   */
  const persistRoutineData = useCallback((data: RoutineData) => {
    setSaveStatus('saving');
    saveRoutineData(data);
    setSaveStatus('saved');
  }, []);

  /**
   * 완료 기록을 저장하고 saveStatus를 업데이트한다.
   */
  const persistCompletionRecords = useCallback((records: CompletionRecords) => {
    setSaveStatus('saving');
    saveCompletionRecords(records);
    setSaveStatus('saved');
  }, []);

  /**
   * 외부 JSON에서 루틴 데이터를 가져온다.
   */
  const importRoutineData = useCallback(
    (data: RoutineData) => {
      setRoutineData(data);
      persistRoutineData(data);
    },
    [persistRoutineData]
  );

  /**
   * 새 블록을 추가한다.
   * - 고유 ID 생성
   * - duration_minutes 계산
   * - 해당 요일에 추가 후 start 시간 기준 정렬
   * - localStorage 저장
   */
  const addBlock = useCallback(
    (dayValue: DayValue, block: Omit<Block, 'id' | 'duration_minutes'>) => {
      setRoutineData((prev) => {
        if (!prev) return prev;

        const newBlock: Block = {
          ...block,
          id: generateId(),
          duration_minutes: timeToMinutes(block.end) - timeToMinutes(block.start),
        };

        const updatedDays = prev.days.map((dayData) => {
          if (dayData.day === dayValue) {
            return {
              ...dayData,
              blocks: sortBlocksByStartTime([...dayData.blocks, newBlock]),
            };
          }
          return dayData;
        });

        const updatedData: RoutineData = { ...prev, days: updatedDays };
        persistRoutineData(updatedData);
        return updatedData;
      });
    },
    [persistRoutineData]
  );

  /**
   * 기존 블록을 수정한다.
   * - newDayValue가 제공되고 기존 dayValue와 다르면 요일 이동 처리
   * - 수정 후 해당 요일 blocks를 start 시간 기준 정렬
   * - localStorage 저장
   */
  const updateBlock = useCallback(
    (
      dayValue: DayValue,
      blockId: string,
      updates: Partial<Block>,
      newDayValue?: DayValue
    ) => {
      setRoutineData((prev) => {
        if (!prev) return prev;

        let updatedDays = [...prev.days];

        if (newDayValue && newDayValue !== dayValue) {
          // 요일 이동: 기존 요일에서 블록 제거, 새 요일에 추가
          let movedBlock: Block | null = null;

          updatedDays = updatedDays.map((dayData) => {
            if (dayData.day === dayValue) {
              const block = dayData.blocks.find((b) => b.id === blockId);
              if (block) {
                movedBlock = { ...block, ...updates };
                // duration_minutes 재계산
                if (updates.start || updates.end) {
                  const start = movedBlock.start;
                  const end = movedBlock.end;
                  movedBlock.duration_minutes =
                    timeToMinutes(end) - timeToMinutes(start);
                }
              }
              return {
                ...dayData,
                blocks: sortBlocksByStartTime(
                  dayData.blocks.filter((b) => b.id !== blockId)
                ),
              };
            }
            return dayData;
          });

          if (movedBlock) {
            updatedDays = updatedDays.map((dayData) => {
              if (dayData.day === newDayValue) {
                return {
                  ...dayData,
                  blocks: sortBlocksByStartTime([...dayData.blocks, movedBlock!]),
                };
              }
              return dayData;
            });
          }
        } else {
          // 같은 요일 내 수정
          updatedDays = updatedDays.map((dayData) => {
            if (dayData.day === dayValue) {
              const updatedBlocks = dayData.blocks.map((block) => {
                if (block.id === blockId) {
                  const updatedBlock = { ...block, ...updates };
                  // duration_minutes 재계산
                  if (updates.start || updates.end) {
                    updatedBlock.duration_minutes =
                      timeToMinutes(updatedBlock.end) -
                      timeToMinutes(updatedBlock.start);
                  }
                  return updatedBlock;
                }
                return block;
              });
              return {
                ...dayData,
                blocks: sortBlocksByStartTime(updatedBlocks),
              };
            }
            return dayData;
          });
        }

        const updatedData: RoutineData = { ...prev, days: updatedDays };
        persistRoutineData(updatedData);
        return updatedData;
      });
    },
    [persistRoutineData]
  );

  /**
   * 블록을 삭제한다.
   * - 해당 요일의 blocks 배열에서 제거
   * - localStorage 저장
   */
  const deleteBlock = useCallback(
    (dayValue: DayValue, blockId: string) => {
      setRoutineData((prev) => {
        if (!prev) return prev;

        const updatedDays = prev.days.map((dayData) => {
          if (dayData.day === dayValue) {
            return {
              ...dayData,
              blocks: dayData.blocks.filter((b) => b.id !== blockId),
            };
          }
          return dayData;
        });

        const updatedData: RoutineData = { ...prev, days: updatedDays };
        persistRoutineData(updatedData);
        return updatedData;
      });
    },
    [persistRoutineData]
  );

  /**
   * 완료 상태를 토글한다.
   * - date(YYYY-MM-DD)와 blockId를 기준으로 완료 상태 토글
   * - localStorage 저장
   */
  const toggleCompletion = useCallback(
    (date: string, blockId: string) => {
      setCompletionRecords((prev) => {
        const dateRecords = prev[date] || {};
        const currentStatus = dateRecords[blockId] || false;

        const updatedRecords: CompletionRecords = {
          ...prev,
          [date]: {
            ...dateRecords,
            [blockId]: !currentStatus,
          },
        };

        persistCompletionRecords(updatedRecords);
        return updatedRecords;
      });
    },
    [persistCompletionRecords]
  );

  /**
   * 특정 카테고리를 가진 모든 블록의 color 필드를 일괄 업데이트한다.
   * App.tsx에서 카테고리 색상 변경 시 호출.
   */
  const updateCategoryColor = useCallback(
    (category: string, newColor: string) => {
      setRoutineData((prev) => {
        if (!prev) return prev;
        const updatedDays = prev.days.map((dayData) => ({
          ...dayData,
          blocks: dayData.blocks.map((block) =>
            block.category === category ? { ...block, color: newColor } : block
          ),
        }));
        const updatedData: RoutineData = { ...prev, days: updatedDays };
        persistRoutineData(updatedData);
        return updatedData;
      });
    },
    [persistRoutineData]
  );

  return {
    routineData,
    completionRecords,
    saveStatus,
    importRoutineData,
    addBlock,
    updateBlock,
    deleteBlock,
    toggleCompletion,
    updateCategoryColor,
  };
}