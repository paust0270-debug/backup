import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    console.log('미정산 내역 조회 시작');

    // URL 파라미터에서 필터링 조건 가져오기
    const { searchParams } = new URL(request.url);
    const distributorFilter = searchParams.get('distributor_name');

    console.log('📋 미정산 내역 조회 - 필터:', { distributorFilter });

    // settlements 테이블에서 pending 상태의 데이터 조회
    const { data: pendingSettlements, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('미정산 내역 조회 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: '미정산 내역을 조회하는 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }

    console.log(
      '미정산 내역 조회 완료:',
      pendingSettlements?.length || 0,
      '개'
    );

    // 각 settlement에 대해 customer 정보 조회
    const settlementItems = [];
    for (const settlement of pendingSettlements || []) {
      let distributorName = '-';

      if (settlement.customer_id) {
        try {
          // user_profiles 테이블에서 username으로 distributor 정보 조회
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('distributor')
            .eq('username', settlement.customer_id)
            .single();

          distributorName = userProfile?.distributor || '-';
          console.log(
            `고객 ${settlement.customer_id}의 총판: ${distributorName}`
          );
        } catch (userError) {
          console.warn(
            '사용자 정보 조회 실패:',
            settlement.customer_id,
            userError
          );
        }
      }

      // 총판 필터링 적용
      if (distributorFilter && distributorName !== distributorFilter) {
        console.log(
          `❌ 필터링: ${settlement.customer_id} (${distributorName} !== ${distributorFilter})`
        );
        continue; // 필터와 맞지 않으면 건너뛰기
      }

      settlementItems.push({
        id: settlement.id,
        customer_id: settlement.customer_id,
        customer_name: settlement.customer_name,
        slot_type: settlement.slot_type,
        slot_count: settlement.slot_count,
        payment_type: settlement.payment_type,
        payer_name: settlement.payer_name,
        payment_amount: settlement.payment_amount,
        slot_addition_date: settlement.created_at,
        usage_days: settlement.usage_days,
        memo: settlement.memo,
        status: settlement.status,
        created_at: settlement.created_at,
        distributor_name: distributorName,
        type: settlement.payment_type === 'extension' ? 'extension' : 'deposit',
      });
    }

    console.log(`✅ 필터링 완료: ${settlementItems.length}개 항목 반환`);

    return NextResponse.json({
      success: true,
      data: settlementItems,
    });
  } catch (error) {
    console.error('미정산 내역 조회 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '미정산 내역을 조회하는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
