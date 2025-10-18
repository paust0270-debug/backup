-- ============================================================
-- 애드팡팡 권한 시스템 구현 - Phase 1: 데이터베이스 수정
-- 작성일: 2025-10-18
-- 수정일: 2025-10-18 (status 필드는 이미 존재하므로 제외)
-- ============================================================

-- 1. user_profiles 테이블에 role 필드 추가
-- ============================================================
-- 참고: distributor, status 필드는 이미 존재함

-- role 필드 추가 (없는 경우만)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT '일반회원';

-- master 계정 설정
UPDATE user_profiles 
SET role = '최고관리자', 
    grade = '최고관리자', 
    distributor = '최고관리자',
    status = 'active'
WHERE username = 'master';

-- 기존 사용자들 role 필드 설정 (grade 값을 role에 복사)
UPDATE user_profiles 
SET role = grade 
WHERE role IS NULL OR role = '';

-- 기존 사용자들 status 확인 및 기본값 설정 (필요시)
UPDATE user_profiles 
SET status = 'active' 
WHERE status IS NULL OR status = '' OR status = 'pending';

-- 2. settlement_requests 테이블에 distributor_name 필드 추가
-- ============================================================

ALTER TABLE settlement_requests 
ADD COLUMN IF NOT EXISTS distributor_name VARCHAR(50);

-- 3. 빈 테이블들에 distributor 필드 추가 (선택사항)
-- ============================================================

-- ranking_status 테이블
ALTER TABLE ranking_status 
ADD COLUMN IF NOT EXISTS distributor VARCHAR(50);

-- works 테이블
ALTER TABLE works 
ADD COLUMN IF NOT EXISTS distributor VARCHAR(50);

-- slot_rank_history 테이블
ALTER TABLE slot_rank_history 
ADD COLUMN IF NOT EXISTS distributor VARCHAR(50);

-- 4. 인덱스 추가 (성능 최적화)
-- ============================================================

-- user_profiles 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_distributor 
ON user_profiles(distributor);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON user_profiles(role);

CREATE INDEX IF NOT EXISTS idx_user_profiles_status 
ON user_profiles(status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_grade 
ON user_profiles(grade);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username 
ON user_profiles(username);

-- slots 인덱스
CREATE INDEX IF NOT EXISTS idx_slots_distributor 
ON slots(distributor);

CREATE INDEX IF NOT EXISTS idx_slots_customer_id 
ON slots(customer_id);

CREATE INDEX IF NOT EXISTS idx_slots_status 
ON slots(status);

-- slot_status 인덱스
CREATE INDEX IF NOT EXISTS idx_slot_status_distributor 
ON slot_status(distributor);

CREATE INDEX IF NOT EXISTS idx_slot_status_customer_id 
ON slot_status(customer_id);

-- settlements 인덱스
CREATE INDEX IF NOT EXISTS idx_settlements_distributor 
ON settlements(distributor_name);

CREATE INDEX IF NOT EXISTS idx_settlements_customer_id 
ON settlements(customer_id);

CREATE INDEX IF NOT EXISTS idx_settlements_status 
ON settlements(status);

-- settlement_history 인덱스
CREATE INDEX IF NOT EXISTS idx_settlement_history_distributor 
ON settlement_history(distributor_name);

-- keywords 인덱스
CREATE INDEX IF NOT EXISTS idx_keywords_distributor 
ON keywords(distributor);

-- traffic 인덱스
CREATE INDEX IF NOT EXISTS idx_traffic_distributor 
ON traffic(distributor);

-- 5. 데이터 검증
-- ============================================================

-- user_profiles 검증
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role IS NOT NULL THEN 1 END) as users_with_role,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as users_with_status,
    COUNT(CASE WHEN distributor IS NOT NULL THEN 1 END) as users_with_distributor
FROM user_profiles;

-- master 계정 확인
SELECT username, role, grade, distributor, status 
FROM user_profiles 
WHERE username = 'master';

-- 완료 메시지
SELECT '✅ 데이터베이스 마이그레이션 완료!' as result;

