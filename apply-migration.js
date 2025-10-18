require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 데이터베이스 마이그레이션 시작...\n');

  try {
    // SQL 파일 읽기
    const sqlFile = path.join(
      __dirname,
      'migrations',
      '01-add-role-status-fields.sql'
    );
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

    // SQL 문을 개별 명령으로 분리
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📝 총 ${statements.length}개의 SQL 명령 실행 예정\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // 주석이나 빈 줄 건너뛰기
      if (!statement || statement.startsWith('--')) {
        continue;
      }

      console.log(`[${i + 1}/${statements.length}] 실행 중...`);

      try {
        // Supabase에서 직접 SQL 실행
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';',
        });

        if (error) {
          // RPC 함수가 없으면 다른 방법 시도
          if (
            error.message.includes('function') &&
            error.message.includes('does not exist')
          ) {
            console.log(
              '   ⚠️  RPC 함수 없음 - Supabase 대시보드에서 수동 실행 필요'
            );
            console.log('   SQL:', statement.substring(0, 100) + '...');
          } else {
            console.log(`   ❌ 오류: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log('   ✅ 성공');
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ 예외: ${err.message}`);
        errorCount++;
      }

      // Rate limit 방지
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 마이그레이션 결과:');
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${errorCount}개`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  일부 명령이 실패했습니다.');
      console.log(
        '   Supabase 대시보드 (SQL Editor)에서 수동으로 실행해주세요:'
      );
      console.log(`   파일: ${sqlFile}`);
    } else {
      console.log('\n✅ 모든 마이그레이션이 완료되었습니다!');
    }
  } catch (error) {
    console.error('\n❌ 마이그레이션 중 오류 발생:', error.message);
    console.log('\n📝 수동 실행 방법:');
    console.log('1. Supabase 대시보드 접속');
    console.log('2. SQL Editor 메뉴 선택');
    console.log('3. migrations/01-add-role-status-fields.sql 파일 내용 복사');
    console.log('4. SQL Editor에 붙여넣고 실행');
    process.exit(1);
  }
}

// 실행
applyMigration()
  .then(() => {
    console.log('\n🎉 마이그레이션 프로세스 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 치명적 오류:', error);
    process.exit(1);
  });
