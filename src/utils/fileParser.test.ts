import { describe, it, expect } from 'vitest';
import { parseFile, parsers } from './fileParser';
import type { FileParseResult } from './fileParser';

/**
 * File 객체를 생성하는 헬퍼 함수
 */
function createFile(content: string, name: string, options?: { size?: number }): File {
  const blob = new Blob([content], { type: 'text/plain' });
  const file = new File([blob], name);

  // 크기를 오버라이드해야 하는 경우 (10MB 초과 테스트용)
  if (options?.size !== undefined) {
    Object.defineProperty(file, 'size', { value: options.size });
  }

  return file;
}

describe('fileParser', () => {
  describe('parsers 레지스트리', () => {
    it('.json 파서가 등록되어 있다', () => {
      expect(parsers['.json']).toBeDefined();
      expect(typeof parsers['.json']).toBe('function');
    });

    it('.txt 파서가 등록되어 있다', () => {
      expect(parsers['.txt']).toBeDefined();
      expect(typeof parsers['.txt']).toBe('function');
    });
  });

  describe('.json 파서', () => {
    it('유효한 JSON 내용을 성공적으로 파싱한다', () => {
      const content = '{"routine_name":"test","days":[]}';
      const result = parsers['.json'](content);
      expect(result).toEqual({ success: true, jsonString: content });
    });

    it('유효하지 않은 JSON 내용에 대해 오류를 반환한다', () => {
      const content = 'not valid json {{{';
      const result = parsers['.json'](content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('JSON 형식이 올바르지 않습니다');
      }
    });

    it('BOM이 포함된 JSON을 정상 처리한다', () => {
      const content = '\uFEFF{"routine_name":"test","days":[]}';
      const result = parsers['.json'](content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonString).toBe('{"routine_name":"test","days":[]}');
      }
    });
  });

  describe('.txt 파서', () => {
    it('JSON 형식의 텍스트를 성공적으로 파싱한다', () => {
      const content = '{"routine_name":"test","days":[]}';
      const result = parsers['.txt'](content);
      expect(result).toEqual({ success: true, jsonString: content });
    });

    it('JSON이 아닌 텍스트에 대해 적절한 오류 메시지를 반환한다', () => {
      const content = '이것은 일반 텍스트입니다.';
      const result = parsers['.txt'](content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          '지원하지 않는 텍스트 형식입니다. JSON 형식의 파일을 사용해주세요.'
        );
      }
    });

    it('BOM이 포함된 텍스트를 정상 처리한다', () => {
      const content = '\uFEFF{"routine_name":"test","days":[]}';
      const result = parsers['.txt'](content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonString).toBe('{"routine_name":"test","days":[]}');
      }
    });
  });

  describe('parseFile', () => {
    it('.json 파일을 정상적으로 파싱한다', async () => {
      const content = '{"routine_name":"my routine","days":[]}';
      const file = createFile(content, 'routine.json');
      const result = await parseFile(file);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonString).toBe(content);
      }
    });

    it('.txt 파일의 JSON 내용을 정상적으로 파싱한다', async () => {
      const content = '{"routine_name":"my routine","days":[]}';
      const file = createFile(content, 'routine.txt');
      const result = await parseFile(file);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonString).toBe(content);
      }
    });

    it('.txt 파일의 비-JSON 내용에 대해 오류를 반환한다', async () => {
      const content = '이것은 JSON이 아닙니다';
      const file = createFile(content, 'notes.txt');
      const result = await parseFile(file);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          '지원하지 않는 텍스트 형식입니다. JSON 형식의 파일을 사용해주세요.'
        );
      }
    });

    it('미지원 확장자에 대해 오류를 반환한다', async () => {
      const file = createFile('content', 'document.docx');
      const result = await parseFile(file);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('현재 .json과 .txt 파일만 지원합니다.');
      }
    });

    it('.md 확장자에 대해 오류를 반환한다', async () => {
      const file = createFile('# heading', 'readme.md');
      const result = await parseFile(file);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('현재 .json과 .txt 파일만 지원합니다.');
      }
    });

    it('.pdf 확장자에 대해 오류를 반환한다', async () => {
      const file = createFile('pdf content', 'file.pdf');
      const result = await parseFile(file);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('현재 .json과 .txt 파일만 지원합니다.');
      }
    });

    it('10MB 초과 파일을 거부한다', async () => {
      const file = createFile('small', 'big.json', {
        size: 10 * 1024 * 1024 + 1,
      });
      const result = await parseFile(file);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('파일 크기가 10MB를 초과합니다.');
      }
    });

    it('정확히 10MB인 파일은 허용한다', async () => {
      const content = '{"routine_name":"test","days":[]}';
      const file = createFile(content, 'exact.json', {
        size: 10 * 1024 * 1024,
      });
      const result = await parseFile(file);
      expect(result.success).toBe(true);
    });

    it('BOM이 포함된 .json 파일을 정상 처리한다', async () => {
      const content = '\uFEFF{"routine_name":"bom test","days":[]}';
      const file = createFile(content, 'bom.json');
      const result = await parseFile(file);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonString).not.toContain('\uFEFF');
        expect(result.jsonString).toBe('{"routine_name":"bom test","days":[]}');
      }
    });

    it('확장자가 없는 파일에 대해 오류를 반환한다', async () => {
      const file = createFile('content', 'noextension');
      const result = await parseFile(file);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('현재 .json과 .txt 파일만 지원합니다.');
      }
    });

    it('대문자 확장자(.JSON)도 처리한다', async () => {
      const content = '{"routine_name":"upper","days":[]}';
      const file = createFile(content, 'routine.JSON');
      const result = await parseFile(file);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonString).toBe(content);
      }
    });
  });
});
