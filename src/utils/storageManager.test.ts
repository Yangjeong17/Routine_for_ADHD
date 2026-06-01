import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveRoutineData,
  loadRoutineData,
  saveCompletionRecords,
  loadCompletionRecords,
  clearAllData,
} from './storageManager';
import type { RoutineData, CompletionRecords } from '../types';

// 테스트용 샘플 데이터
const sampleRoutineData: RoutineData = {
  routine_name: '테스트 루틴',
  version: '1.0',
  days: [
    {
      day: 'monday',
      label: '월요일',
      blocks: [
        {
          id: 'block-1',
          title: '아침 운동',
          start: '07:00',
          end: '08:00',
          duration_minutes: 60,
          priority: 'high',
          color: '#FF0000',
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

const sampleCompletionRecords: CompletionRecords = {
  '2024-01-15': {
    'block-1': true,
    'block-2': false,
  },
  '2024-01-16': {
    'block-1': false,
  },
};

describe('storageManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('saveRoutineData', () => {
    it('RoutineData를 localStorage에 저장한다', () => {
      saveRoutineData(sampleRoutineData);

      const stored = localStorage.getItem('routine-manager-current-routine');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(sampleRoutineData);
    });

    it('localStorage 접근 실패 시 콘솔 경고를 출력한다', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      saveRoutineData(sampleRoutineData);

      expect(warnSpy).toHaveBeenCalledWith(
        'RoutineData 저장 실패:',
        expect.any(Error)
      );
    });
  });

  describe('loadRoutineData', () => {
    it('저장된 RoutineData를 불러온다', () => {
      localStorage.setItem(
        'routine-manager-current-routine',
        JSON.stringify(sampleRoutineData)
      );

      const result = loadRoutineData();
      expect(result).toEqual(sampleRoutineData);
    });

    it('키가 존재하지 않으면 null을 반환한다', () => {
      const result = loadRoutineData();
      expect(result).toBeNull();
    });

    it('데이터가 손상되어 파싱 실패 시 null을 반환하고 경고를 출력한다', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('routine-manager-current-routine', '{invalid json');

      const result = loadRoutineData();

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        'RoutineData 로드 실패 (데이터 손상 가능):',
        expect.any(Error)
      );
    });

    it('localStorage.getItem 자체가 예외를 던지면 null을 반환한다', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      const result = loadRoutineData();

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('saveCompletionRecords', () => {
    it('CompletionRecords를 localStorage에 저장한다', () => {
      saveCompletionRecords(sampleCompletionRecords);

      const stored = localStorage.getItem('routine-manager-completion-records');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(sampleCompletionRecords);
    });

    it('localStorage 접근 실패 시 콘솔 경고를 출력한다', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      saveCompletionRecords(sampleCompletionRecords);

      expect(warnSpy).toHaveBeenCalledWith(
        'CompletionRecords 저장 실패:',
        expect.any(Error)
      );
    });
  });

  describe('loadCompletionRecords', () => {
    it('저장된 CompletionRecords를 불러온다', () => {
      localStorage.setItem(
        'routine-manager-completion-records',
        JSON.stringify(sampleCompletionRecords)
      );

      const result = loadCompletionRecords();
      expect(result).toEqual(sampleCompletionRecords);
    });

    it('키가 존재하지 않으면 빈 객체를 반환한다', () => {
      const result = loadCompletionRecords();
      expect(result).toEqual({});
    });

    it('데이터가 손상되어 파싱 실패 시 빈 객체를 반환한다', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        'routine-manager-completion-records',
        'not valid json!'
      );

      const result = loadCompletionRecords();

      expect(result).toEqual({});
      expect(warnSpy).toHaveBeenCalledWith(
        'CompletionRecords 로드 실패:',
        expect.any(Error)
      );
    });

    it('localStorage.getItem 자체가 예외를 던지면 빈 객체를 반환한다', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      const result = loadCompletionRecords();

      expect(result).toEqual({});
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('clearAllData', () => {
    it('모든 루틴 관련 데이터를 삭제한다', () => {
      localStorage.setItem(
        'routine-manager-current-routine',
        JSON.stringify(sampleRoutineData)
      );
      localStorage.setItem(
        'routine-manager-completion-records',
        JSON.stringify(sampleCompletionRecords)
      );

      clearAllData();

      expect(localStorage.getItem('routine-manager-current-routine')).toBeNull();
      expect(localStorage.getItem('routine-manager-completion-records')).toBeNull();
    });

    it('다른 localStorage 키는 영향받지 않는다', () => {
      localStorage.setItem('other-key', 'other-value');
      localStorage.setItem(
        'routine-manager-current-routine',
        JSON.stringify(sampleRoutineData)
      );

      clearAllData();

      expect(localStorage.getItem('other-key')).toBe('other-value');
    });

    it('localStorage 접근 실패 시 콘솔 경고를 출력한다', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      clearAllData();

      expect(warnSpy).toHaveBeenCalledWith(
        '데이터 삭제 실패:',
        expect.any(Error)
      );
    });
  });

  describe('통합 시나리오', () => {
    it('저장 후 불러오기가 동일한 데이터를 반환한다', () => {
      saveRoutineData(sampleRoutineData);
      saveCompletionRecords(sampleCompletionRecords);

      const loadedRoutine = loadRoutineData();
      const loadedRecords = loadCompletionRecords();

      expect(loadedRoutine).toEqual(sampleRoutineData);
      expect(loadedRecords).toEqual(sampleCompletionRecords);
    });

    it('한 종류의 데이터만 존재할 때 각각 독립적으로 불러온다', () => {
      // RoutineData만 저장
      saveRoutineData(sampleRoutineData);

      const loadedRoutine = loadRoutineData();
      const loadedRecords = loadCompletionRecords();

      expect(loadedRoutine).toEqual(sampleRoutineData);
      expect(loadedRecords).toEqual({});
    });

    it('clearAllData 후 모든 데이터가 null/빈 객체로 반환된다', () => {
      saveRoutineData(sampleRoutineData);
      saveCompletionRecords(sampleCompletionRecords);

      clearAllData();

      expect(loadRoutineData()).toBeNull();
      expect(loadCompletionRecords()).toEqual({});
    });
  });
});
