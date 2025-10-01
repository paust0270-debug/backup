import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Supabase 연결 확인
if (!supabase) {
  console.error('❌ Supabase 클라이언트 초기화 실패');
  throw new Error('Supabase 클라이언트가 초기화되지 않았습니다. 환경 변수를 확인하세요.');
}

// 슬롯 현황 조회
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 슬롯 현황 조회 중...');

    const { searchParams } = new URL(request.url);
    const userGroup = searchParams.get('userGroup');
    const searchQuery = searchParams.get('search');
    const customerId = searchParams.get('customerId'); // 특정 고객 ID 파라미터
    const username = searchParams.get('username'); // 실제 고객명 (customer_id와 매칭)
    const type = searchParams.get('type'); // 'slots' 또는 'slot_status' 구분

    // type 파라미터에 따라 다른 테이블 조회
    if (type === 'slot_status') {
      // slot_status 테이블 조회 (쿠팡 앱 추가 페이지용)
      let slotStatusQuery = supabase
        .from('slot_status')
        .select('*')
        .order('created_at', { ascending: false });

      // 개별 고객 필터링 (customerId와 username이 있는 경우)
      if (customerId && username) {
        slotStatusQuery = slotStatusQuery.eq('customer_id', username);
        console.log('🔍 개별 고객 슬롯 필터링:', { customerId, username });
      }

      const { data: slotStatusData, error: slotStatusError } = await slotStatusQuery;

      if (slotStatusError) {
        console.error('slot_status 데이터 조회 오류:', slotStatusError);
        return NextResponse.json(
          { error: '슬롯 등록 데이터를 불러오는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // slots 테이블에서 동일한 고객의 데이터 조회 (잔여기간/등록일·만료일 계산용)
      let slotsData = null;
      if (customerId && username) {
        const { data: slotsQueryData, error: slotsError } = await supabase
          .from('slots')
          .select('*')
          .eq('customer_id', username)
          .order('created_at', { ascending: false });

        if (!slotsError) {
          slotsData = slotsQueryData;
          console.log('🔍 slots 테이블 데이터 조회 완료:', slotsData?.length || 0, '개');
        } else {
          console.error('slots 테이블 조회 오류:', slotsError);
        }
      }

      // slot_status 데이터를 슬롯 등록 목록 형식으로 변환 (사용자별 순번 1번부터 시작)
      const formattedSlotStatusData = slotStatusData?.map((slot, index) => {
        // slots 테이블에서 동일한 usage_days를 가진 데이터 찾기
        const matchingSlot = slotsData?.find(s => s.usage_days === slot.usage_days);
        
        // slots 테이블 데이터가 있으면 그것을 사용, 없으면 slot_status 데이터 사용
        const baseData = matchingSlot || slot;
        
        console.log('슬롯 매칭 확인:', {
          slot_status_id: slot.id,
          slot_status_usage_days: slot.usage_days,
          slot_status_created_at: slot.created_at,
          matching_slot_found: !!matchingSlot,
          matching_slot_created_at: matchingSlot?.created_at,
          final_created_at: baseData.created_at,
          using_slots_data: !!matchingSlot
        });
        
        
        
        // 만료일 기준 잔여기간 계산 (일, 시간, 분 단위)
        const now = new Date();
        const createdDate = baseData.created_at ? new Date(baseData.created_at) : now;
        const usageDays = baseData.usage_days || 0;
        
        // 만료일 계산 (created_at + usage_days) - DB의 updated_at 대신 직접 계산
        const expiryDate = new Date(createdDate.getTime() + usageDays * 24 * 60 * 60 * 1000);
        
        // 실제 잔여 시간 계산 (밀리초)
        const remainingMs = Math.max(0, expiryDate.getTime() - now.getTime());
        
        // 잔여 시간을 일, 시간, 분으로 변환
        const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
        const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
        
        // 잔여기간 문자열 생성
        let remainingTimeString = '';
        if (remainingDays > 0) {
          remainingTimeString += `${remainingDays}일`;
        }
        if (remainingHours > 0) {
          remainingTimeString += (remainingTimeString ? ' ' : '') + `${remainingHours}시간`;
        }
        if (remainingMinutes > 0) {
          remainingTimeString += (remainingTimeString ? ' ' : '') + `${remainingMinutes}분`;
        }
        if (!remainingTimeString) {
          remainingTimeString = '만료됨';
        }
        
        // 등록일과 만료일 계산 (slots 테이블 기준)
        const registrationDate = createdDate.toISOString().split('T')[0];
        const expiryDateString = usageDays > 0 ? 
          new Date(createdDate.getTime() + usageDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '';
        
        return {
          id: index + 1, // 사용자별 순번 1번부터 시작
          db_id: slot.id, // 실제 데이터베이스 ID (삭제용)
          customer_id: slot.customer_id,
          customer_name: slot.customer_name,
          distributor: slot.distributor,
          work_group: slot.work_group,
          keyword: slot.keyword,
          link_url: slot.link_url,
          memo: slot.memo,
          current_rank: slot.current_rank,
          start_rank: slot.start_rank,
          slot_count: slot.slot_count,
          traffic: slot.traffic,
          equipment_group: slot.equipment_group,
          usage_days: slot.usage_days,
          remaining_days: remainingDays,
          remaining_hours: remainingHours,
          remaining_minutes: remainingMinutes,
          remaining_time_string: remainingTimeString,
          registration_date: registrationDate,
          expiry_date: expiryDateString,
          status: slot.status,
          created_at: baseData.created_at // slots 테이블의 created_at 사용
        };
      }) || [];

      // 잔여기간 오름차순 정렬 (적게 남은 것부터)
      const sortedSlotStatusData = formattedSlotStatusData.sort((a, b) => {
        // remaining_days 기준으로 정렬
        if (a.remaining_days !== b.remaining_days) {
          return a.remaining_days - b.remaining_days;
        }
        // remaining_days가 같으면 remaining_hours 기준으로 정렬
        if (a.remaining_hours !== b.remaining_hours) {
          return a.remaining_hours - b.remaining_hours;
        }
        // remaining_hours도 같으면 remaining_minutes 기준으로 정렬
        return a.remaining_minutes - b.remaining_minutes;
      });

      // 정렬된 데이터에 순번 재할당 (잔여기간 오름차순 기준)
      const finalSlotStatusData = sortedSlotStatusData.map((slot, index) => ({
        ...slot,
        id: index + 1 // 잔여기간 오름차순에 따른 순번 재할당
      }));

      return NextResponse.json({
        success: true,
        data: finalSlotStatusData,
        slotsData: slotsData // slots 테이블 데이터도 함께 반환
      });
    }

    // 기본: slots 테이블 조회 (슬롯 현황 페이지용)
    let slotsQuery = supabase
      .from('slots')
      .select('*')
      .order('created_at', { ascending: false });

    // 특정 고객 필터링 (username으로 필터링)
    if (username) {
      slotsQuery = slotsQuery.eq('customer_id', username);
    }

    const { data: slotsData, error: slotsError } = await slotsQuery;

    if (slotsError) {
      console.error('slots 데이터 조회 오류:', slotsError);
      return NextResponse.json(
        { error: '슬롯 데이터를 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 특정 고객이 요청된 경우 해당 고객의 슬롯 현황만 계산
    if (customerId && username) {
      console.log('🔍 특정 고객 슬롯 현황 조회:', { customerId, username });
      
      // 해당 고객의 슬롯 데이터 (이미 username으로 필터링됨)
      const customerSlots = slotsData || [];
      console.log('📊 고객 슬롯 데이터:', customerSlots);
      
      // 해당 고객의 총 슬롯 수 계산
      const totalSlots = customerSlots.reduce((sum, slot) => sum + (slot.slot_count || 0), 0);
      
      // 사용된 슬롯 수는 slot_status 테이블에서 해당 고객의 등록된 작업 수
      let usedSlots = 0;
      try {
        const { data: slotStatusData } = await supabase
          .from('slot_status')
          .select('slot_count')
          .eq('customer_id', username);
        
        usedSlots = slotStatusData?.reduce((sum, slot) => sum + (slot.slot_count || 0), 0) || 0;
      } catch (error) {
        console.error('slot_status 조회 오류:', error);
      }
      
      // 사용 가능한 슬롯 수 계산
      const remainingSlots = Math.max(0, totalSlots - usedSlots);
      
      console.log('📈 슬롯 현황 계산 결과:', {
        totalSlots,
        usedSlots,
        remainingSlots,
        customerSlotsCount: customerSlots.length
      });
      
      // 고객 정보 조회 (slots 테이블에서 customer_name 우선 사용)
      let customerName = '';
      let distributor = '본사';
      
      // slots 테이블에서 customer_name 조회
      if (customerSlots && customerSlots.length > 0) {
        customerName = customerSlots[0].customer_name || '';
        distributor = customerSlots[0].work_group || '본사';
      }
      
      // customer_name이 없으면 users 테이블에서 조회
      if (!customerName) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('name, distributor')
            .eq('username', username)
            .single();
          
          if (userData) {
            customerName = userData.name || '';
            distributor = userData.distributor || '본사';
          }
        } catch (error) {
          console.error('고객 정보 조회 오류:', error);
        }
      }
      
      return NextResponse.json({
        success: true,
        data: [{
          id: customerId,
          customerId: customerId,
          customerName: customerName,
          slotType: customerSlots[0]?.slot_type || '쿠팡',
          slotCount: totalSlots,
          usedSlots: usedSlots,
          remainingSlots: remainingSlots,
          pausedSlots: 0,
          totalPaymentAmount: customerSlots.reduce((sum, slot) => sum + (slot.payment_amount || 0), 0),
          remainingDays: customerSlots[0]?.usage_days || 0,
          registrationDate: customerSlots[0]?.created_at ? new Date(customerSlots[0].created_at).toISOString().split('T')[0] : '',
          expiryDate: customerSlots[0]?.created_at && customerSlots[0]?.usage_days ? 
            new Date(new Date(customerSlots[0].created_at).getTime() + customerSlots[0].usage_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
          // slot_status 테이블의 개별 슬롯 정보도 함께 반환
          slotStatusData: await (async () => {
            try {
              const { data: slotStatusData } = await supabase
                .from('slot_status')
                .select('*')
                .eq('customer_id', username)
                .order('created_at', { ascending: false });
              
              return slotStatusData?.map((slot, index) => {
                const now = new Date();
                const createdDate = slot.created_at ? new Date(slot.created_at) : now;
                const usageDays = slot.usage_days || 0;
                
                // 만료일 계산 (created_at + usage_days)
                const expiryDate = new Date(createdDate.getTime() + usageDays * 24 * 60 * 60 * 1000);
                
                // 실제 잔여 시간 계산 (밀리초)
                const remainingMs = Math.max(0, expiryDate.getTime() - now.getTime());
                
                // 잔여 시간을 일, 시간, 분으로 변환
                const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
                const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
                
                // 잔여기간 문자열 생성
                let remainingTimeString = '';
                if (remainingDays > 0) {
                  remainingTimeString += `${remainingDays}일`;
                }
                if (remainingHours > 0) {
                  remainingTimeString += (remainingTimeString ? ' ' : '') + `${remainingHours}시간`;
                }
                if (remainingMinutes > 0) {
                  remainingTimeString += (remainingTimeString ? ' ' : '') + `${remainingMinutes}분`;
                }
                if (!remainingTimeString) {
                  remainingTimeString = '만료됨';
                }
                
                return {
                  id: index + 1,
                  db_id: slot.id,
                  usage_days: slot.usage_days,
                  remaining_time_string: remainingTimeString,
                  registration_date: createdDate.toISOString().split('T')[0],
                  expiry_date: usageDays > 0 ? 
                    new Date(createdDate.getTime() + usageDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
                  created_at: slot.created_at
                };
              }) || [];
            } catch (error) {
              console.error('slot_status 데이터 조회 오류:', error);
              return [];
            }
          })(),
          addDate: customerSlots[0]?.created_at ? new Date(customerSlots[0].created_at).toISOString().split('T')[0] : '',
          status: customerSlots[0]?.status || '작동중',
          userGroup: distributor
        }],
        stats: {
          totalSlots,
          usedSlots,
          remainingSlots,
          totalCustomers: 1
        }
      });
    }

    // 만료된 슬롯들을 자동으로 만료 상태로 업데이트
    const expiredSlots = slotsData?.filter(slot => {
      if (!slot.created_at || !slot.usage_days || slot.status === '만료') return false;
      
      const now = new Date();
      const createdDate = new Date(slot.created_at);
      const expiryDate = new Date(createdDate.getTime() + slot.usage_days * 24 * 60 * 60 * 1000);
      
      return now.getTime() >= expiryDate.getTime();
    }) || [];

    // 만료된 슬롯들을 데이터베이스에서 업데이트
    if (expiredSlots.length > 0) {
      console.log(`🔄 ${expiredSlots.length}개의 슬롯이 만료되어 상태를 업데이트합니다.`);
      
      const expiredSlotIds = expiredSlots.map(slot => slot.id);
      
      const { error: updateError } = await supabase
        .from('slots')
        .update({ 
          status: '만료'
          // updated_at은 만료일이므로 상태 업데이트 시 변경하지 않음
        })
        .in('id', expiredSlotIds);
      
      if (updateError) {
        console.error('만료된 슬롯 상태 업데이트 오류:', updateError);
      } else {
        console.log(`✅ ${expiredSlots.length}개의 슬롯이 만료 상태로 업데이트되었습니다.`);
        
        // 업데이트된 슬롯들의 상태를 로컬 데이터에서도 변경
        slotsData?.forEach(slot => {
          if (expiredSlotIds.includes(slot.id)) {
            slot.status = '만료';
          }
        });
      }
    }

    // slots 데이터를 슬롯 현황 형식으로 변환
    const formattedSlotStatusData = slotsData?.map(slot => {
      // 실제 사용시간 기반 잔여기간 계산 (일, 시간, 분 단위)
      const now = new Date();
      const createdDate = slot.created_at ? new Date(slot.created_at) : now;
      const usageDays = slot.usage_days || 0;
      
      // 만료일 계산 (created_at + usage_days) - DB의 updated_at 대신 직접 계산
      const expiryDate = new Date(createdDate.getTime() + usageDays * 24 * 60 * 60 * 1000);
      
      // 실제 잔여 시간 계산 (밀리초)
      const remainingMs = Math.max(0, expiryDate.getTime() - now.getTime());
      
      // 잔여 시간을 일, 시간, 분으로 변환
      const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
      const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      
      // 잔여기간 문자열 생성
      let remainingTimeString = '';
      if (remainingDays > 0) {
        remainingTimeString += `${remainingDays}일`;
      }
      if (remainingHours > 0) {
        remainingTimeString += (remainingTimeString ? ' ' : '') + `${remainingHours}시간`;
      }
      if (remainingMinutes > 0) {
        remainingTimeString += (remainingTimeString ? ' ' : '') + `${remainingMinutes}분`;
      }
      if (!remainingTimeString) {
        remainingTimeString = '만료됨';
      }
      
      // 등록일과 만료일 계산
      const registrationDate = createdDate.toISOString().split('T')[0];
      const expiryDateString = usageDays > 0 ? 
        new Date(createdDate.getTime() + usageDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '';
      
      // 만료 여부 확인 (잔여 시간이 0이면 만료)
      const isExpired = remainingMs === 0 && usageDays > 0;
      
      return {
        id: slot.id,
        customerId: slot.customer_id,
        customerName: '', // 별도로 조회 필요
        slotType: slot.slot_type || '쿠팡',
        slotCount: slot.slot_count || 1,
        usedSlots: 0, // slot_status 테이블에서 계산
        remainingSlots: slot.slot_count || 1,
        pausedSlots: 0,
        totalPaymentAmount: slot.payment_amount || 0,
        remainingDays: remainingDays,
        remainingHours: remainingHours,
        remainingMinutes: remainingMinutes,
        remainingTimeString: remainingTimeString,
        registrationDate: registrationDate,
        expiryDate: expiryDateString,
        addDate: slot.created_at ? new Date(slot.created_at).toISOString().split('T')[0] : '',
        status: isExpired ? 'expired' : slot.status,
        userGroup: '본사' // 별도로 조회 필요
      };
    }) || [];

    // 검색 필터링
    let filteredData = formattedSlotStatusData;
    if (searchQuery) {
      filteredData = filteredData.filter(slot =>
        slot.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slot.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }


    // 통계 계산
    const stats = {
      totalSlots: filteredData.reduce((sum, slot) => sum + slot.slotCount, 0),
      usedSlots: filteredData.reduce((sum, slot) => sum + slot.usedSlots, 0),
      remainingSlots: filteredData.reduce((sum, slot) => sum + slot.remainingSlots, 0),
      totalCustomers: filteredData.length
    };

    console.log('✅ 슬롯 현황 조회 완료');
    console.log(`📊 총 ${filteredData.length}개의 슬롯 데이터 조회됨`);

    return NextResponse.json({
      success: true,
      data: filteredData,
      stats: stats
    });

  } catch (error) {
    console.error('슬롯 현황 조회 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 등록 (개별 슬롯 할당 로직)
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 개별 슬롯 할당 처리 중...');
    
    const body = await request.json();
    console.log('받은 데이터:', body);

    // 필수 필드 검증
    const requiredFields = ['customer_id', 'customer_name', 'keyword', 'link_url', 'slot_count'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `필수 필드가 누락되었습니다: ${field}` },
          { status: 400 }
        );
      }
    }

    const requestedSlotCount = parseInt(body.slot_count);
    const customerId = body.customer_id;

    console.log(`🎯 고객 ${customerId}에게 ${requestedSlotCount}개 슬롯 할당 요청`);

    // 1. slots 테이블에서 해당 고객의 사용 가능한 슬롯 조회 (usage_days 내림차순)
    const { data: availableSlots, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('usage_days', { ascending: false }); // 잔여기간이 긴 순서로 정렬

    if (slotsError) {
      console.error('사용 가능한 슬롯 조회 오류:', slotsError);
      return NextResponse.json(
        { error: '사용 가능한 슬롯을 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!availableSlots || availableSlots.length === 0) {
      console.log('❌ 할당 가능한 슬롯이 없습니다.');
      return NextResponse.json(
        { error: '할당 가능한 슬롯이 없습니다.' },
        { status: 400 }
      );
    }

    console.log('📊 사용 가능한 슬롯 목록:', availableSlots);

    // 1.5. 현재 사용 중인 슬롯 수 확인
    const { data: currentSlotStatus } = await supabase
      .from('slot_status')
      .select('slot_count')
      .eq('customer_id', customerId);
    
    const currentUsedSlots = currentSlotStatus?.reduce((sum, slot) => sum + (slot.slot_count || 0), 0) || 0;
    const totalAvailableSlots = availableSlots.reduce((sum, slot) => sum + (slot.slot_count || 0), 0);
    const remainingSlots = totalAvailableSlots - currentUsedSlots;
    
    console.log('📊 슬롯 현황:', {
      totalAvailableSlots,
      currentUsedSlots,
      remainingSlots,
      requestedSlotCount
    });

    // 슬롯 부족 검증
    if (remainingSlots < requestedSlotCount) {
      console.log(`❌ 슬롯 부족: 요청 ${requestedSlotCount}개, 사용 가능 ${remainingSlots}개`);
      return NextResponse.json(
        { error: `슬롯이 부족합니다. 사용 가능한 슬롯: ${remainingSlots}개, 요청한 슬롯: ${requestedSlotCount}개` },
        { status: 400 }
      );
    }

    // 2. 요청된 슬롯 수만큼 순차적으로 할당
    const slotStatusEntries = [];
    let remainingRequestedSlots = requestedSlotCount;

    for (const slot of availableSlots) {
      if (remainingRequestedSlots <= 0) break;

      const availableCount = slot.slot_count || 0;
      const assignCount = Math.min(remainingRequestedSlots, availableCount);

      if (assignCount > 0) {
        // 개별 슬롯을 slot_status 테이블에 저장 (각각 slot_count: 1)
        for (let i = 0; i < assignCount; i++) {
          slotStatusEntries.push({
            customer_id: customerId,
            customer_name: body.customer_name,
            distributor: body.distributor || '일반',
            work_group: body.work_group || '공통',
            keyword: body.keyword,
            link_url: body.link_url,
            memo: body.memo || '',
            current_rank: body.current_rank || '1 [0]',
            start_rank: body.start_rank || '1 [0]',
            slot_count: 1, // 개별 슬롯은 항상 1개
            traffic: body.traffic || '0 (0/0)',
            equipment_group: body.equipment_group || '지정안함',
            usage_days: slot.usage_days, // 원본 슬롯의 잔여기간 사용
            status: body.status || '작동중',
            slot_type: body.slot_type || '쿠팡',
            created_at: new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('.')[0],
            updated_at: new Date(new Date().getTime() + 9 * 60 * 60 * 1000 + (slot.usage_days || 0) * 24 * 60 * 60 * 1000).toISOString().split('.')[0]
          });
        }

        remainingRequestedSlots -= assignCount;
        console.log(`✅ 슬롯 ID ${slot.id}에서 ${assignCount}개 할당 (잔여기간: ${slot.usage_days}일)`);
      }
    }

    if (slotStatusEntries.length === 0) {
      console.log('❌ 할당할 수 있는 슬롯이 없습니다.');
      return NextResponse.json(
        { error: '할당할 수 있는 슬롯이 없습니다.' },
        { status: 400 }
      );
    }

    // 3. slot_status 테이블에 개별 슬롯들 삽입
    const { data: insertedData, error: insertError } = await supabase
      .from('slot_status')
      .insert(slotStatusEntries)
      .select();

    if (insertError) {
      console.error('개별 슬롯 저장 오류:', insertError);
      return NextResponse.json(
        { error: `개별 슬롯 저장 중 오류가 발생했습니다: ${insertError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ ${insertedData.length}개의 개별 슬롯이 성공적으로 할당되었습니다.`);
    console.log('📋 할당된 슬롯 상세:', insertedData);

    // 4. keywords 테이블에 키워드 정보 자동 저장 (슬롯 등록 시에만)
    try {
      console.log('🔄 keywords 테이블에 키워드 정보 저장 중...');
      
      const keywordEntries = insertedData.map(slot => ({
        slot_type: slot.slot_type || 'coupang',
        keyword: slot.keyword,
        link_url: slot.link_url,
        slot_count: 1, // 개별 슬롯은 항상 1개
        current_rank: null, // 순위 체크 후 업데이트
        last_check_date: new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('.')[0]
      }));

      const { data: keywordData, error: keywordError } = await supabase
        .from('keywords')
        .insert(keywordEntries)
        .select();

      if (keywordError) {
        console.error('keywords 테이블 저장 오류:', keywordError);
        // keywords 저장 실패해도 슬롯 등록은 성공으로 처리
        console.log('⚠️ keywords 저장 실패했지만 슬롯 등록은 성공');
      } else {
        console.log(`✅ ${keywordData.length}개의 키워드가 keywords 테이블에 저장되었습니다.`);
        console.log('📋 저장된 키워드 상세:', keywordData);
      }
    } catch (keywordError) {
      console.error('keywords 테이블 저장 예외:', keywordError);
      // keywords 저장 실패해도 슬롯 등록은 성공으로 처리
      console.log('⚠️ keywords 저장 실패했지만 슬롯 등록은 성공');
    }

    return NextResponse.json({
      success: true,
      data: insertedData,
      message: `${insertedData.length}개의 슬롯이 성공적으로 할당되었습니다.`,
      allocatedCount: insertedData.length,
      requestedCount: requestedSlotCount
    });

  } catch (error) {
    console.error('개별 슬롯 할당 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 개별 슬롯 삭제
export async function DELETE(request: NextRequest) {
  try {
    console.log('🔄 개별 슬롯 삭제 처리 중...');
    
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('id');

    if (!slotId) {
      return NextResponse.json(
        { error: '삭제할 슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🗑️ 슬롯 ID ${slotId} 삭제 요청`);

    // slot_status 테이블에서 해당 슬롯 삭제
    const { error: deleteError } = await supabase
      .from('slot_status')
      .delete()
      .eq('id', slotId);

    if (deleteError) {
      console.error('슬롯 삭제 오류:', deleteError);
      return NextResponse.json(
        { error: `슬롯 삭제 중 오류가 발생했습니다: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ 슬롯 ID ${slotId} 삭제 완료`);
    return NextResponse.json({
      success: true,
      message: '슬롯이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('슬롯 삭제 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
