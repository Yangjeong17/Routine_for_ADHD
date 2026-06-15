/**
 * 파일 확장자별 파싱 전략을 관리하는 모듈
 *
 * - .json: 내용을 직접 JSON.parse 시도, 성공 시 jsonString 반환
 * - .txt: 텍스트로 읽은 후 JSON.parse 시도, 실패 시 오류 메시지
 * - 미지원 확장자: 오류 메시지 반환
 * - BOM(U+FEFF) 제거 처리
 * - 10MB 파일 크기 제한
 */

/** 파일 파싱 결과 */
export type FileParseResult =
  | { success: true; jsonString: string }
  | { success: false; error: string };

/** 확장자별 파싱 함수 타입 */
export type ParserFunction = (content: string) => FileParseResult;

/** 10MB 파일 크기 제한 (바이트) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * BOM(Byte Order Mark, U+FEFF)을 제거한다.
 * @param content - 원본 텍스트
 * @returns BOM이 제거된 텍스트
 */
function removeBOM(content: string): string {
  return content.replace(/^\uFEFF/, '');
}

/**
 * 파일 이름에서 확장자를 추출한다.
 * @param fileName - 파일 이름
 * @returns 소문자 확장자 (점 포함, 예: ".json") 또는 빈 문자열
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
}

/**
 * 확장자별 파싱 함수 레지스트리 (확장 가능 구조)
 * 새로운 확장자 지원 시 이 레지스트리에 파서 함수를 추가하면 된다.
 */
export const parsers: Record<string, ParserFunction> = {
  '.json': (content: string): FileParseResult => {
    const cleaned = removeBOM(content);
    try {
      JSON.parse(cleaned);
      return { success: true, jsonString: cleaned };
    } catch {
      return { success: false, error: 'JSON 형식이 올바르지 않습니다.' };
    }
  },

  '.txt': (content: string): FileParseResult => {
    const cleaned = removeBOM(content);
    try {
      JSON.parse(cleaned);
      return { success: true, jsonString: cleaned };
    } catch {
      return {
        success: false,
        error: '지원하지 않는 텍스트 형식입니다. JSON 형식의 파일을 사용해주세요.',
      };
    }
  },
};

/**
 * 파일을 읽고 파싱하는 메인 함수
 *
 * 동작 순서:
 * 1. 파일 크기 검증 (10MB 초과 시 오류)
 * 2. 파일 확장자 추출 후 parsers 레지스트리에서 파서 조회
 * 3. 미지원 확장자인 경우 오류 반환
 * 4. FileReader API로 파일 내용을 텍스트로 읽기
 * 5. 해당 파서 함수 호출하여 결과 반환
 *
 * @param file - 파싱할 File 객체
 * @returns 파싱 결과 Promise
 */
export function parseFile(file: File): Promise<FileParseResult> {
  return new Promise((resolve) => {
    // 1. 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      resolve({
        success: false,
        error: '파일 크기가 10MB를 초과합니다.',
      });
      return;
    }

    // 2. 확장자 추출 및 파서 조회
    const extension = getFileExtension(file.name);
    const parser = parsers[extension];

    // 3. 미지원 확장자 처리
    if (!parser) {
      resolve({
        success: false,
        error: '현재 .json과 .txt 파일만 지원합니다.',
      });
      return;
    }

    // 4. FileReader API로 파일 읽기
    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;
      // 5. 파서 함수 호출
      resolve(parser(content));
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: '파일을 읽는 중 오류가 발생했습니다.',
      });
    };

    reader.readAsText(file);
  });
}
