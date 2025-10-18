'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SlotData {
  id: number;
  customerId: string;
  customerName: string;
  slotType: string;
  slotCount: number;
  usedSlots: number;
  remainingSlots: number;
  pausedSlots?: number; // 일시 중지된 슬롯 수
  expiredSlots?: number; // 만료된 슬롯 수
  totalPaymentAmount: number; // 총 입금액
  remainingDays: number; // 잔여일수 (기존 호환성)
  remainingHours: number; // 잔여시간
  remainingMinutes: number; // 잔여분
  remainingTimeString: string; // 잔여기간 문자열
  registrationDate: string; // 등록일
  expiryDate: string; // 만료일
  addDate: string;
  status:
    | 'pending'
    | 'active'
    | 'completed'
    | 'inactive'
    | 'expired'
    | 'paused';
  userGroup: string;
}

function SlotStatusPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [slotData, setSlotData] = useState<SlotData[]>([]);
  const [filteredData, setFilteredData] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilteredByCustomer, setIsFilteredByCustomer] = useState(false);
  const [filteredCustomerInfo, setFilteredCustomerInfo] = useState<{
    id: string;
    username: string;
    name: string;
  } | null>(null);

  // 연장 모달 상태
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [extendForm, setExtendForm] = useState({
    paymentType: 'deposit',
    payerName: '',
    paymentAmount: '',
    paymentDate: '',
    usageDays: '',
  });

  // URL 파라미터에서 고객 정보 확인
  useEffect(() => {
    const customerId = searchParams.get('customerId');
    const username = searchParams.get('username');
    const name = searchParams.get('name');

    if (customerId && username && name) {
      setIsFilteredByCustomer(true);
      setFilteredCustomerInfo({
        id: customerId,
        username: decodeURIComponent(username),
        name: decodeURIComponent(name),
      });
      console.log('고객 필터링 모드:', {
        customerId,
        username: decodeURIComponent(username),
        name: decodeURIComponent(name),
      });
    } else {
      setIsFilteredByCustomer(false);
      setFilteredCustomerInfo(null);
    }
  }, [searchParams]);

  // Supabase에서 슬롯 데이터 가져오기 (모든 슬롯 타입 통합)
  const fetchSlotData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('슬롯 데이터 조회 시작... (모든 타입 통합)');

      // URL 파라미터 직접 확인 (state 대신 URL 우선)
      const customerId = searchParams.get('customerId');
      const username = searchParams.get('username');
      const name = searchParams.get('name');

      console.log('🔍 URL 파라미터:', { customerId, username, name });
      console.log('🔍 isFilteredByCustomer:', isFilteredByCustomer);
      console.log('🔍 filteredCustomerInfo:', filteredCustomerInfo);

      // 개별 고객 필터링 시에는 slots 테이블에서 직접 조회 (URL 파라미터 기준)
      if (customerId && username && name) {
        const customerInfo = {
          id: customerId,
          username: decodeURIComponent(username),
          name: decodeURIComponent(name),
        };
        console.log('✅ 개별 고객 슬롯 현황 조회 (URL 기준):', customerInfo);

        // 1. 슬롯 데이터 조회 (테스트 API 사용 - 이미 user_profiles에서 distributor 조회함)
        const slotsApiUrl = `/api/test-slots?customerId=${customerInfo.username}`;
        console.log('개별 고객 API URL:', slotsApiUrl);

        const response = await fetch(slotsApiUrl);
        const result = await response.json();

        console.log('개별 고객 API 응답:', result);
        console.log(
          '첫 번째 슬롯의 distributor:',
          result.data?.[0]?.distributor
        );

        if (result.success && result.data) {
          // API 데이터를 프론트엔드 형식으로 변환 (미정산 내역 페이지와 동일한 방식)
          const mappedData = result.data.map(slot => {
            console.log('슬롯 매핑 중 - distributor:', slot.distributor);

            // 만료일 계산 (등록일 + 사용일수)
            const createdDate = new Date(slot.created_at);
            const usageDays = slot.usage_days || 10;
            const expiryDate = new Date(
              createdDate.getTime() + usageDays * 24 * 60 * 60 * 1000
            );
            const expiryDateString = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식

            // 잔여기간 계산
            const now = new Date();
            const remainingMs = expiryDate.getTime() - now.getTime();
            const remainingDays = Math.max(
              0,
              Math.floor(remainingMs / (24 * 60 * 60 * 1000))
            );
            const remainingHours = Math.max(
              0,
              Math.floor(
                (remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
              )
            );
            const remainingMinutes = Math.max(
              0,
              Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
            );
            const remainingTimeString = `${remainingDays}일 ${remainingHours}시간 ${remainingMinutes}분`;

            return {
              id: slot.id,
              customerId: slot.customer_id,
              customerName: slot.customer_name,
              slotType: slot.slot_type,
              slotCount: slot.slot_count,
              paymentType: slot.payment_type || 'deposit',
              payerName: slot.payer_name || '-',
              paymentAmount: slot.payment_amount || 0,
              paymentDate: slot.payment_date || '2025-10-17',
              usageDays: usageDays,
              memo: slot.memo || null,
              status: slot.status || 'active',
              createdAt: slot.created_at,
              updatedAt: slot.updated_at || slot.created_at,
              workGroup: slot.work_group || '공통',
              keyword: slot.keyword || null,
              linkUrl: slot.link_url || null,
              equipmentGroup: slot.equipment_group || '지정안함',
              remainingDays: remainingDays,
              remainingHours: remainingHours,
              remainingMinutes: remainingMinutes,
              remainingTimeString: remainingTimeString,
              expiryDate: expiryDateString, // 계산된 만료일 (YYYY-MM-DD)
              distributor: slot.distributor || '-', // API에서 user_profiles 조회한 값
              userGroup: slot.distributor || '-', // API에서 user_profiles 조회한 값
              totalPaymentAmount: slot.payment_amount || 0,
              registrationDate: slot.payment_date || slot.created_at,
            };
          });

          console.log('매핑된 데이터 첫 번째 항목:', mappedData[0]);

          setFilteredData(mappedData);
          setSlotData(mappedData);
          console.log(
            '개별 고객 슬롯 데이터 설정 완료:',
            mappedData.length,
            '개'
          );
        } else {
          console.error('개별 고객 슬롯 데이터 조회 실패:', result.error);
          setError(result.error || '슬롯 데이터를 불러올 수 없습니다.');
        }

        setLoading(false);
        return;
      }

      // 전체 슬롯 현황 조회 (기존 로직)
      // 현재 사용자 권한 확인
      const userStr = localStorage.getItem('user');
      let userDistributor = null;

      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('👤 현재 사용자:', user.username, user.grade);

        // 총판회원: 본인 소속 고객만 조회
        if (user.grade === '총판회원' && user.username !== 'master') {
          userDistributor = user.distributor;
          console.log(`✅ 총판 필터 적용: ${userDistributor}`);
        }
      }

      // 모든 슬롯 타입의 API를 호출하여 데이터 통합
      const apiCalls = [];

      // 1. 쿠팡 슬롯 조회
      let coupangApiUrl = '/api/slot-status';
      if (isFilteredByCustomer && filteredCustomerInfo) {
        coupangApiUrl += `?type=slot_status&customerId=${filteredCustomerInfo.id}&username=${filteredCustomerInfo.username}&name=${encodeURIComponent(filteredCustomerInfo.name)}`;
      } else if (userDistributor) {
        coupangApiUrl += `?distributor=${encodeURIComponent(userDistributor)}`;
      }
      apiCalls.push(fetch(coupangApiUrl).then(res => res.json()));

      // 2. 쿠팡VIP 슬롯 조회
      let coupangVipApiUrl = '/api/slot-coupangvip';
      if (isFilteredByCustomer && filteredCustomerInfo) {
        coupangVipApiUrl += `?type=slot_status&customerId=${filteredCustomerInfo.id}&username=${filteredCustomerInfo.username}&name=${encodeURIComponent(filteredCustomerInfo.name)}`;
      } else if (userDistributor) {
        coupangVipApiUrl += `?distributor=${encodeURIComponent(userDistributor)}`;
      }
      apiCalls.push(fetch(coupangVipApiUrl).then(res => res.json()));

      // 3. 쿠팡APP 슬롯 조회
      let coupangAppApiUrl = '/api/slot-coupangapp';
      if (isFilteredByCustomer && filteredCustomerInfo) {
        coupangAppApiUrl += `?type=slot_status&customerId=${filteredCustomerInfo.id}&username=${filteredCustomerInfo.username}&name=${encodeURIComponent(filteredCustomerInfo.name)}`;
      } else if (userDistributor) {
        coupangAppApiUrl += `?distributor=${encodeURIComponent(userDistributor)}`;
      }
      apiCalls.push(fetch(coupangAppApiUrl).then(res => res.json()));

      // 4. 네이버쇼핑 슬롯 조회
      let naverApiUrl = '/api/slot-naver';
      if (isFilteredByCustomer && filteredCustomerInfo) {
        naverApiUrl += `?type=slot_status&customerId=${filteredCustomerInfo.id}&username=${filteredCustomerInfo.username}&name=${encodeURIComponent(filteredCustomerInfo.name)}`;
      } else if (userDistributor) {
        naverApiUrl += `?distributor=${encodeURIComponent(userDistributor)}`;
      }
      apiCalls.push(fetch(naverApiUrl).then(res => res.json()));

      // 5. 플레이스 슬롯 조회
      let placeApiUrl = '/api/slot-place';
      if (isFilteredByCustomer && filteredCustomerInfo) {
        placeApiUrl += `?type=slot_status&customerId=${filteredCustomerInfo.id}&username=${filteredCustomerInfo.username}&name=${encodeURIComponent(filteredCustomerInfo.name)}`;
      } else if (userDistributor) {
        placeApiUrl += `?distributor=${encodeURIComponent(userDistributor)}`;
      }
      apiCalls.push(fetch(placeApiUrl).then(res => res.json()));

      // 6. 오늘의집 슬롯 조회
      let todayhomeApiUrl = '/api/slot-todayhome';
      if (isFilteredByCustomer && filteredCustomerInfo) {
        todayhomeApiUrl += `?type=slot_status&customerId=${filteredCustomerInfo.id}&username=${filteredCustomerInfo.username}&name=${encodeURIComponent(filteredCustomerInfo.name)}`;
      } else if (userDistributor) {
        todayhomeApiUrl += `?distributor=${encodeURIComponent(userDistributor)}`;
      }
      apiCalls.push(fetch(todayhomeApiUrl).then(res => res.json()));

      // 7. 알리엑스프레스 슬롯 조회
      let aliexpressApiUrl = '/api/slot-aliexpress';
      if (isFilteredByCustomer && filteredCustomerInfo) {
        aliexpressApiUrl += `?type=slot_status&customerId=${filteredCustomerInfo.id}&username=${filteredCustomerInfo.username}&name=${encodeURIComponent(filteredCustomerInfo.name)}`;
      } else if (userDistributor) {
        aliexpressApiUrl += `?distributor=${encodeURIComponent(userDistributor)}`;
      }
      apiCalls.push(fetch(aliexpressApiUrl).then(res => res.json()));

      // 8. 쿠팡순위체크 슬롯 조회
      let copangrankApiUrl = '/api/slot-copangrank';
      if (isFilteredByCustomer && filteredCustomerInfo) {
        copangrankApiUrl += `?type=slot_status&customerId=${filteredCustomerInfo.id}&username=${filteredCustomerInfo.username}&name=${encodeURIComponent(filteredCustomerInfo.name)}`;
      } else if (userDistributor) {
        copangrankApiUrl += `?distributor=${encodeURIComponent(userDistributor)}`;
      }
      apiCalls.push(fetch(copangrankApiUrl).then(res => res.json()));

      // 9. N쇼핑순위체크 슬롯 조회
      let naverrankApiUrl = '/api/slot-naverrank';
      if (isFilteredByCustomer && filteredCustomerInfo) {
        naverrankApiUrl += `?type=slot_status&customerId=${filteredCustomerInfo.id}&username=${filteredCustomerInfo.username}&name=${encodeURIComponent(filteredCustomerInfo.name)}`;
      } else if (userDistributor) {
        naverrankApiUrl += `?distributor=${encodeURIComponent(userDistributor)}`;
      }
      apiCalls.push(fetch(naverrankApiUrl).then(res => res.json()));

      // 10. N플레이스순위체크 슬롯 조회
      let placerankApiUrl = '/api/slot-placerank';
      if (isFilteredByCustomer && filteredCustomerInfo) {
        placerankApiUrl += `?type=slot_status&customerId=${filteredCustomerInfo.id}&username=${filteredCustomerInfo.username}&name=${encodeURIComponent(filteredCustomerInfo.name)}`;
      } else if (userDistributor) {
        placerankApiUrl += `?distributor=${encodeURIComponent(userDistributor)}`;
      }
      apiCalls.push(fetch(placerankApiUrl).then(res => res.json()));

      console.log('API 호출 URLs:', {
        coupangApiUrl,
        coupangVipApiUrl,
        coupangAppApiUrl,
        naverApiUrl,
        placeApiUrl,
        todayhomeApiUrl,
        aliexpressApiUrl,
        copangrankApiUrl,
        naverrankApiUrl,
        placerankApiUrl,
      });

      // 모든 API 호출 실행
      const results = await Promise.all(apiCalls);

      // 결과 통합
      let allSlotData = [];
      let hasError = false;
      let errorMessage = '';

      results.forEach((result, index) => {
        const slotType = [
          '쿠팡',
          '쿠팡VIP',
          '쿠팡APP',
          '네이버쇼핑',
          '플레이스',
          '오늘의집',
          '알리',
          '쿠팡순위체크',
          'N쇼핑순위체크',
          'N플레이스순위체크',
        ][index];

        if (result.success && result.data) {
          // 각 슬롯 데이터에 타입 정보 추가
          const typedData = result.data.map(slot => ({
            ...slot,
            slotType: slotType,
          }));
          allSlotData = allSlotData.concat(typedData);
          console.log(
            `${slotType} 슬롯 데이터 조회 성공:`,
            typedData.length,
            '개'
          );
        } else {
          console.warn(`${slotType} 슬롯 데이터 조회 실패:`, result.error);
          hasError = true;
          errorMessage += `${slotType}: ${result.error || '알 수 없는 오류'}; `;
        }
      });

      if (hasError) {
        console.warn('일부 슬롯 타입 조회 실패:', errorMessage);
        // 일부 실패해도 성공한 데이터는 표시
      }

      console.log('통합된 슬롯 데이터:', allSlotData);

      // 🔥 각 슬롯의 distributor 정보를 user_profiles에서 조회하여 업데이트
      if (allSlotData && allSlotData.length > 0) {
        console.log('🔍 distributor 정보 조회 시작...');

        // 고유한 customerId 목록 추출
        const uniqueCustomerIds = [
          ...new Set(allSlotData.map(slot => slot.customerId)),
        ];
        console.log('고유한 고객 수:', uniqueCustomerIds.length);

        // 각 고객의 distributor 정보 조회
        const distributorMap = new Map();

        for (const customerId of uniqueCustomerIds) {
          try {
            const response = await fetch(
              `/api/users?username=${encodeURIComponent(customerId)}`
            );
            const result = await response.json();

            if (result.success && result.data && result.data.length > 0) {
              const distributor = result.data[0].distributor || '-';
              distributorMap.set(customerId, distributor);
              console.log(`✅ ${customerId} → ${distributor}`);
            } else {
              distributorMap.set(customerId, '-');
              console.log(`⚠️  ${customerId} → distributor 정보 없음`);
            }
          } catch (error) {
            console.error(`❌ ${customerId} distributor 조회 오류:`, error);
            distributorMap.set(customerId, '-');
          }
        }

        // 슬롯 데이터에 distributor 정보 매핑
        const updatedSlotData = allSlotData.map(slot => ({
          ...slot,
          userGroup: distributorMap.get(slot.customerId) || '-',
        }));

        console.log('✅ distributor 매핑 완료');
        console.log('첫 번째 슬롯의 userGroup:', updatedSlotData[0]?.userGroup);

        setSlotData(updatedSlotData);
      } else {
        setSlotData(allSlotData);
      }
    } catch (error) {
      console.error('슬롯 데이터 조회 오류:', error);
      setError('슬롯 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlotData();

    // 1분마다 자동 새로고침 (실시간 잔여기간 업데이트)
    const interval = setInterval(() => {
      fetchSlotData();
    }, 60000); // 60초 = 1분

    return () => clearInterval(interval);
  }, []);

  // 필터링 (깜빡임 방지를 위해 즉시 적용)
  useEffect(() => {
    let filtered = slotData;

    // 고객별 필터링 (URL 파라미터로 전달된 경우)
    if (isFilteredByCustomer && filteredCustomerInfo) {
      filtered = filtered.filter(
        slot =>
          slot.customerId === filteredCustomerInfo.username ||
          slot.customerName === filteredCustomerInfo.name
      );
      console.log(
        '고객별 필터링 적용:',
        filteredCustomerInfo.username,
        '결과:',
        filtered.length,
        '개'
      );
    }

    setFilteredData(filtered);
  }, [slotData, isFilteredByCustomer, filteredCustomerInfo]);

  const handleRefresh = () => {
    fetchSlotData();
  };

  const handleClearFilter = () => {
    setIsFilteredByCustomer(false);
    setFilteredCustomerInfo(null);
    // URL에서 파라미터 제거
    router.replace('/slot-status');
  };

  // 슬롯타입 버튼 클릭 핸들러
  const handleSlotTypeClick = (slot: SlotData) => {
    console.log('🔍 슬롯타입 버튼 클릭:', {
      slotType: slot.slotType,
      slotCount: slot.slotCount,
      customerId: slot.customerId,
      customerName: slot.customerName,
    });

    // 항상 작업 등록 페이지로 이동 (잔여 슬롯 체크 제거)
    const actualCustomerId = searchParams.get('customerId');
    const username = searchParams.get('username');

    const params = new URLSearchParams({
      customerId: actualCustomerId || slot.customerId, // UUID 우선 사용
      username: username || slot.customerId, // username 추가
      slotCount: slot.slotCount.toString(), // 총 슬롯 수 사용
      customerName: slot.customerName,
      slotType: slot.slotType,
    });

    // 슬롯타입에 따라 다른 페이지로 이동
    let targetUrl = '';
    switch (slot.slotType) {
      case '쿠팡':
        targetUrl = `/coupangapp/add?${params.toString()}`;
        break;
      case '쿠팡VIP':
        targetUrl = `/coupangapp/vip?${params.toString()}`;
        break;
      case '쿠팡APP':
        targetUrl = `/coupangapp/app?${params.toString()}`;
        break;
      case '네이버쇼핑':
        targetUrl = `/coupangapp/naver?${params.toString()}`;
        break;
      case '플레이스':
        targetUrl = `/coupangapp/place?${params.toString()}`;
        break;
      case '오늘의집':
        targetUrl = `/coupangapp/todayhome?${params.toString()}`;
        break;
      case '알리':
        targetUrl = `/coupangapp/aliexpress?${params.toString()}`;
        break;
      case '쿠팡순위체크':
        targetUrl = `/coupangapp/copangrank?${params.toString()}`;
        break;
      case 'N쇼핑순위체크':
        targetUrl = `/coupangapp/naverrank?${params.toString()}`;
        break;
      case 'N플레이스순위체크':
        targetUrl = `/coupangapp/placerank?${params.toString()}`;
        break;
      default:
        targetUrl = `/coupangapp/add?${params.toString()}`;
        break;
    }

    console.log('🚀 슬롯타입 클릭 - 이동할 URL:', targetUrl);
    console.log('📋 전달되는 파라미터:', {
      customerId: actualCustomerId || slot.customerId,
      username: username || slot.customerId,
      slotCount: slot.slotCount,
      customerName: slot.customerName,
      slotType: slot.slotType,
    });

    router.push(targetUrl);
  };

  // 내역 버튼 클릭 처리
  const handleDetailClick = (slot: SlotData) => {
    console.log('내역 버튼 클릭:', slot);
    // TODO: 내역 페이지로 이동 또는 모달 표시
  };

  // 연장 버튼 클릭 처리
  const handleExtendClick = (slot: SlotData) => {
    console.log('연장 버튼 클릭:', slot);
    setSelectedSlot(slot);
    setExtendForm({
      paymentType: 'deposit',
      payerName: '',
      paymentAmount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      usageDays: '',
    });
    setShowExtendModal(true);
  };

  // 연장 처리 함수
  const handleExtendSubmit = async () => {
    if (!selectedSlot) return;

    // 필수 필드 검증
    if (!extendForm.usageDays || parseInt(extendForm.usageDays) <= 0) {
      alert('사용일수를 올바르게 입력해주세요.');
      return;
    }

    try {
      console.log('슬롯 연장 요청:', {
        slotId: selectedSlot.id,
        customerName: selectedSlot.customerName,
        currentExpiry: selectedSlot.expiryDate,
        extendDays: extendForm.usageDays,
      });

      const response = await fetch('/api/slots/extend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          paymentType: extendForm.paymentType,
          payerName: extendForm.payerName,
          paymentAmount: parseInt(extendForm.paymentAmount) || 0,
          paymentDate: extendForm.paymentDate,
          usageDays: parseInt(extendForm.usageDays),
        }),
      });

      const result = await response.json();

      if (result.success) {
        const extendedDays = parseInt(extendForm.usageDays);
        alert(
          `슬롯이 성공적으로 연장되었습니다!\n\n` +
            `고객: ${selectedSlot.customerName}\n` +
            `슬롯 타입: ${selectedSlot.slotType}\n` +
            `연장 일수: ${extendedDays}일\n` +
            `이전 만료일: ${new Date(result.data.previousExpiryDate).toLocaleDateString('ko-KR')}\n` +
            `새 만료일: ${new Date(result.data.newExpiryDate).toLocaleDateString('ko-KR')}\n\n` +
            `잔여기간이 ${extendedDays}일 연장되었습니다.`
        );

        setShowExtendModal(false);

        // 데이터 새로고침 (연장된 잔여기간 반영)
        await fetchSlotData();

        console.log('연장 완료 후 데이터 새로고침 완료');
      } else {
        alert(`연장 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('연장 처리 오류:', error);
      alert('연장 처리 중 오류가 발생했습니다.');
    }
  };

  // 연장 모달 닫기
  const handleExtendCancel = () => {
    setShowExtendModal(false);
    setSelectedSlot(null);
    setExtendForm({
      paymentType: 'deposit',
      payerName: '',
      paymentAmount: '',
      paymentDate: '',
      usageDays: '',
    });
  };

  // 슬롯 상태 변경 처리 (중지/재개)
  const handleSlotStatusChange = async (slot: SlotData, newStatus: string) => {
    const action = newStatus === 'inactive' ? '중지' : '재개';
    const actionText =
      newStatus === 'inactive' ? '중지하시겠습니까' : '재개하시겠습니까';

    try {
      console.log(`${action} 버튼 클릭:`, slot);

      // 확인 대화상자
      const confirmed = window.confirm(
        `정말로 "${slot.slotType}" 슬롯을 ${actionText}?\n\n` +
          `고객: ${slot.customerName}\n` +
          `슬롯 개수: ${slot.slotCount}개\n\n` +
          `이 작업은 slot_status 테이블의 모든 관련 레코드에도 적용됩니다.`
      );

      if (!confirmed) {
        console.log(`${action} 취소됨`);
        return;
      }

      // 슬롯 상태 변경 (PATCH API 사용)
      const response = await fetch(`/api/slots/${slot.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ 슬롯 ${action} 성공:`, result);

        // 성공 알림 (업데이트된 레코드 수 포함)
        alert(
          `슬롯이 성공적으로 ${action}되었습니다!\n\n` +
            `고객: ${slot.customerName}\n` +
            `슬롯 유형: ${slot.slotType}\n` +
            `업데이트된 slot_status 레코드: ${result.updatedCount || slot.slotCount}개\n\n` +
            `coupangapp/add 페이지의 레코드들도 ${action} 상태로 변경되었습니다.`
        );

        // 로컬 상태 업데이트 (페이지 새로고침 없이)
        setSlotData(prevData =>
          prevData.map(item =>
            item.id === slot.id
              ? {
                  ...item,
                  status: newStatus,
                  pausedSlots: newStatus === 'inactive' ? item.slotCount : 0,
                  usedSlots: newStatus === 'inactive' ? 0 : item.usedSlots,
                  remainingSlots:
                    newStatus === 'inactive'
                      ? 0
                      : item.slotCount - item.usedSlots,
                }
              : item
          )
        );
      } else {
        console.error(`❌ 슬롯 ${action} 실패:`, result.error);
        alert(`슬롯 ${action}에 실패했습니다: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ 슬롯 ${action} 중 오류 발생:`, error);
      alert(`슬롯 ${action} 중 오류가 발생했습니다. 다시 시도해주세요.`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">활성</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">완료</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">비활성</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">만료</Badge>;
      case 'paused':
        return <Badge className="bg-orange-100 text-orange-800">중지</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // 로딩 중이거나 고객별 필터링이 적용되는 중이면 로딩 화면 표시
  if (
    loading ||
    (isFilteredByCustomer &&
      filteredCustomerInfo &&
      slotData.length > 0 &&
      filteredData.length === 0)
  ) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-600 text-lg">
              {isFilteredByCustomer
                ? `${filteredCustomerInfo?.name || '고객'}님의 데이터를 불러오는 중...`
                : '데이터를 불러오는 중...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-500 text-lg">{error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              새로고침
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isFilteredByCustomer && filteredCustomerInfo
                ? `${filteredCustomerInfo.name} 고객 슬롯 현황`
                : '슬롯 현황'}
            </h1>
            {isFilteredByCustomer && filteredCustomerInfo && (
              <p className="text-sm text-gray-600 mt-1">
                고객 ID: {filteredCustomerInfo.username} | 총{' '}
                {filteredData.length}개 슬롯
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            {isFilteredByCustomer && (
              <Button onClick={handleClearFilter} variant="outline">
                전체 보기
              </Button>
            )}
            <Button onClick={handleRefresh} variant="outline">
              새로고침
            </Button>
          </div>
        </div>

        {/* 슬롯 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순번
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    소속총판
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    아이디
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 입금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    슬롯 타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 슬롯
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    잔여기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일/만료일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {isFilteredByCustomer
                        ? '해당 고객의 슬롯 데이터가 없습니다.'
                        : '조회된 슬롯 데이터가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((slot, index) => (
                    <tr key={slot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {filteredData.length - index}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {slot.userGroup}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {slot.customerId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(slot.totalPaymentAmount || 0).toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Button
                          onClick={() => handleSlotTypeClick(slot)}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          {slot.slotType}
                        </Button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {slot.slotCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span
                            className={`font-medium ${
                              slot.remainingDays > 7
                                ? 'text-green-600'
                                : slot.remainingDays > 3
                                  ? 'text-yellow-600'
                                  : slot.remainingDays > 0
                                    ? 'text-orange-600'
                                    : 'text-red-600'
                            }`}
                          >
                            {slot.remainingTimeString}
                          </span>
                          {slot.remainingDays > 0 &&
                            slot.remainingDays <= 3 && (
                              <span className="text-xs text-red-500 mt-1">
                                ⚠️ 곧 만료
                              </span>
                            )}
                          {slot.remainingDays === 0 &&
                            slot.remainingHours > 0 && (
                              <span className="text-xs text-orange-500 mt-1">
                                ⏰ 시간 단위 남음
                              </span>
                            )}
                          {slot.remainingDays === 0 &&
                            slot.remainingHours === 0 &&
                            slot.remainingMinutes > 0 && (
                              <span className="text-xs text-red-500 mt-1">
                                🔥 분 단위 남음
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>등록: {slot.registrationDate}</div>
                          <div>만료: {slot.expiryDate}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(slot.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            onClick={() => handleDetailClick(slot)}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-md transition-all duration-200"
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            내역
                          </Button>
                          <Button
                            onClick={() => handleExtendClick(slot)}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200 hover:border-green-300 rounded-md transition-all duration-200"
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            연장
                          </Button>
                          <Button
                            onClick={() =>
                              handleSlotStatusChange(
                                slot,
                                slot.status === 'inactive'
                                  ? 'active'
                                  : 'inactive'
                              )
                            }
                            variant="ghost"
                            size="sm"
                            disabled={slot.status === 'expired'}
                            className={`h-8 px-3 text-xs font-medium rounded-md transition-all duration-200 ${
                              slot.status === 'expired'
                                ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                                : slot.status === 'inactive'
                                  ? 'text-white bg-green-600 hover:bg-green-700 border border-green-600 hover:border-green-700'
                                  : 'text-white bg-red-600 hover:bg-red-700 border border-red-600 hover:border-red-700'
                            }`}
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              {slot.status === 'inactive' ? (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-4a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              ) : (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              )}
                            </svg>
                            {slot.status === 'inactive'
                              ? '재개'
                              : slot.status === 'expired'
                                ? '만료됨'
                                : '중지'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 연장 모달 */}
      {showExtendModal && selectedSlot && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  슬롯 연장
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
                  <p className="text-sm text-blue-800 font-medium">
                    현재 잔여기간:{' '}
                    <span className="text-blue-900">
                      {selectedSlot.remainingDays}일
                    </span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    만료일:{' '}
                    {new Date(selectedSlot.expiryDate).toLocaleDateString(
                      'ko-KR'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExtendCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 슬롯 정보 */}
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-600">
                  <div>아이디: {selectedSlot.customerId}</div>
                  <div>고객명: {selectedSlot.customerName}</div>
                  <div>슬롯 타입: {selectedSlot.slotType}</div>
                  <div>슬롯 수: {selectedSlot.slotCount}개</div>
                  <div>현재 잔여기간: {selectedSlot.remainingTimeString}</div>
                </div>
              </div>

              {/* 입금구분 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입금구분
                </label>
                <select
                  value={extendForm.paymentType}
                  onChange={e =>
                    setExtendForm({
                      ...extendForm,
                      paymentType: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="deposit">입금</option>
                  <option value="coupon">쿠폰</option>
                </select>
              </div>

              {/* 입금자명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입금자명
                </label>
                <input
                  type="text"
                  value={extendForm.payerName}
                  onChange={e =>
                    setExtendForm({ ...extendForm, payerName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="입금자명을 입력하세요"
                />
              </div>

              {/* 입금액 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입금액
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={extendForm.paymentAmount}
                    onChange={e =>
                      setExtendForm({
                        ...extendForm,
                        paymentAmount: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">
                    원
                  </span>
                </div>
              </div>

              {/* 입금일자 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입금일자
                </label>
                <input
                  type="date"
                  value={extendForm.paymentDate}
                  onChange={e =>
                    setExtendForm({
                      ...extendForm,
                      paymentDate: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 사용일수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사용일수 (연장할 일수)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={extendForm.usageDays}
                    onChange={e =>
                      setExtendForm({
                        ...extendForm,
                        usageDays: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="연장할 일수를 입력하세요"
                    min="1"
                    required
                  />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">
                    일
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  입력한 일수만큼 현재 잔여기간에 추가됩니다
                </p>
                {extendForm.usageDays && parseInt(extendForm.usageDays) > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-2 mt-2">
                    <p className="text-sm text-green-800 font-medium">
                      연장 후 예상 잔여기간:{' '}
                      <span className="text-green-900">
                        {selectedSlot.remainingDays +
                          parseInt(extendForm.usageDays)}
                        일
                      </span>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      새 만료일:{' '}
                      {new Date(
                        new Date(selectedSlot.expiryDate).getTime() +
                          parseInt(extendForm.usageDays) * 24 * 60 * 60 * 1000
                      ).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleExtendCancel}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleExtendSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
              >
                연장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SlotStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">페이지를 불러오는 중...</p>
            </div>
          </div>
        </div>
      }
    >
      <SlotStatusPageContent />
    </Suspense>
  );
}
