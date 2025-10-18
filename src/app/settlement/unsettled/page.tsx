'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface Slot {
  id: number | string;
  customer_id: string;
  customer_name: string;
  slot_type: string;
  slot_count: number;
  payment_type: string | null;
  payer_name: string | null;
  payment_amount: number | null;
  payment_date: string | null;
  usage_days: number | null;
  memo: string | null;
  status: string;
  created_at: string;
  distributor_name: string;
  type: 'slot' | 'deposit' | 'extension'; // 슬롯, 입금, 또는 연장 구분
}

export default function UnsettledPage() {
  const router = useRouter();
  const [selectedDistributor, setSelectedDistributor] = useState<string>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingSlots, setRequestingSlots] = useState<Set<number>>(
    new Set()
  );
  const [bulkRequesting, setBulkRequesting] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState<string>('');

  // 슬롯 데이터 가져오기
  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      console.log('미정산 내역 데이터 가져오는 중...');

      // 현재 사용자 정보 가져오기
      const userStr = localStorage.getItem('user');
      let apiUrl = '/api/settlements/unsettled';

      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('👤 현재 사용자:', user.username, user.grade);

        // 총판회원: 본인 소속 고객만 조회
        if (user.grade === '총판회원' && user.username !== 'master') {
          apiUrl += `?distributor_name=${encodeURIComponent(user.distributor)}`;
          console.log(`✅ 총판 필터 적용: ${user.distributor}`);
        }
      }

      const response = await fetch(apiUrl);
      console.log('미정산 API 응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('미정산 API 에러 응답:', errorText);
        throw new Error(
          `미정산 API 요청 실패: ${response.status} ${response.statusText}`
        );
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const responseText = await response.text();
        console.error('슬롯 JSON 파싱 에러:', parseError);
        console.error('슬롯 응답 내용:', responseText);
        throw new Error(
          '서버에서 잘못된 응답을 받았습니다. JSON이 아닌 응답이 반환되었습니다.'
        );
      }

      if (result.success) {
        console.log('슬롯 데이터 로드 완료:', result.data?.length || 0, '개');
        // 정산 완료된 슬롯들을 제외하고 필터링
        const filteredSlots = (result.data || []).filter(
          (slot: Slot) =>
            slot.status !== 'completed' &&
            slot.status !== 'requested' &&
            slot.status !== 'inactive' // 정산 완료된 슬롯도 제외
        );
        console.log('필터링된 슬롯 데이터:', filteredSlots.length, '개');
        setSlots(filteredSlots);
      } else {
        console.error('슬롯 API 에러:', result.error);
        setError(result.error || '슬롯 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('슬롯 데이터 가져오기 에러:', err);
      setError(
        `서버 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
      );
    } finally {
      setLoading(false);
    }
  };

  // 슬롯 타입을 한글로 변환
  const getSlotTypeKorean = (slotType: string) => {
    const typeMap: { [key: string]: string } = {
      coupang: '쿠팡',
      'coupang-vip': '쿠팡 VIP',
      'coupang-app': '쿠팡 앱',
      'naver-shopping': '네이버 쇼핑',
      place: '플레이스',
      'today-house': '오늘의집',
      aliexpress: '알리익스프레스',
    };
    return typeMap[slotType] || slotType;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 금액 포맷팅
  const formatAmount = (amount: number | null) => {
    if (!amount) return '0원';
    return `${amount.toLocaleString()}원`;
  };

  // 수정 버튼 클릭 핸들러
  const handleEdit = (slot: Slot) => {
    console.log('수정 버튼 클릭:', {
      id: slot.id,
      type: slot.type,
      customer_id: slot.customer_id,
    });

    if (slot.type === 'extension') {
      // 연장 내역의 경우 인라인 편집 모드로 전환
      console.log('연장 내역 편집 모드로 전환');
      setEditingSlotId(slot.id.toString());
      setEditPaymentAmount(slot.payment_amount?.toString() || '');
    } else if (slot.type === 'deposit') {
      // 입금 내역의 경우도 인라인 편집 모드로 전환
      console.log('입금 내역 편집 모드로 전환');
      setEditingSlotId(slot.id.toString());
      setEditPaymentAmount(slot.payment_amount?.toString() || '');
    } else {
      // 일반 슬롯의 경우 기존 방식
      console.log('일반 슬롯 - 페이지 이동');
      router.push(
        `/settlement/edit?slotId=${slot.id}&customerId=${slot.customer_id}&username=${slot.customer_id}&name=${encodeURIComponent(slot.customer_name)}`
      );
    }
  };

  // 연장 내역 수정 핸들러
  const handleUpdateExtension = async (slotId: string) => {
    if (!editPaymentAmount) {
      alert('입금액을 입력해주세요.');
      return;
    }

    const settlementId = slotId.replace('settlement_', ''); // settlement_ 접두사 제거
    console.log('연장 내역 수정 요청:', {
      slotId,
      settlementId,
      paymentAmount: editPaymentAmount,
    });

    try {
      const response = await fetch('/api/settlements/update-extension', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settlementId: settlementId,
          paymentAmount: parseInt(editPaymentAmount),
        }),
      });

      if (!response.ok) {
        throw new Error('연장 내역 수정에 실패했습니다.');
      }

      alert('연장 내역이 성공적으로 수정되었습니다.');
      setEditingSlotId(null);
      setEditPaymentAmount('');
      fetchSlots(); // 데이터 새로고침
    } catch (error) {
      console.error('연장 내역 수정 오류:', error);
      alert('연장 내역 수정 중 오류가 발생했습니다.');
    }
  };

  // 입금 내역 수정 핸들러
  const handleUpdateDeposit = async (slotId: string) => {
    if (!editPaymentAmount) {
      alert('입금액을 입력해주세요.');
      return;
    }

    console.log('입금 내역 수정 요청:', {
      slotId,
      paymentAmount: editPaymentAmount,
    });

    try {
      // 입금 내역의 경우 슬롯 ID를 그대로 사용
      const response = await fetch('/api/settlements/update-deposit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotId: slotId,
          paymentAmount: parseInt(editPaymentAmount),
        }),
      });

      if (!response.ok) {
        throw new Error('입금 내역 수정에 실패했습니다.');
      }

      alert('입금 내역이 성공적으로 수정되었습니다.');
      setEditingSlotId(null);
      setEditPaymentAmount('');
      fetchSlots(); // 데이터 새로고침
    } catch (error) {
      console.error('입금 내역 수정 오류:', error);
      alert('입금 내역 수정 중 오류가 발생했습니다.');
    }
  };

  // 편집 취소 핸들러
  const handleCancelEdit = () => {
    setEditingSlotId(null);
    setEditPaymentAmount('');
  };

  // 전체 정산요청 버튼 클릭 핸들러
  const handleBulkSettlementRequest = async () => {
    // 정산요청 가능한 슬롯들만 필터링 (status가 'requested'가 아닌 것들)
    const availableSlots = slots.filter(slot => slot.status !== 'requested');

    if (availableSlots.length === 0) {
      alert('정산요청 가능한 슬롯이 없습니다.');
      return;
    }

    if (
      !confirm(`총 ${availableSlots.length}개의 슬롯을 정산요청하시겠습니까?`)
    ) {
      return;
    }

    try {
      setBulkRequesting(true);

      // 정산요청 데이터 준비 (settlements 테이블의 ID만 전송)
      console.log('🔍 전체 정산요청 데이터 준비:', availableSlots.length, '개');
      console.log('첫 번째 슬롯 데이터:', availableSlots[0]);

      const settlementData = availableSlots.map(slot => ({
        id: slot.id, // settlements 테이블의 ID만 전송
      }));

      console.log('🔍 생성된 정산요청 데이터:', settlementData);

      // DB에 정산요청 저장
      const response = await fetch('/api/settlement-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settlementData }),
      });

      console.log('API 응답 상태:', response.status);

      // 응답이 성공적인지 확인
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 에러 응답:', errorText);
        throw new Error(
          `API 요청 실패: ${response.status} ${response.statusText}`
        );
      }

      // JSON 파싱 시도
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const responseText = await response.text();
        console.error('JSON 파싱 에러:', parseError);
        console.error('응답 내용:', responseText);
        throw new Error(
          '서버에서 잘못된 응답을 받았습니다. JSON이 아닌 응답이 반환되었습니다.'
        );
      }

      if (result.success) {
        alert(result.message);
        // 정산 페이지로 이동
        router.push('/settlement');
      } else {
        alert(result.error || '정산요청 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('정산요청 에러:', err);
      alert(
        `서버 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
      );
    } finally {
      setBulkRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">미정산 내역</h1>

          {/* 필터 */}
          <div className="mb-6 flex items-center space-x-4">
            <select
              value={selectedDistributor}
              onChange={e => setSelectedDistributor(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="">전체 총판</option>
              <option value="총판A">총판A</option>
              <option value="총판B">총판B</option>
            </select>

            <button
              onClick={handleBulkSettlementRequest}
              disabled={bulkRequesting}
              className={`px-4 py-2 rounded text-sm font-medium ${
                bulkRequesting
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {bulkRequesting ? '처리중...' : '전체 정산요청'}
            </button>
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    순번
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    구분
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    소속총판
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    아이디
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    슬롯추가일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    슬롯유형
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    슬롯수
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    입금자명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    입금액
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    사용일수
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    메모
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    수정
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {slots.map((slot, index) => (
                  <tr key={slot.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      {slot.type === 'extension' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          연장
                        </span>
                      ) : slot.type === 'deposit' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          입금
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          슬롯
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {slot.distributor_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {slot.customer_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {formatDate(slot.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {getSlotTypeKorean(slot.slot_type)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {slot.slot_count}개
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {slot.payer_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {(slot.type === 'extension' || slot.type === 'deposit') &&
                      editingSlotId === slot.id.toString() ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editPaymentAmount}
                            onChange={e => setEditPaymentAmount(e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                            placeholder="입금액"
                          />
                          <span className="text-xs text-gray-500">원</span>
                        </div>
                      ) : slot.payment_amount ? (
                        formatAmount(slot.payment_amount)
                      ) : (
                        '미입금'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {slot.usage_days ? `${slot.usage_days}일` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {slot.memo || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {(slot.type === 'extension' || slot.type === 'deposit') &&
                      editingSlotId === slot.id.toString() ? (
                        <div className="flex space-x-1">
                          <button
                            onClick={() =>
                              slot.type === 'extension'
                                ? handleUpdateExtension(slot.id.toString())
                                : handleUpdateDeposit(slot.id.toString())
                            }
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                          >
                            저장
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(slot)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                        >
                          수정
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {slots.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              미정산 내역이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
