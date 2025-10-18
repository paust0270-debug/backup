const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const slotTables = [
  'slot_coupangvip',
  'slot_coupangapp',
  'slot_naver',
  'slot_place',
  'slot_todayhome',
  'slot_aliexpress',
  'slot_copangrank',
  'slot_naverrank',
  'slot_placerank',
];

async function updateTableDistributor(tableName) {
  try {
    console.log(`\n🔄 ${tableName} 테이블 업데이트 중...`);

    // 1. 테이블 존재 여부 확인
    const { error: checkError } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);

    if (checkError) {
      if (
        checkError.code === 'PGRST116' ||
        checkError.message.includes('does not exist')
      ) {
        console.log(`⏭️  ${tableName}: 테이블이 존재하지 않음, 건너뜀`);
        return { updated: 0, skipped: 0, notFound: true };
      }
      console.error(`❌ ${tableName} 확인 오류:`, checkError);
      return { updated: 0, skipped: 0, error: true };
    }

    // 2. 모든 고유한 customer_id 조회 (keyword 조건 없이)
    const { data: uniqueCustomers, error: customersError } = await supabase
      .from(tableName)
      .select('customer_id')
      .not('customer_id', 'is', null);

    if (customersError) {
      console.error(`❌ ${tableName} customer_id 조회 오류:`, customersError);
      return { updated: 0, skipped: 0, error: true };
    }

    if (!uniqueCustomers || uniqueCustomers.length === 0) {
      console.log(`⏭️  ${tableName}: 데이터 없음`);
      return { updated: 0, skipped: 0, empty: true };
    }

    // 중복 제거
    const uniqueCustomerIds = [
      ...new Set(uniqueCustomers.map(c => c.customer_id)),
    ];
    console.log(`   📋 ${uniqueCustomerIds.length}명의 고객 발견`);

    let updatedCount = 0;
    let skippedCount = 0;

    // 3. 각 고객에 대해 user_profiles에서 distributor 조회 후 업데이트
    for (const customerId of uniqueCustomerIds) {
      // user_profiles에서 distributor 조회
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('distributor')
        .eq('username', customerId)
        .single();

      if (userError || !userProfile) {
        console.log(`   ⏭️  ${customerId}: user_profiles에 없음`);
        skippedCount++;
        continue;
      }

      const correctDistributor = userProfile.distributor;

      // 테이블 업데이트 (모든 레코드)
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ distributor: correctDistributor })
        .eq('customer_id', customerId);

      if (updateError) {
        console.error(`   ❌ ${customerId} 업데이트 오류:`, updateError);
      } else {
        console.log(`   ✅ ${customerId} → "${correctDistributor}"`);
        updatedCount++;
      }
    }

    console.log(
      `   📊 ${tableName}: 업데이트 ${updatedCount}명, 건너뜀 ${skippedCount}명`
    );
    return { updated: updatedCount, skipped: skippedCount };
  } catch (error) {
    console.error(`❌ ${tableName} 업데이트 중 오류:`, error);
    return { updated: 0, skipped: 0, error: true };
  }
}

async function updateAllSlotTables() {
  console.log('🚀 모든 슬롯 테이블의 distributor 최종 업데이트 시작...');

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalNotFound = 0;

  for (const tableName of slotTables) {
    const result = await updateTableDistributor(tableName);
    totalUpdated += result.updated || 0;
    totalSkipped += result.skipped || 0;
    if (result.notFound) totalNotFound++;
  }

  console.log('\n\n🎉 전체 업데이트 완료!');
  console.log(`   ✅ 총 업데이트: ${totalUpdated}명`);
  console.log(`   ⏭️  총 건너뜀: ${totalSkipped}명`);
  console.log(`   ❌ 테이블 없음: ${totalNotFound}개`);
}

updateAllSlotTables();
