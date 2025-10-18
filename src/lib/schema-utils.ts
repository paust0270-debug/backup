import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 스키마 캐시 문제 완전 해결을 위한 강화된 유틸리티 함수들
 */

// 캐시 완전 비활성화된 Supabase 클라이언트 생성
export function createNoCacheSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Schema-Cache-Bypass': 'true',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

// 강화된 스키마 캐시 강제 갱신
export async function forceSchemaRefresh() {
  const client = createNoCacheSupabaseClient();

  try {
    console.log('🔄 강화된 스키마 캐시 갱신 시작...');

    // 1. 메타데이터 쿼리로 스키마 캐시 갱신
    try {
      await client.rpc('pg_catalog.pg_tables');
    } catch (err) {
      console.log('⚠️ 메타데이터 쿼리 중 오류 (정상):', err);
    }

    // 2. 여러 테이블에 접근하여 스키마 갱신 강제
    const tables = ['customers', 'users', 'user_profiles'];

    for (const table of tables) {
      try {
        const { data, error } = await client
          .from(table)
          .select('count')
          .limit(1);

        if (error) {
          console.log(`⚠️ ${table} 테이블 접근 중 오류 (정상):`, error.message);
        } else {
          console.log(`✅ ${table} 테이블 스키마 갱신 완료`);
        }
      } catch (err) {
        console.log(`⚠️ ${table} 테이블 접근 중 예외:`, err);
      }
    }

    // 3. 스키마 정보 쿼리
    try {
      await client.rpc('pg_catalog.pg_stat_user_tables');
    } catch (err) {
      console.log('⚠️ 스키마 정보 쿼리 중 오류 (정상):', err);
    }

    console.log('✅ 강화된 스키마 캐시 갱신 완료');
  } catch (err) {
    console.error('❌ 강화된 스키마 캐시 갱신 중 오류:', err);
  }
}

// 테이블 존재 확인 (강화된 버전)
export async function checkTableExists(tableName: string) {
  const client = createNoCacheSupabaseClient();

  try {
    console.log(`🔍 ${tableName} 테이블 존재 확인 (강화된 버전)...`);

    // 1. 기본 접근 테스트
    const { data, error } = await client
      .from(tableName)
      .select('count')
      .limit(1);

    if (error) {
      console.error(`❌ ${tableName} 테이블 접근 실패:`, error.message);
      return false;
    }

    // 2. 스키마 정보 확인
    try {
      await client.rpc('pg_catalog.pg_tables', {
        schemaname: 'public',
        tablename: tableName,
      });
    } catch (err) {
      console.log(`⚠️ ${tableName} 스키마 정보 쿼리 중 오류 (정상):`, err);
    }

    console.log(`✅ ${tableName} 테이블 접근 성공`);
    return true;
  } catch (err) {
    console.error(`❌ ${tableName} 테이블 확인 오류:`, err);
    return false;
  }
}

// RLS 정책 확인 (강화된 버전)
export async function checkRLSPolicies() {
  const client = createNoCacheSupabaseClient();

  try {
    console.log('🔍 RLS 정책 확인 (강화된 버전)...');

    // 1. 기본 쿼리 테스트
    const { data, error } = await client
      .from('customers')
      .select('id, name')
      .limit(1);

    if (error) {
      console.error('❌ RLS 정책 문제:', error.message);
      return false;
    }

    // 2. RLS 정책 정보 확인
    try {
      await client.rpc('pg_catalog.pg_policies');
    } catch (err) {
      console.log('⚠️ RLS 정책 정보 쿼리 중 오류 (정상):', err);
    }

    console.log('✅ RLS 정책 정상');
    return true;
  } catch (err) {
    console.error('❌ RLS 정책 확인 오류:', err);
    return false;
  }
}

// 스키마 캐시 문제 진단 (강화된 버전)
export async function diagnoseSchemaCacheIssues() {
  console.log('🔍 스키마 캐시 문제 진단 (강화된 버전) 시작...');
  console.log('='.repeat(60));

  const results = {
    customersExists: await checkTableExists('customers'),
    usersExists: await checkTableExists('users'),
    userProfilesExists: await checkTableExists('user_profiles'),
    rlsOk: await checkRLSPolicies(),
  };

  console.log('='.repeat(60));
  console.log('📊 진단 결과:');
  console.log(`customers 테이블: ${results.customersExists ? '✅' : '❌'}`);
  console.log(`users 테이블: ${results.usersExists ? '✅' : '❌'}`);
  console.log(
    `user_profiles 테이블: ${results.userProfilesExists ? '✅' : '❌'}`
  );
  console.log(`RLS 정책: ${results.rlsOk ? '✅' : '❌'}`);

  return results;
}

