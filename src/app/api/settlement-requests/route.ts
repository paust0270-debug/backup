import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settlementData } = body;

    if (!settlementData || !Array.isArray(settlementData)) {
      return NextResponse.json(
        {
          success: false,
          error: '정산 데이터가 올바르지 않습니다.',
        },
        { status: 400 }
      );
    }

    console.log('정산요청 데이터:', settlementData);

    // settlements 테이블에서 해당 ID들의 상태를 'completed'로 업데이트 (정산대기 상태)
    // 제약조건 문제로 인해 임시로 completed 사용
    const settlementIds = settlementData.map((item: { id: string }) => item.id);

    const { data, error } = await supabase
      .from('settlements')
      .update({ status: 'completed' })
      .in('id', settlementIds)
      .select();

    if (error) {
      console.error('정산요청 상태 업데이트 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: `정산요청 저장에 실패했습니다: ${error.message}`,
        },
        { status: 500 }
      );
    }

    console.log('정산요청 상태 업데이트 완료:', data?.length || 0, '개');

    return NextResponse.json({
      success: true,
      data: data,
      message: `${settlementData.length}개의 정산요청이 성공적으로 저장되었습니다.`,
    });
  } catch (error) {
    console.error('정산요청 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// 정산요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const distributor = searchParams.get('distributor');
    const distributorFilter = searchParams.get('distributor_name'); // 총판 필터링용

    console.log('📋 정산요청 조회 시작 - 필터:', {
      status,
      distributor,
      distributorFilter,
    });

    // settlements 테이블에서 데이터 조회
    // status 파라미터에 따라 다른 상태 조회
    const targetStatus = status === 'history' ? 'history' : 'completed';
    console.log('조회할 상태:', targetStatus);

    let query = supabase
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
      .eq('status', targetStatus)
      .order('created_at', { ascending: false });

    if (distributor && distributor !== '전체') {
      query = query.eq('distributor_name', distributor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('정산요청 조회 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: `정산요청 조회에 실패했습니다: ${error.message}`,
        },
        { status: 500 }
      );
    }

    console.log('정산요청 조회 결과:', data?.length || 0, '개');

    // 각 settlement에 대해 user_profiles에서 distributor 정보 조회
    const processedData = [];
    for (const item of data || []) {
      let distributorName = '-';

      if (item.customer_id) {
        try {
          // user_profiles 테이블에서 username으로 distributor 정보 조회
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('distributor')
            .eq('username', item.customer_id)
            .single();

          distributorName = userProfile?.distributor || '-';
          console.log(`고객 ${item.customer_id}의 총판: ${distributorName}`);
        } catch (userError) {
          console.warn('사용자 정보 조회 실패:', item.customer_id, userError);
        }
      }

      // 총판 필터링 적용
      if (distributorFilter && distributorName !== distributorFilter) {
        console.log(
          `❌ 필터링: ${item.customer_id} (${distributorName} !== ${distributorFilter})`
        );
        continue; // 필터와 맞지 않으면 건너뛰기
      }

      processedData.push({
        ...item,
        distributor_name: distributorName, // user_profiles에서 가져온 실제 총판명
        customer_name: item.customer_name || item.customer_id, // 기본값 설정
        category:
          item.payment_type === 'extension'
            ? '연장'
            : item.payment_type === 'deposit'
              ? '입금'
              : '일반',
        slot_addition_date: item.created_at,
      });
    }

    console.log(`✅ 필터링 완료: ${processedData.length}개 항목 반환`);

    return NextResponse.json({
      success: true,
      data: processedData,
    });
  } catch (error) {
    console.error('정산요청 조회 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
