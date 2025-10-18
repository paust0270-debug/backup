const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSlotStatusDistributor() {
  try {
    console.log('🔄 slot_status 테이블의 distributor 업데이트 시작...\n');

    // 1. 모든 고유한 customer_id 조회
    const { data: uniqueCustomers, error: customersError } = await supabase
      .from('slot_status')
      .select('customer_id')
      .not('customer_id', 'is', null);

    if (customersError) {
      console.error('❌ customer_id 조회 오류:', customersError);
      return;
    }

    // 중복 제거
    const uniqueCustomerIds = [
      ...new Set(uniqueCustomers.map(c => c.customer_id)),
    ];
    console.log(`📋 총 ${uniqueCustomerIds.length}명의 고객 발견`);

    let updatedCount = 0;
    let skippedCount = 0;

    // 2. 각 고객에 대해 user_profiles에서 distributor 조회 후 업데이트
    for (const customerId of uniqueCustomerIds) {
      // user_profiles에서 distributor 조회
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('distributor')
        .eq('username', customerId)
        .single();

      if (userError || !userProfile) {
        console.log(`⏭️  ${customerId}: user_profiles에 없음, 건너뜀`);
        skippedCount++;
        continue;
      }

      const correctDistributor = userProfile.distributor;

      // slot_status 업데이트
      const { error: updateError } = await supabase
        .from('slot_status')
        .update({ distributor: correctDistributor })
        .eq('customer_id', customerId);

      if (updateError) {
        console.error(`❌ ${customerId} 업데이트 오류:`, updateError);
      } else {
        console.log(
          `✅ ${customerId}: distributor를 "${correctDistributor}"로 업데이트`
        );
        updatedCount++;
      }
    }

    console.log(`\n📊 업데이트 완료:`);
    console.log(`   ✅ 업데이트: ${updatedCount}명`);
    console.log(`   ⏭️  건너뜀: ${skippedCount}명`);
    console.log(`   📋 총: ${uniqueCustomerIds.length}명`);
  } catch (error) {
    console.error('❌ 업데이트 중 오류:', error);
  }
}

updateSlotStatusDistributor();
