# 🚀 Supabase 빠른 시작 가이드

## ⚡ 5분 만에 Supabase 연동하기

### 1️⃣ Supabase 프로젝트 생성
- [supabase.com](https://supabase.com) 방문
- GitHub로 로그인
- "New Project" 클릭
- 프로젝트명: `cupang-ranking-checker`
- 데이터베이스 비밀번호 설정 (기억해두세요!)
- 지역: `Asia Pacific (Singapore)` 선택
- "Create new project" 클릭
- **2-3분 대기** (프로젝트 생성 완료까지)

### 2️⃣ API 키 복사
- 프로젝트 대시보드 → **Settings** → **API**
- **Project URL** 복사
- **anon public** 키 복사

### 3️⃣ 환경 변수 설정 (자동)
```bash
npm run setup:supabase
```
- Supabase URL 입력
- API 키 입력
- 자동으로 `.env.local` 파일 생성

### 4️⃣ 데이터베이스 스키마 실행
- Supabase 대시보드 → **SQL Editor**
- `supabase-schema.sql` 파일 내용 복사
- SQL Editor에 붙여넣기
- **Run** 버튼 클릭

### 5️⃣ 연결 테스트
```bash
npm run dev
```
- 브라우저에서 `http://localhost:3000/supabase-test` 접속
- ✅ 환경 변수 상태 확인
- ✅ 연결 테스트 실행
- ✅ 직접 쿼리 테스트 실행

## 🎯 완료 확인사항

- [ ] Supabase 프로젝트 생성 완료
- [ ] `.env.local` 파일 생성 완료
- [ ] 데이터베이스 스키마 실행 완료
- [ ] 연결 테스트 성공
- [ ] 사용자 관리 페이지 접속 가능

## 🔧 문제 해결

### 환경 변수 오류
```bash
npm run setup:supabase
```

### 연결 실패
1. `.env.local` 파일 확인
2. Supabase 프로젝트 활성 상태 확인
3. 서버 재시작: `npm run dev`

### 테이블 오류
1. `supabase-schema.sql` 재실행
2. Table Editor에서 테이블 존재 확인

## 📱 테스트 페이지

- **연결 테스트**: `/supabase-test`
- **사용자 관리**: `/admin/customers`
- **대시보드**: `/dashboard`

---

**💡 팁**: 문제가 발생하면 `ERROR_SOLUTION.md` 파일을 참조하세요!
