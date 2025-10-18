# 애드팡팡 권한 시스템 구현 가이드

## 📋 구현 완료 항목

### ✅ Phase 1: 데이터베이스 수정

- `migrations/01-add-role-status-fields.sql` 생성
- `apply-migration.js` 스크립트 생성
- user_profiles 테이블에 role, status 필드 추가
- settlement_requests 테이블에 distributor_name 필드 추가
- 인덱스 추가 (성능 최적화)

### ✅ Phase 2: 세션 관리 유틸리티

- `src/lib/session.ts` 생성
- 세션 저장/조회/삭제/갱신 함수 구현
- 세션 유효성 검증 (24시간)
- 세션 만료 경고 기능

### ✅ Phase 3: 권한 체크 유틸리티

- `src/lib/auth.ts` 생성
- UserPermissions 인터페이스 정의
- 역할 확인 함수 (isMasterAdmin, isDistributor, isRegularUser)
- 페이지/기능별 접근 권한 함수
- 데이터 필터링 조건 반환 함수
- 네비게이션 아이템 필터링 함수

### ✅ Phase 4: Navigation 컴포넌트 수정

- `src/components/Navigation.tsx` 수정
- 세션 유틸리티 통합
- 권한에 따른 네비게이션 메뉴 필터링
- 로그인 페이지에서 네비게이션 숨김
- 세션 만료 시 자동 로그인 페이지 리다이렉트

### ✅ Phase 5: 로그인 페이지 수정

- `src/app/login/page.tsx` 수정
- 세션 유틸리티 통합
- 사용자 권한 검증
- status === 'active' 확인
- 권한에 따른 리다이렉트 (일반회원 → /dashboard, 기타 → /customer)

### ✅ Phase 6: API 엔드포인트 권한 적용

- `/api/users` GET 메서드 수정
  - distributor 필터링 (총판회원)
  - username 필터링 (일반회원)
  - role 필드 추가

### ✅ Phase 7: 페이지 권한 체크 적용

- `src/app/customer/CustomerPageContent.tsx` 수정
  - 권한에 따른 고객 목록 필터링
  - 최고관리자: 모든 고객
  - 총판회원: 본인 소속 고객만
  - 일반회원: 본인만

---

## 🚀 실행 방법

### 1단계: 데이터베이스 마이그레이션

#### 방법 1: Supabase 대시보드에서 직접 실행 (권장)

1. Supabase 대시보드 접속
2. SQL Editor 메뉴 선택
3. `migrations/01-add-role-status-fields.sql` 파일 내용 복사
4. SQL Editor에 붙여넣고 실행 (Run 버튼 클릭)

#### 방법 2: Node.js 스크립트 실행

```bash
cd C:\Users\qkrwn\copanglast-backup
node apply-migration.js
```

**주의**: Supabase RPC 함수가 없으면 실패할 수 있습니다. 방법 1을 권장합니다.

### 2단계: 환경 변수 확인

`.env.local` 파일에 다음 환경 변수가 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3단계: 의존성 설치 및 서버 실행

```bash
cd C:\Users\qkrwn\copanglast-backup
npm install
npm run dev
```

### 4단계: 브라우저에서 테스트

1. http://localhost:3000 접속
2. 로그인 페이지로 자동 리다이렉트 확인
3. 테스트 계정으로 로그인:
   - **최고관리자**: master / (비밀번호)
   - **총판회원**: Sksk2iwi / (비밀번호)
   - **일반회원**: (일반회원 계정) / (비밀번호)

---

## 🧪 테스트 체크리스트

### 로그인 테스트

- [ ] 로그인 페이지 접속 (`http://localhost:3000`)
- [ ] status가 'active'인 사용자만 로그인 가능
- [ ] status가 'pending', 'rejected', 'suspended'인 사용자는 로그인 불가
- [ ] 로그인 성공 시 세션 저장 확인 (localStorage에 user, sessionTimestamp)
- [ ] 일반회원은 /dashboard로 리다이렉트
- [ ] 최고관리자, 총판회원은 /customer로 리다이렉트

### 네비게이션 테스트

- [ ] **최고관리자**: 모든 메뉴 표시
- [ ] **총판회원**: 총판관리, 트래픽 상태, 랭킹 상태 메뉴 숨김
- [ ] **총판회원**: 작업관리 클릭 시 /slot-add로 이동
- [ ] **일반회원**: 무료 서비스, 메인서비스, 공지사항만 표시
- [ ] 로그아웃 시 세션 삭제 및 /login으로 리다이렉트

### 고객 관리 페이지 테스트

- [ ] **최고관리자**: 모든 고객 목록 표시
- [ ] **총판회원**: 본인 소속 고객만 표시
- [ ] **일반회원**: 접근 불가 (메뉴 숨김)
- [ ] 고객 목록이 최신순으로 정렬 (순번이 역순)

### 세션 유지 테스트

- [ ] 페이지 이동 시 로그인 상태 유지
- [ ] 새로고침 시 로그인 상태 유지
- [ ] 24시간 후 세션 만료 (자동 로그아웃)
- [ ] 로그인 페이지에서는 네비게이션 숨김

---

## 📝 추가 작업 필요 항목

### 1. 정산 관리 페이지 권한 적용

- `/api/settlements/unsettled` GET 메서드 수정
- `/api/settlement-history` GET 메서드 수정
- `src/app/settlement/unsettled/page.tsx` 수정

### 2. 슬롯 관리 페이지 권한 적용

- `/api/slots` GET 메서드 수정 (이미 distributor 필터 있음)
- `src/app/slot-status/page.tsx` 수정
- `src/app/slot-add/page.tsx` 수정

### 3. 작업 등록 페이지 권한 적용

- `src/app/coupangapp/add/page.tsx` 수정
- 기타 작업 등록 페이지들 수정

### 4. 트래픽 상태 / 랭킹 상태 페이지 접근 제한

- `src/app/traffic-status/page.tsx` 수정
- `src/app/ranking-status/page.tsx` 수정
- 최고관리자만 접근 가능하도록 체크

---

## 🐛 문제 해결

### 문제 1: 세션이 자주 만료됨

**원인**: 세션 타임스탬프가 제대로 갱신되지 않음  
**해결**: Navigation 컴포넌트에서 `refreshSession()` 호출 확인

### 문제 2: 고객 목록이 비어있음

**원인**: API 필터링이 너무 엄격함  
**해결**:

1. 브라우저 콘솔에서 API URL 확인
2. user.distributor 값이 올바른지 확인
3. Supabase에서 user_profiles.distributor 값 확인

### 문제 3: 네비게이션 메뉴가 표시되지 않음

**원인**: user.grade 값이 올바르지 않음  
**해결**:

1. localStorage에서 user 정보 확인
2. user.grade가 '최고관리자', '총판회원', '일반회원' 중 하나인지 확인
3. Supabase에서 user_profiles.grade 값 확인

### 문제 4: 데이터베이스 마이그레이션 실패

**원인**: Supabase RPC 함수가 없음  
**해결**: Supabase 대시보드 SQL Editor에서 직접 실행 (방법 1 사용)

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. 브라우저 콘솔 로그
2. 터미널 서버 로그
3. Supabase 대시보드 로그

---

## 🎉 완료!

모든 단계를 완료하면 권한 시스템이 정상적으로 작동합니다.
추가 기능이 필요하면 `src/lib/auth.ts`와 `src/lib/session.ts`를 참고하세요.
