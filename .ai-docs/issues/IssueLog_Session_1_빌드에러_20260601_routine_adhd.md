**저장 경로 및 파일명: Docs\Trouble_Shooting\routine_adhd_빌드에러_IssueLog_Session_1_20260601.md**

---

# Trouble Shooting - Session 1

## 해결 완료 (Resolved)

---

### Issue 1: TypeScript 미사용 파라미터 컴파일 에러

**발생 위치**: `src/App.tsx`

**증상**:
```
error TS6133: 'originalDayValue' is declared but its value is never read.
error TS6133: 'dayValue' is declared but its value is never read. (handleAddBlock)
```

**원인**: `tsconfig.app.json`에 `noUnusedParameters` 또는 strict 모드가 활성화되어 있어, 콜백 시그니처에서 사용하지 않는 파라미터가 에러로 처리됨.

**해결**:
```typescript
// 변경 전
function handleSaveBlock(dayValue: DayValue, blockData: ..., originalDayValue?: DayValue) { ... }
function handleAddBlock(dayValue: DayValue) { ... }

// 변경 후 (언더스코어 prefix 추가)
function handleSaveBlock(dayValue: DayValue, blockData: ..., _originalDayValue?: DayValue) { ... }
function handleAddBlock(_dayValue: DayValue) { ... }
```

---

### Issue 2: 미사용 import 컴파일 에러

**발생 위치**: `src/utils/prettyPrinter.property.test.ts`

**증상**:
```
error TS6133: 'DAY_VALUES' is declared but its value is never read.
```

**원인**: 테스트 리팩토링 과정에서 `DAY_VALUES` 상수를 사용하던 코드가 제거되었으나 import/선언이 남아있었음.

**해결**: 미사용 `DAY_VALUES` 상수 선언 제거.

---

### Issue 3: Parser normalizeRoutineData에서 블록 정렬 누락

**발생 위치**: `src/utils/parser.ts` - `normalizeRoutineData()`

**증상**: Property 2 (Time Sorting Invariant) 테스트 실패. 파싱 후 블록이 start 시간 기준으로 정렬되지 않음.

**원인**: `normalizeRoutineData` 함수에서 블록 기본값 보정(normalizeBlock) 후 정렬 로직이 누락되어 있었음. 설계 문서에는 "가져오기 후 정렬"이 명시되어 있었으나 구현 시 빠짐.

**해결**:
```typescript
// normalizeRoutineData 내부에 정렬 로직 추가
const normalizedDays: DayData[] = data.days.map((dayData) => {
  const normalizedBlocks = dayData.blocks.map((block) =>
    normalizeBlock(block as unknown as Record<string, unknown>)
  );
  // 각 요일의 blocks를 start 시간 기준 오름차순 정렬
  normalizedBlocks.sort(
    (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
  );
  return { ...dayData, blocks: normalizedBlocks };
});
```

---

### Issue 4: prettyPrinter 라운드트립 테스트 실패 (정렬 추가 후)

**발생 위치**: `src/utils/prettyPrinter.property.test.ts`

**증상**: Parser에 정렬 로직 추가 후, 라운드트립 테스트에서 블록 순서 불일치로 실패.

**원인**: 테스트의 arbitrary가 정렬되지 않은 블록을 생성하고 있었음. Parser가 정렬을 수행하므로 `parse(print(data))`의 결과가 원본과 블록 순서가 달라짐.

**해결**: `prettyPrinter.property.test.ts`의 `normalizedDayArbitrary`에서 생성된 블록을 start 시간 기준으로 정렬하여 이미 정규화된 상태의 데이터를 생성하도록 수정.

---

## 미해결 (Unresolved)

현재 세션에서 미해결 이슈 없음.
