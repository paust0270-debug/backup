'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface SettlementItem {
  id: string;
  sequential_number: number;
  category: string; // 구분 필드 추가
  distributor_name: string;
  customer_id: string;
  slot_addition_date: string;
  slot_type: string;
  slot_count: number; // number_of_slots → slot_count로 통합
  payer_name: string; // depositor_name → payer_name으로 통합
  payment_amount: number; // deposit_amount → payment_amount로 통합
  usage_days: number; // days_used → usage_days로 통합
  memo: string;
  status: 'requested' | 'approved' | 'cancelled';
}

export default function SettlementPage() {
  const router = useRouter();
  const [settlementItems, setSettlementItems] = useState<SettlementItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [distributorFilter, setDistributorFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // 정산 계산 관련 상태
  const [selectedSlotCount, setSelectedSlotCount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [includeTaxInvoice, setIncludeTaxInvoice] = useState<boolean>(false);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [depositDate, setDepositDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  ); // 오늘 날짜를 기본값으로 설정
  const [memo, setMemo] = useState<string>('');
  const [payer_name, setPayerName] = useState<string>(''); // depositor_name → payer_name으로 통합

  useEffect(() => {
    // 정산요청 데이터 로드
    fetchSettlementRequests();
  }, []);

  // 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    fetchSettlementRequests();
  }, [statusFilter, distributorFilter]);

  // 정산요청 데이터 가져오기 (필터 적용)
  const fetchSettlementRequests = async () => {
    try {
      setLoading(true);

      // 현재 사용자 정보 가져오기
      const userStr = localStorage.getItem('user');

      // 필터 파라미터 추가
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== '전체') {
        params.append('status', statusFilter);
      }
      if (distributorFilter && distributorFilter !== '전체') {
        params.append('distributor', distributorFilter);
      }

      // 총판회원: 본인 소속 고객만 조회
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('👤 현재 사용자:', user.username, user.grade);

        if (user.grade === '총판회원' && user.username !== 'master') {
          params.append('distributor_name', user.distributor);
          console.log(`✅ 총판 필터 적용: ${user.distributor}`);
        }
      }

      const response = await fetch(
        `/api/settlement-requests?${params.toString()}`
      );
      const result = await response.json();

      if (result.success) {
        console.log(
          '정산요청 데이터 로드 성공:',
          result.data?.length || 0,
          '개'
        );

        const convertedItems: SettlementItem[] = result.data.map(
          (item: any, index: number) => ({
            id: item.id.toString(),
            sequential_number: index + 1, // 순번을 1부터 시작하는 숫자로 설정
            category: item.category || '일반', // API에서 처리된 category 사용
            distributor_name: item.distributor_name || '총판A', // 기본값
            customer_id: item.customer_id,
            slot_addition_date: item.slot_addition_date
              ? item.slot_addition_date.split('T')[0]
              : new Date().toISOString().split('T')[0],
            slot_type: item.slot_type,
            slot_count: item.slot_count || 1, // 통합된 필드명 사용
            payer_name: item.payer_name || '', // 통합된 필드명 사용
            payment_amount: item.payment_amount || 0, // 통합된 필드명 사용
            usage_days: item.usage_days || 0, // 통합된 필드명 사용
            memo: item.memo || '',
            status:
              item.status === 'completed'
                ? 'requested'
                : (item.status as 'requested' | 'approved' | 'cancelled'),
          })
        );

        setSettlementItems(convertedItems);
      } else {
        console.error('정산요청 데이터 로드 실패:', result.error);
        alert(`정산요청 데이터 로드 실패: ${result.error}`);
      }
    } catch (err) {
      console.error('정산요청 데이터 로드 오류:', err);
      alert(
        `정산요청 데이터 로드 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
      );
    } finally {
      setLoading(false);
    }
  };

  // 슬롯 타입을 한글로 변환하는 함수
  const getSlotTypeKorean = (slot_type: string) => {
    const typeMap: { [key: string]: string } = {
      coupang: '쿠팡',
      'coupang-vip': '쿠팡 VIP',
      'coupang-app': '쿠팡 앱',
      'naver-shopping': '네이버 쇼핑',
      place: '플레이스',
      'today-house': '오늘의집',
      aliexpress: '알리익스프레스',
    };
    return typeMap[slot_type] || slot_type;
  };

  // 선택된 슬롯 수 계산 (실제 슬롯수의 총합)
  useEffect(() => {
    const selectedItemsData = settlementItems.filter(item =>
      selectedItems.includes(item.id)
    );
    const totalSlots = selectedItemsData.reduce(
      (sum, item) => sum + item.slot_count,
      0
    );
    setSelectedSlotCount(totalSlots);
  }, [selectedItems, settlementItems]);

  // 선택된 항목들의 입금액 합산 계산
  useEffect(() => {
    const selectedItemsData = settlementItems.filter(item =>
      selectedItems.includes(item.id)
    );
    const totalDepositAmount = selectedItemsData.reduce(
      (sum, item) => sum + item.payment_amount,
      0
    );
    setTotalAmount(totalDepositAmount);
  }, [selectedItems, settlementItems]);

  // 세액 계산 (총금액 + 10%)
  useEffect(() => {
    setTaxAmount(totalAmount * 0.1);
  }, [totalAmount]);

  // 최종 입금액 계산
  useEffect(() => {
    if (includeTaxInvoice) {
      setFinalAmount(totalAmount + taxAmount);
    } else {
      setFinalAmount(totalAmount);
    }
  }, [includeTaxInvoice, totalAmount, taxAmount]);

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = settlementItems;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()}원`;
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      alert('정산할 항목을 선택해주세요.');
      return;
    }
    if (totalAmount === 0) {
      alert('총금액을 입력해주세요.');
      return;
    }
    if (!depositDate) {
      alert('입금일을 선택해주세요.');
      return;
    }
    if (!payer_name.trim()) {
      alert('입금자명을 입력해주세요.');
      return;
    }

    try {
      // 선택된 항목들의 데이터 준비
      const selectedItemsData = settlementItems.filter(item =>
        selectedItems.includes(item.id)
      );

      console.log('선택된 항목들:', selectedItemsData);
      console.log('정산 폼 데이터:', {
        totalSlots: selectedSlotCount,
        finalAmount,
        payerName: payer_name,
        depositDate,
        memo,
      });

      // 정산 데이터 생성 (새로운 구조)
      const settlementData = {
        sequential_number:
          selectedItemsData.length > 0
            ? selectedItemsData[0].sequential_number
            : 1,
        distributor_name:
          selectedItemsData.length > 0
            ? selectedItemsData[0].distributor_name
            : '총판A',
        total_slots: selectedSlotCount,
        total_deposit_amount: finalAmount,
        depositor_name: payer_name, // API에서 이 필드명을 사용
        deposit_date: depositDate,
        request_date: depositDate, // 요청일도 입금일과 동일하게 설정
        memo: memo,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('전송할 정산 데이터:', settlementData);

      // 정산 완료 처리 API 호출 (원래 구조)
      const completeResponse = await fetch(
        '/api/settlement-requests/complete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slotIds: selectedItemsData.map(item => {
              // item.id가 문자열인 경우 첫 번째 ID만 사용
              const idStr = String(item.id);
              const firstId = idStr.split(',')[0].trim();
              const numericId = parseInt(firstId);
              console.log('slotId 변환:', {
                original: item.id,
                firstId,
                numericId,
              });
              return isNaN(numericId) ? parseInt(item.id) || 0 : numericId;
            }),
            settlementData: settlementData,
          }),
        }
      );

      if (!completeResponse.ok) {
        const errorText = await completeResponse.text();
        console.error('정산 완료 API 에러 응답:', errorText);
        throw new Error(
          `정산 완료 API 요청 실패: ${completeResponse.status} ${completeResponse.statusText}`
        );
      }

      const completeResult = await completeResponse.json();
      console.log('정산 완료 처리 결과:', completeResult);

      if (!completeResult.success) {
        throw new Error(
          completeResult.error || '정산 완료 처리 중 오류가 발생했습니다.'
        );
      }

      // 정산 완료 성공 시 정산 내역 페이지로 이동
      alert('정산이 완료되었습니다.');
      router.push('/settlement/history');

      // 선택된 항목들을 현재 페이지에서 제거
      setSettlementItems(prev =>
        prev.filter(item => !selectedItems.includes(item.id))
      );
      setSelectedItems([]);
    } catch (error) {
      console.error('정산요청 처리 에러:', error);
      alert(
        `정산요청 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  };

  const handleCancel = () => {
    router.push('/settlement/unsettled');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">정산요청</h1>

          {/* 필터 */}
          <div className="mb-6 flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="">전체</option>
                <option value="requested">정산요청</option>
                <option value="approved">승인</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                대상총판
              </label>
              <select
                value={distributorFilter}
                onChange={e => setDistributorFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="">전체</option>
                <option value="총판선택">총판선택</option>
                <option value="본사">본사</option>
              </select>
            </div>
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.length === filteredItems.length &&
                        filteredItems.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
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
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleItemSelect(item.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {item.sequential_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.category === '연장'
                            ? 'bg-orange-100 text-orange-800'
                            : item.category === '입금'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.category || '일반'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {item.distributor_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {item.customer_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {formatDate(item.slot_addition_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {item.slot_type}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {item.slot_count}개
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {item.payer_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {formatAmount(item.payment_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {item.usage_days}일
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {item.memo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(item.status)}`}
                      >
                        {item.status === 'requested'
                          ? '정산요청'
                          : item.status === 'approved'
                            ? '승인'
                            : item.status === 'cancelled'
                              ? '취소'
                              : item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              정산 요청 내역이 없습니다.
            </div>
          )}

          {/* 정산 계산 섹션 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">정산 계산</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  총금액
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={e => setTotalAmount(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-8"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">
                    원
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  세액 (10%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={taxAmount}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-8 bg-gray-100"
                    readOnly
                  />
                  <span className="absolute right-3 top-2 text-gray-500">
                    원
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입금액
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={finalAmount}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-8 bg-gray-100"
                    readOnly
                  />
                  <span className="absolute right-3 top-2 text-gray-500">
                    원
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  세금계산서
                </label>
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    id="taxInvoice"
                    checked={includeTaxInvoice}
                    onChange={e => setIncludeTaxInvoice(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label
                    htmlFor="taxInvoice"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    포함
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  총 슬롯수
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={selectedSlotCount}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-8 bg-gray-100"
                    readOnly
                  />
                  <span className="absolute right-3 top-2 text-gray-500">
                    개
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입금자명
                </label>
                <input
                  type="text"
                  value={payer_name}
                  onChange={e => setPayerName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="입금자명을 입력하세요"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입금일
                </label>
                <input
                  type="date"
                  value={depositDate}
                  onChange={e => setDepositDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <input
                  type="text"
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="메모를 입력하세요"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium"
              >
                정산 요청
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
