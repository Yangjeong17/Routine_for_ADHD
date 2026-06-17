# 수정사항이 개발 주소에 바로 반영되지 않는 문제

## 현상

개발 중 코드를 수정했음에도 `http://localhost:5173/` 개발 주소에 변경사항이 바로 반영되지 않는 문제가 발생함.

이로 인해 수정사항을 확인할 때마다 브라우저 캐시를 삭제해야 하는 번거로움이 있었음.

## 원인

### 원인 1. `npm run build` 후 `npm run dev`를 반복하는 작업 방식

개발 중에는 일반적으로 `npm run build`가 필요하지 않음.

`npm run build`는 `dist/` 폴더에 프로덕션 번들을 생성하는 명령이며, `npm run dev`는 `dist/`를 참조하지 않고 `src/`를 직접 읽어 메모리에서 개발 서버를 실행함.

따라서 두 명령은 서로 독립적으로 동작하며, `npm run build`를 실행해도 `npm run dev`로 실행 중인 개발 서버에는 직접적인 영향이 없음.

캐시 문제처럼 보였던 현상은 실제로는 다음 상황 중 하나일 가능성이 있음.

* build 결과물인 `dist/` 파일을 브라우저에서 직접 열고 있었던 경우
* HMR(Hot Module Replacement, 코드 변경 즉시 반영 기능)이 특정 변경사항에 반응하지 못한 경우
* 브라우저 또는 Service Worker(서비스 워커)에 이전 리소스가 남아 있었던 경우

## 확인 내용

현재 `npm run build`는 내부적으로 다음 명령을 실행함.

```bash
tsc -b && vite build
```

각 단계의 역할은 다음과 같음.

1. `tsc -b`

   * TypeScript 타입 검사 수행
   * 타입 에러가 있으면 여기서 중단됨

2. `vite build`

   * 프로덕션용 번들링 수행
   * `dist/` 폴더 생성

기존에 `npm run build`를 사용한 이유는 코드 수정 후 타입 에러 없이 컴파일되는지 확인하기 위함이었음.

그러나 개발 중 타입 검사만 필요한 경우에는 전체 빌드를 수행할 필요가 없음.

## 해결 방법

개발 중에는 다음 작업 흐름을 사용함.

```bash
npm run dev
```

브라우저에서는 아래 개발 서버 주소로 접속함.

```text
http://localhost:5173/
```

타입 검사만 필요할 경우에는 아래 명령을 사용함.

```bash
npx tsc --noEmit
```

또는 기존 build 구조가 `tsc -b && vite build`인 경우, 프로젝트 참조 설정까지 반영하기 위해 아래 명령을 사용할 수 있음.

```bash
npx tsc -b --noEmit
```

위 명령은 번들링 없이 TypeScript 타입 검사만 수행하므로 `dist/` 파일을 새로 만들지 않음.

## 권장 작업 방식

앞으로 개발 중에는 아래 흐름을 따른다.

1. 개발 서버 실행

```bash
npm run dev
```

2. 브라우저에서 개발 주소 접속

```text
http://localhost:5173/
```

3. 코드 수정 후 저장

4. HMR을 통해 변경사항 반영 여부 확인

5. 타입 검사 필요 시 실행

```bash
npx tsc -b --noEmit
```

6. 실제 배포용 결과물이 필요할 때만 실행

```bash
npm run build
```

## 참고

개발 중 변경사항이 계속 반영되지 않는 경우에는 브라우저 개발자도구에서 아래 항목을 추가로 확인함.

* `Network` 탭의 `Disable cache` 활성화 여부
* `Application` 탭의 Service Worker 등록 여부
* `Application > Storage > Clear site data`를 통한 개발 주소 데이터 초기화 여부
