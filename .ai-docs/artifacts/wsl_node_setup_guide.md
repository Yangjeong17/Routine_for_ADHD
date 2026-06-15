# WSL 환경 Node.js 설치 및 앱 실행 가이드

## 목적

포맷 후 WSL(Ubuntu) 환경에서 Node.js가 설치되어 있지 않을 때,
이 프로젝트(`Routine_for_adhd`)를 다시 실행하기 위한 환경 복구 절차를 기록한다.

---

## 환경 전제 조건

| 항목 | 내용 |
|------|------|
| OS | Windows + WSL2 (Ubuntu) |
| 터미널 | WSL bash (`yj@comYJ:~/Base/Dev/...`) |
| 프로젝트 경로 | `/home/yj/Base/Dev/mini_project/Routine_for_adhd` |
| Windows 브라우저 | Chrome / Edge 등 |

---

## 문제 상황

포맷 후 WSL 환경에서 아래와 같은 에러가 발생하는 경우:

```bash
$ npm run dev
Command 'npm' not found, but can be installed with:
sudo apt install npm
```

`apt`로 설치하는 npm은 버전이 낮아 Vite 기반 프로젝트에서 문제가 발생할 수 있으므로,
**nvm(Node Version Manager)을 사용하여 Node.js LTS를 설치하는 방법을 권장한다.**

---

## 해결 절차

### Step 1: nvm 설치

WSL bash에서 아래 명령어를 실행한다.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

설치 완료 후 터미널을 재시작하거나, 아래 명령어로 즉시 적용한다.

```bash
source ~/.bashrc
```

nvm이 정상 설치되었는지 확인한다.

```bash
nvm --version
```

출력 예시:
```
0.39.7
```

---

### Step 2: Node.js LTS 버전 설치

```bash
nvm install --lts
nvm use --lts
```

설치 및 활성화 확인:

```bash
node -v
npm -v
```

출력 예시:
```
v20.x.x
10.x.x
```

> **주의**: Node.js 18 이상이 필요하다. `node -v` 결과가 v18 미만이면 `nvm install 20` 으로 재설치할 것.

---

### Step 3: 프로젝트 의존성 설치

프로젝트 폴더로 이동한 뒤 패키지를 설치한다.

```bash
cd ~/Base/Dev/03.\ mini_project/Routine_for_adhd
npm install
```

> **주의**: `node_modules` 폴더가 이미 존재하더라도, 포맷 후 첫 실행 시에는 반드시 `npm install`을 실행한다.

---

### Step 4: 개발 서버 실행

```bash
npm run dev
```

정상 실행 시 아래와 같은 출력이 나타난다.

```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://xxx.xxx.xxx.xxx:5173/
```

---

### Step 5: 브라우저에서 접속

**Windows 브라우저(Chrome, Edge 등)** 주소창에 아래 URL을 입력한다.

```
http://localhost:5173
```

> WSL2의 localhost는 Windows 브라우저에서 그대로 접근 가능하다.
> 별도 포트 포워딩 설정 없이 동작한다.

---

## 자주 쓰는 명령어 요약

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (http://localhost:5173) |
| `npm run build` | 프로덕션 빌드 (`dist/` 폴더 생성) |
| `npm run test` | 전체 테스트 1회 실행 (vitest run) |
| `npx vitest run` | 테스트 직접 실행 (동일) |
| `npx tsc --noEmit` | TypeScript 타입 검사만 실행 (빌드 없음) |
| `npm run lint` | ESLint 코드 검사 실행 |

---

## nvm 관련 유용한 명령어

| 명령어 | 설명 |
|--------|------|
| `nvm ls` | 설치된 Node.js 버전 목록 확인 |
| `nvm ls-remote --lts` | 설치 가능한 LTS 버전 목록 확인 |
| `nvm install 20` | Node.js 20 버전 설치 |
| `nvm use 20` | Node.js 20 버전으로 전환 |
| `nvm alias default 20` | 기본 Node.js 버전을 20으로 설정 (재시작 후에도 유지) |

---

## 경로 관련 주의사항

이 프로젝트는 WSL 내부 홈 디렉터리(`/home/yj/...`)에 위치해 있다.

기존에는 Windows 드라이브 마운트 경로(`/mnt/u/...`)를 사용했으나, 성능 및 도구 호환성 문제로 WSL 내부 경로로 이전 완료됨.

```
현재 경로: /home/yj/Base/Dev/mini_project/Routine_for_adhd
```

WSL 내부 경로에서는 `tsc --noEmit` 등 Node.js 도구의 경로 해석 문제가 발생하지 않는다.

### tsc --noEmit 실행 시 문제가 발생하는 경우

드물지만 tsc 실행이 실패하면 아래 방법으로 우회한다.

- Kiro IDE의 `getDiagnostics` 도구로 TypeScript 오류를 검증한다.
- 또는 `npm run build`로 전체 빌드를 시도하면 tsc 검사가 포함되어 동일한 효과를 얻을 수 있다.

```bash
npm run build
```

---

## 트러블슈팅

### nvm 명령어를 찾을 수 없는 경우

```bash
nvm: command not found
```

터미널을 완전히 닫고 다시 열거나, 아래를 실행한다.

```bash
source ~/.nvm/nvm.sh
```

또는 `~/.bashrc` 파일 하단에 아래 내용이 있는지 확인한다.

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

없으면 직접 추가한다.

---

### npm install 중 EACCES 권한 에러

```bash
npm ERR! code EACCES
```

파일 시스템 권한 문제일 수 있다. 아래를 시도한다.

```bash
npm install --unsafe-perm
```

또는 프로젝트 폴더의 소유권을 확인한다.

```bash
ls -la ~/Base/Dev/03.\ mini_project/Routine_for_adhd
```

---

### 포트 5173이 이미 사용 중인 경우

```bash
Error: Port 5173 is already in use
```

이미 실행 중인 개발 서버가 있을 수 있다. 다른 포트로 실행한다.

```bash
npm run dev -- --port 5174
```

또는 WSL을 재시작한다.

```bash
# Windows PowerShell에서
wsl --shutdown
# 이후 WSL 터미널 다시 열기
```