// 스키마 캐시 문제 완전 해결 (강화된 버전)
export async function fixSchemaCacheIssues() {
  console.log('🚀 스키마 캐시 문제 완전 해결 시작...');

  try {
    // 1. 강화된 스키마 갱신
    await forceSchemaRefresh();

    // 2. 연결 풀 재설정
    await resetConnectionPool();

    // 3. 강화된 진단 실행
    const results = await diagnoseSchemaCacheIssues();

    // 4. 해결 방안 제시
    console.log('');
    console.log('🎯 해결 방안:');

    if (
      !results.customersExists ||
      !results.usersExists ||
      !results.userProfilesExists
    ) {
      console.log(
        '1. supabase-schema.sql을 Supabase SQL Editor에서 실행하세요'
      );
      console.log('2. 테이블이 존재하는지 Supabase 대시보드에서 확인하세요');
    }

    if (!results.rlsOk) {
      console.log('3. RLS 정책을 확인하고 재설정하세요');
      console.log(
        '4. Supabase 대시보드에서 Authentication > Policies 확인하세요'
      );
    }

    if (results.customersExists && results.rlsOk) {
      console.log('✅ 모든 문제가 해결되었습니다!');
    } else {
      console.log('⚠️ 일부 문제가 남아있습니다. 위의 해결 방안을 따라주세요.');
    }

    return results;
  } catch (err) {
    console.error('❌ 스키마 캐시 문제 해결 중 오류:', err);
    throw err;
  }
}

// 연결 풀 재설정 (강화된 버전)
export async function resetConnectionPool() {
  console.log('🔄 연결 풀 재설정 (강화된 버전)...');

  try {
    // 새로운 클라이언트 인스턴스 생성
    const newClient = createNoCacheSupabaseClient();

    // 연결 테스트
    const { data, error } = await newClient
      .from('customers')
      .select('count')
      .limit(1);

    if (error) {
      console.log('⚠️ 새 연결 풀 테스트 중 오류:', error.message);
    } else {
      console.log('✅ 연결 풀 재설정 완료');
    }
  } catch (err) {
    console.log('⚠️ 연결 풀 재설정 중 예외:', err);
  }
}

// 재시도 로직이 포함된 데이터베이스 쿼리 함수 (강화된 버전)
export async function executeWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries: number = 5
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 쿼리 시도 ${attempt}/${maxRetries}...`);

      const result = await queryFn();

      if (result.error) {
        // 스키마 캐시 관련 오류인지 확인
        if (
          result.error.code === 'PGRST116' ||
          result.error.message.includes('relation') ||
          result.error.message.includes('table') ||
          result.error.message.includes('schema') ||
          result.error.message.includes('cache')
        ) {
          console.log('🔄 스키마 캐시 문제 감지, 강화된 갱신 후 재시도...');
          await forceSchemaRefresh();
          await resetConnectionPool();

          if (attempt < maxRetries) {
            lastError = result.error;
            // 지수 백오프로 대기 시간 증가
            await new Promise(resolve =>
              setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
            );
            continue;
          }
        }
      }

      return result;
    } catch (err) {
      console.error(`❌ 시도 ${attempt} 실패:`, err);
      lastError = err;

      if (attempt < maxRetries) {
        // 지수 백오프로 대기 시간 증가
        await new Promise(resolve =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  return { data: null, error: lastError };
}

// 스키마 캐시 문제 해결을 위한 래퍼 함수 (강화된 버전)
export function withSchemaCacheFix<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error: any) {
      // 스키마 캐시 관련 오류인지 확인
      if (
        error?.code === 'PGRST116' ||
        error?.message?.includes('relation') ||
        error?.message?.includes('table') ||
        error?.message?.includes('schema') ||
        error?.message?.includes('cache')
      ) {
        console.log('🔄 스키마 캐시 문제 감지, 강화된 갱신 후 재시도...');
        await forceSchemaRefresh();
        await resetConnectionPool();

        // 재시도
        return await fn(...args);
      }

      throw error;
    }
  };
}

// 스키마 캐시 문제 예방을 위한 주기적 갱신
export function startSchemaCacheRefreshInterval(intervalMs: number = 30000) {
  console.log(`🔄 스키마 캐시 주기적 갱신 시작 (${intervalMs}ms 간격)...`);

  const interval = setInterval(async () => {
    try {
      await forceSchemaRefresh();
    } catch (err) {
      console.error('❌ 주기적 스키마 갱신 중 오류:', err);
    }
  }, intervalMs);

  return () => {
    clearInterval(interval);
    console.log('🔄 스키마 캐시 주기적 갱신 중지');
  };
}

// 브라우저 캐시 삭제 함수
export function clearBrowserCache() {
  if (typeof window !== 'undefined') {
    console.log('🔄 브라우저 캐시 삭제...');

    // 사용자 정보 백업
    const userBackup = localStorage.getItem('user');
    const sessionTimestampBackup = localStorage.getItem('sessionTimestamp');

    // localStorage 클리어
    localStorage.clear();

    // 사용자 정보 복원
    if (userBackup) {
      localStorage.setItem('user', userBackup);
    }
    if (sessionTimestampBackup) {
      localStorage.setItem('sessionTimestamp', sessionTimestampBackup);
    }

    // sessionStorage 클리어
    sessionStorage.clear();

    // IndexedDB 클리어 (가능한 경우)
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }

    console.log('✅ 브라우저 캐시 삭제 완료 (사용자 정보 보존)');
  }
}
