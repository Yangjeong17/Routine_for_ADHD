import { describe, it, expect } from 'vitest';
import { parseFile } from './fileParser';
import { parseRoutineJson } from './parser';
import { routineDataToJson } from './prettyPrinter';
import type { RoutineData } from '../types';

/**
 * File 객체를 생성하는 헬퍼 함수
 */
function createFile(content: string, name: string): File {
  const blob = new Blob([content], { type: 'text/plain' });
  return new File([blob], name);
}

/**
 * id 필드를 제거하고 undefined 필드를 정리하여 비교하기 위한 헬퍼 함수
 * (라운드트립 시 id가 재생성될 수 있으므로 제외)
 * (normalizeBlock이 category/notes를 명시적 undefined로 설정하므로 JSON 직렬화로 정규화)
 */
function stripIds(data: RoutineData): unknown {
  const stripped = {
    ...data,
    days: data.days.map((day) => ({
      ...day,
      blocks: day.blocks.map((block) => {
        const { id, ...rest } = block;
        return rest;
      }),
    })),
  };
  // JSON 직렬화/역직렬화로 undefined 필드를 제거하여 정규화
  return JSON.parse(JSON.stringify(stripped));
}

describe('파일 Import/Export 라운드트립 테스트', () => {
  /**
   * Validates: Requirements 16.1
   * Export → Import 시 데이터 동일성 검증
   */
  describe('Export → Import 라운드트립', () => {
    it('유효한 RoutineData를 Export 후 Import하면 id를 제외한 모든 필드가 동일하다', async () => {
      // 1. 유효한 RoutineData 객체 생성
      const originalData: RoutineData = {
        routine_name: '테스트 루틴',
        version: '1.0',
        timezone: 'Asia/Seoul',
        days: [
          {
            day: 'monday',
            label: '월요일',
            blocks: [
              {
                id: 'block-1',
                title: '아침 운동',
                category: '운동',
                start: '06:00',
                end: '07:00',
                duration_minutes: 60,
                priority: 'high',
                color: '#EF4444',
                required: true,
                notes: '스트레칭 포함',
              },
              {
                id: 'block-2',
                title: '점심 식사',
                category: '식사',
                start: '12:00',
                end: '13:00',
                duration_minutes: 60,
                priority: 'medium',
                color: '#6B7280',
                required: false,
              },
            ],
          },
          {
            day: 'tuesday',
            label: '화요일',
            blocks: [
              {
                id: 'block-3',
                title: '독서',
                category: '자기계발',
                start: '20:00',
                end: '21:30',
                duration_minutes: 90,
                priority: 'low',
                color: '#3B82F6',
                required: false,
                notes: '소설 읽기',
              },
            ],
          },
          {
            day: 'wednesday',
            label: '수요일',
            blocks: [],
          },
          {
            day: 'thursday',
            label: '목요일',
            blocks: [],
          },
          {
            day: 'friday',
            label: '금요일',
            blocks: [],
          },
          {
            day: 'saturday',
            label: '토요일',
            blocks: [],
          },
          {
            day: 'sunday',
            label: '일요일',
            blocks: [],
          },
        ],
      };

      // 2. routineDataToJson()으로 JSON 문자열 생성 (Export 시뮬레이션)
      const jsonString = routineDataToJson(originalData);

      // 3. File 객체 생성 (Export된 파일 시뮬레이션)
      const file = createFile(jsonString, 'test_routine.json');

      // 4. parseFile()로 파일 파싱 (Import 시뮬레이션)
      const fileResult = await parseFile(file);
      expect(fileResult.success).toBe(true);
      if (!fileResult.success) return;

      // 5. parseRoutineJson()으로 유효성 검증 및 정규화
      const parseResult = parseRoutineJson(fileResult.jsonString);
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      // 6. id를 제외한 모든 필드가 동일한지 검증
      const originalStripped = stripIds(originalData);
      const importedStripped = stripIds(parseResult.data);
      expect(importedStripped).toEqual(originalStripped);
    });

    it('sleep 정보가 포함된 RoutineData도 라운드트립이 유지된다', async () => {
      const originalData: RoutineData = {
        routine_name: '수면 포함 루틴',
        version: '2.0',
        timezone: 'Asia/Seoul',
        sleep: {
          target_bedtime: '23:00',
          target_wakeup: '07:00',
          flex_hours: 1,
        },
        days: [
          {
            day: 'monday',
            label: '월요일',
            blocks: [
              {
                id: 'sleep-block-1',
                title: '명상',
                start: '22:00',
                end: '22:30',
                duration_minutes: 30,
                priority: 'high',
                color: '#8B5CF6',
                required: true,
              },
            ],
          },
          { day: 'tuesday', label: '화요일', blocks: [] },
          { day: 'wednesday', label: '수요일', blocks: [] },
          { day: 'thursday', label: '목요일', blocks: [] },
          { day: 'friday', label: '금요일', blocks: [] },
          { day: 'saturday', label: '토요일', blocks: [] },
          { day: 'sunday', label: '일요일', blocks: [] },
        ],
      };

      const jsonString = routineDataToJson(originalData);
      const file = createFile(jsonString, 'sleep_routine.json');

      const fileResult = await parseFile(file);
      expect(fileResult.success).toBe(true);
      if (!fileResult.success) return;

      const parseResult = parseRoutineJson(fileResult.jsonString);
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      // sleep 정보 동일성 검증
      expect(parseResult.data.sleep).toEqual(originalData.sleep);
      expect(parseResult.data.routine_name).toBe(originalData.routine_name);
      expect(parseResult.data.version).toBe(originalData.version);
      expect(parseResult.data.timezone).toBe(originalData.timezone);
    });

    it('.txt 확장자로 Export된 JSON도 라운드트립이 유지된다', async () => {
      // 주의: normalizeRoutineData가 monday~sunday 순서로 정렬하므로
      // 원본 데이터도 같은 순서로 구성해야 라운드트립 동일성이 보장된다.
      const originalData: RoutineData = {
        routine_name: 'txt 테스트',
        days: [
          { day: 'monday', label: '월요일', blocks: [] },
          { day: 'tuesday', label: '화요일', blocks: [] },
          { day: 'wednesday', label: '수요일', blocks: [] },
          { day: 'thursday', label: '목요일', blocks: [] },
          {
            day: 'friday',
            label: '금요일',
            blocks: [
              {
                id: 'txt-1',
                title: '회의',
                start: '14:00',
                end: '15:00',
                duration_minutes: 60,
                priority: 'medium',
                color: '#6B7280',
                required: false,
              },
            ],
          },
          { day: 'saturday', label: '토요일', blocks: [] },
          { day: 'sunday', label: '일요일', blocks: [] },
        ],
      };

      const jsonString = routineDataToJson(originalData);
      const file = createFile(jsonString, 'routine.txt');

      const fileResult = await parseFile(file);
      expect(fileResult.success).toBe(true);
      if (!fileResult.success) return;

      const parseResult = parseRoutineJson(fileResult.jsonString);
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const originalStripped = stripIds(originalData);
      const importedStripped = stripIds(parseResult.data);
      expect(importedStripped).toEqual(originalStripped);
    });
  });

  /**
   * Validates: Requirements 16.2
   * BOM 포함 파일 처리 테스트
   */
  describe('BOM 포함 파일 처리', () => {
    it('BOM이 포함된 .json 파일을 정상적으로 파싱한다', async () => {
      const data: RoutineData = {
        routine_name: 'BOM 테스트',
        days: [
          { day: 'monday', label: '월요일', blocks: [] },
          { day: 'tuesday', label: '화요일', blocks: [] },
          { day: 'wednesday', label: '수요일', blocks: [] },
          { day: 'thursday', label: '목요일', blocks: [] },
          { day: 'friday', label: '금요일', blocks: [] },
          { day: 'saturday', label: '토요일', blocks: [] },
          { day: 'sunday', label: '일요일', blocks: [] },
        ],
      };

      const jsonString = routineDataToJson(data);
      // BOM 접두사 추가
      const bomContent = '\uFEFF' + jsonString;
      const file = createFile(bomContent, 'bom_routine.json');

      const fileResult = await parseFile(file);
      expect(fileResult.success).toBe(true);
      if (!fileResult.success) return;

      // BOM이 제거되었는지 확인
      expect(fileResult.jsonString.startsWith('\uFEFF')).toBe(false);

      // 파싱 결과 검증
      const parseResult = parseRoutineJson(fileResult.jsonString);
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      expect(parseResult.data.routine_name).toBe('BOM 테스트');
    });

    it('BOM이 포함된 .txt 파일을 정상적으로 파싱한다', async () => {
      const data: RoutineData = {
        routine_name: 'BOM txt 테스트',
        days: [
          {
            day: 'sunday',
            label: '일요일',
            blocks: [
              {
                id: 'bom-txt-1',
                title: '휴식',
                start: '10:00',
                end: '11:00',
                duration_minutes: 60,
                priority: 'low',
                color: '#10B981',
                required: false,
              },
            ],
          },
          { day: 'monday', label: '월요일', blocks: [] },
          { day: 'tuesday', label: '화요일', blocks: [] },
          { day: 'wednesday', label: '수요일', blocks: [] },
          { day: 'thursday', label: '목요일', blocks: [] },
          { day: 'friday', label: '금요일', blocks: [] },
          { day: 'saturday', label: '토요일', blocks: [] },
        ],
      };

      const jsonString = routineDataToJson(data);
      const bomContent = '\uFEFF' + jsonString;
      const file = createFile(bomContent, 'bom_routine.txt');

      const fileResult = await parseFile(file);
      expect(fileResult.success).toBe(true);
      if (!fileResult.success) return;

      expect(fileResult.jsonString.startsWith('\uFEFF')).toBe(false);

      const parseResult = parseRoutineJson(fileResult.jsonString);
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      expect(parseResult.data.routine_name).toBe('BOM txt 테스트');
    });
  });

  /**
   * Validates: Requirements 16.1 (오류 처리 측면)
   * 다양한 확장자 오류 처리 테스트
   */
  describe('다양한 확장자 오류 처리', () => {
    it('.docx 파일은 지원하지 않는 확장자 오류를 반환한다', async () => {
      const file = createFile('content', 'routine.docx');
      const result = await parseFile(file);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('현재 .json과 .txt 파일만 지원합니다.');
      }
    });

    it('.md 파일은 지원하지 않는 확장자 오류를 반환한다', async () => {
      const file = createFile('# Routine', 'routine.md');
      const result = await parseFile(file);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('현재 .json과 .txt 파일만 지원합니다.');
      }
    });

    it('.pdf 파일은 지원하지 않는 확장자 오류를 반환한다', async () => {
      const file = createFile('pdf binary', 'routine.pdf');
      const result = await parseFile(file);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('현재 .json과 .txt 파일만 지원합니다.');
      }
    });

    it('.csv 파일은 지원하지 않는 확장자 오류를 반환한다', async () => {
      const file = createFile('a,b,c', 'routine.csv');
      const result = await parseFile(file);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('현재 .json과 .txt 파일만 지원합니다.');
      }
    });

    it('.txt 파일에 비-JSON 내용이 있으면 텍스트 형식 오류를 반환한다', async () => {
      const file = createFile('이것은 일반 텍스트입니다.', 'notes.txt');
      const result = await parseFile(file);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          '지원하지 않는 텍스트 형식입니다. JSON 형식의 파일을 사용해주세요.'
        );
      }
    });
  });
});
