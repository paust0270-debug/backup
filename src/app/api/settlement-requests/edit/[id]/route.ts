import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 특정 settlement_history와 연결된 개별 settlements 항목들 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const settlementHistoryId = id;
    console.log(
      '정산수정용 데이터 조회 시작, settlement_history ID:',
      settlementHistoryId
    );

    // 1. settlement_history에서 해당 ID의 정보 조회
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select(
        'id, payer_name, memo, payment_amount, customer_id, slot_count, slot_type, distributor_name, customer_name, payment_type, usage_days, status, created_at'
      )
      .eq('id', settlementHistoryId)
      .single();

    if (historyError) {
      console.error('settlement_history 조회 오류 상세:', historyError);
      console.error('조회 시도한 ID:', settlementHistoryId);
      return NextResponse.json(
        {
          success: false,
          error: `settlement_history 조회 중 오류가 발생했습니다: ${historyError.message || historyError}`,
        },
        { status: 500 }
      );
    }

    if (!historyData) {
      console.error('settlement_history 데이터를 찾을 수 없음');
      return NextResponse.json(
        {
          success: false,
          error: '정산내역 데이터를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    console.log('조회된 settlement_history 데이터:', historyData);

    // 2. 해당 정산에 포함된 개별 settlements 항목들 조회
    // 깃허브 20250914 백업 파일 로직: 정산 완료 시점을 기준으로 최근 settlements만 조회
    const { data: settlementsData, error: settlementsError } = await supabase
      .from('settlements')
      .select(
        `
        id,
        customer_id,
        customer_name,
        distributor_name,
        slot_type,
        slot_count,
        payment_type,
        payer_name,
        payment_amount,
        usage_days,
        memo,
        status,
        created_at,
        updated_at
      `
      )
      .eq('customer_id', historyData.customer_id)
      .eq('slot_type', historyData.slot_type)
      .eq('status', 'history') // 정산 완료된 항목들만 조회
      .lte('created_at', historyData.created_at) // 정산 완료 시점 이전의 항목들만
      .order('created_at', { ascending: true });

    if (settlementsError) {
      console.error('settlements 조회 오류:', settlementsError);
      return NextResponse.json(
        {
          success: false,
          error: 'settlements 조회 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }

    console.log(
      '조회된 settlements 데이터:',
      settlementsData?.length || 0,
      '개'
    );

    // 3. 슬롯수와 결제액이 일치하는 settlements만 필터링
    // 깃허브 20250914 백업 파일 로직: 정확한 settlements만 반환
    let filteredSettlements = settlementsData || [];

    console.log(`필터링 전 settlements 개수: ${filteredSettlements.length}개`);
    console.log(
      `settlement_history - 슬롯수: ${historyData.slot_count}, 결제액: ${historyData.payment_amount}`
    );

    // 최근 settlements부터 역순으로 확인하여 일치하는 조합 찾기
    let foundMatch = false;
    for (let i = filteredSettlements.length; i >= 1; i--) {
      const recentSettlements = filteredSettlements.slice(-i);
      const recentTotalSlots = recentSettlements.reduce(
        (sum, settlement) => sum + settlement.slot_count,
        0
      );
      const recentTotalAmount = recentSettlements.reduce(
        (sum, settlement) => sum + settlement.payment_amount,
        0
      );

      console.log(
        `최근 ${i}개 settlements - 슬롯수: ${recentTotalSlots}, 결제액: ${recentTotalAmount}`
      );

      if (
        recentTotalSlots === historyData.slot_count &&
        recentTotalAmount === historyData.payment_amount
      ) {
        filteredSettlements = recentSettlements;
        foundMatch = true;
        console.log(
          `✅ 일치하는 settlements 발견: ${recentSettlements.length}개`
        );
        break;
      }
    }

    if (!foundMatch) {
      console.log(
        '⚠️ 일치하는 settlements 조합을 찾지 못했습니다. 모든 settlements를 반환합니다.'
      );
      // 일치하는 조합을 찾지 못한 경우, 모든 settlements 반환 (최근 2개로 제한하지 않음)
      // filteredSettlements는 이미 모든 데이터를 포함하고 있음
    }

    console.log(`최종 반환할 settlements: ${filteredSettlements.length}개`);

    // 4. 각 settlement에 대해 user_profiles에서 distributor 정보 조회
    const processedSettlements = [];
    for (const settlement of filteredSettlements) {
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

      processedSettlements.push({
        ...settlement,
        distributor_name: distributorName, // user_profiles에서 가져온 실제 총판명
      });
    }

    // 3. settlement_history 정보를 기반으로 정산 정보 구성
    const settlementInfo = {
      payer_name: historyData.payer_name,
      deposit_date: historyData.created_at
        ? historyData.created_at.split('T')[0]
        : new Date().toISOString().split('T')[0],
      memo: historyData.memo || '',
      include_tax_invoice: false,
      totalAmount: historyData.payment_amount,
      baseAmount: historyData.payment_amount,
      taxAmount: Math.floor(historyData.payment_amount * 0.1), // 10% 세액
    };

    return NextResponse.json({
      success: true,
      data: processedSettlements,
      settlementInfo: settlementInfo,
    });
  } catch (error) {
    console.error('정산수정용 데이터 조회 처리 중 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '정산수정용 데이터 조회 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
