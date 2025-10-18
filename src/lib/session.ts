/**
 * 세션 관리 유틸리티
 * 로그인 세션 유지 및 관리를 위한 함수들
 */

export interface SessionData {
  user: any;
  timestamp: number;
}

/**
 * 세션 저장
 * @param user 사용자 정보
 */
export function saveSession(user: any): void {
  try {
    const sessionData: SessionData = {
      user,
      timestamp: Date.now(),
    };

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('sessionTimestamp', sessionData.timestamp.toString());

    console.log('✅ 세션 저장 완료:', user.username);
  } catch (error) {
    console.error('❌ 세션 저장 오류:', error);
  }
}

/**
 * 세션 조회
 * @returns 사용자 정보 또는 null
 */
export function getSession(): any | null {
  try {
    const userData = localStorage.getItem('user');

    if (!userData) {
      return null;
    }

    const user = JSON.parse(userData);
    return user;
  } catch (error) {
    console.error('❌ 세션 조회 오류:', error);
    return null;
  }
}

/**
 * 세션 삭제
 */
export function clearSession(): void {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('sessionTimestamp');
    localStorage.removeItem('rememberMe');

    console.log('✅ 세션 삭제 완료');
  } catch (error) {
    console.error('❌ 세션 삭제 오류:', error);
  }
}

/**
 * 세션 갱신
 * 사용자 활동 시 세션 타임스탬프 업데이트
 */
export function refreshSession(): void {
  try {
    // getSession() 대신 직접 localStorage에서 가져오기 (무한 루프 방지)
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      // 타임스탬프만 업데이트
      localStorage.setItem('sessionTimestamp', Date.now().toString());
      // console.log('🔄 세션 갱신 완료'); // 로그 제거 (너무 많이 출력됨)
    }
  } catch (error) {
    console.error('❌ 세션 갱신 오류:', error);
  }
}

/**
 * 세션 유효성 확인
 * @returns 세션이 유효한지 여부
 */
export function isSessionValid(): boolean {
  try {
    const userData = localStorage.getItem('user');
    const timestamp = localStorage.getItem('sessionTimestamp');

    if (!userData) {
      return false;
    }

    // 타임스탬프가 있으면 24시간 체크
    if (timestamp) {
      const sessionAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24시간

      if (sessionAge > maxAge) {
        console.warn('⚠️  세션 만료 (24시간 초과)');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ 세션 유효성 확인 오류:', error);
    return false;
  }
}

/**
 * 세션 만료까지 남은 시간 (밀리초)
 * @returns 남은 시간 (밀리초) 또는 null
 */
export function getSessionRemainingTime(): number | null {
  try {
    const timestamp = localStorage.getItem('sessionTimestamp');

    if (!timestamp) {
      return null;
    }

    const sessionAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24시간
    const remaining = maxAge - sessionAge;

    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.error('❌ 세션 시간 조회 오류:', error);
    return null;
  }
}

/**
 * 세션 만료 경고 필요 여부
 * 세션 만료 30분 전에 true 반환
 * @returns 경고 필요 여부
 */
export function shouldWarnSessionExpiry(): boolean {
  const remaining = getSessionRemainingTime();

  if (remaining === null) {
    return false;
  }

  const warningThreshold = 30 * 60 * 1000; // 30분
  return remaining > 0 && remaining <= warningThreshold;
}
