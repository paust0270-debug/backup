'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea';
// import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  // Users,
  ShoppingCart,
  // Plus,
  X,
  // Calendar,
  // DollarSign,
  // Clock,
  // FileText,
  Edit,
  Save,
  // Filter,
  Search,
  Pause,
  Play,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import Navigation from '@/components/Navigation';

interface Slot {
  id: number;
  customer_id: string;
  customer_name: string;
  slot_type: string;
  slot_count: number;
  payment_type?: string;
  payer_name?: string;
  payment_amount?: number;
  payment_date?: string;
  usage_days?: number;
  memo?: string;
  status: 'active' | 'expired' | 'suspended';
  distributor?: string;
  created_at: string;
  updated_at?: string;

  // 계산된 필드들
  extension_count?: number;
  total_used_days?: number;
  remaining_days?: number;
  remaining_hours?: number;
  remaining_minutes?: number;
  remainingTimeString?: string;
  expiry_date?: string;
  username?: string; // customer_name과 동일
}

function SlotsPageContentInner() {
  // const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);

  // 개발 모드에서만 디버깅 로그 출력
  const isDevMode = process.env.NODE_ENV === 'development';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Slot>>({});
  const [selectedDistributor, setSelectedDistributor] = useState<string>('all');
  const [selectedSlotType, setSelectedSlotType] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [distributors, setDistributors] = useState<string[]>(['전체']);
  const [sortField, setSortField] = useState<string>(''); // 정렬 필드
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // 정렬 방향
  const slotTypes = [
    '쿠팡',
    '쿠팡VIP',
    '쿠팡APP',
    '네이버쇼핑',
    '플레이스',
    '오늘의집',
    '알리',
  ];

  // const searchParams = useSearchParams();

  useEffect(() => {
    fetchSlots();
    fetchDistributors();
  }, []);

  async function fetchDistributors() {
    try {
      const response = await fetch('/api/distributors');
      if (!response.ok) {
        throw new Error('Failed to fetch distributors');
      }
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setDistributors(['전체', ...result.data]);
      }
    } catch (error) {
      console.error('Error fetching distributors:', error);
      // 오류 시 기본값 유지
    }
  }

  async function fetchSlots() {
    try {
      setLoading(true);

      // 현재 사용자 정보 가져오기
      const userStr = localStorage.getItem('user');
      let apiUrl = '/api/slots';

      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('👤 현재 사용자:', user.username, user.grade);

        // 총판회원: 본인 소속 고객만 조회
        if (user.grade === '총판회원' && user.username !== 'master') {
          apiUrl += `?distributor=${encodeURIComponent(user.distributor)}`;
          console.log(`✅ 총판 필터 적용: ${user.distributor}`);
        }
      }

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch slots');
      }
      const result = await response.json();

      let slotsData: Slot[] = [];

      // API 응답 구조에 맞게 데이터 추출
      if (result.success && Array.isArray(result.data)) {
        slotsData = result.data;
      } else if (Array.isArray(result)) {
        // 직접 배열로 응답하는 경우
        slotsData = result;
      } else {
        console.error('Unexpected API response structure:', result);
        setSlots([]);
        return;
      }

      // 🔥 각 슬롯의 distributor 정보를 user_profiles에서 조회하여 업데이트
      if (slotsData && slotsData.length > 0) {
        console.log('🔍 distributor 정보 조회 시작...');

        // 고유한 customer_id 목록 추출
        const uniqueCustomerIds = [
          ...new Set(slotsData.map(slot => slot.customer_id)),
        ];
        console.log('고유한 고객 수:', uniqueCustomerIds.length);

        // 각 고객의 distributor 정보 조회
        const distributorMap = new Map();

        for (const customerId of uniqueCustomerIds) {
          try {
            const userResponse = await fetch(
              `/api/users?username=${encodeURIComponent(customerId)}`
            );
            const userResult = await userResponse.json();

            if (
              userResult.success &&
              userResult.data &&
              userResult.data.length > 0
            ) {
              const distributor = userResult.data[0].distributor || '일반';
              distributorMap.set(customerId, distributor);
              console.log(`✅ ${customerId} → ${distributor}`);
            } else {
              distributorMap.set(customerId, '일반');
              console.log(`⚠️  ${customerId} → distributor 정보 없음`);
            }
          } catch (error) {
            console.error(`❌ ${customerId} distributor 조회 오류:`, error);
            distributorMap.set(customerId, '일반');
          }
        }

        // 슬롯 데이터에 distributor 정보 매핑
        const updatedSlots = slotsData.map(slot => ({
          ...slot,
          distributor: distributorMap.get(slot.customer_id) || '일반',
        }));

        console.log('✅ distributor 매핑 완료');
        console.log(
          '첫 번째 슬롯의 distributor:',
          updatedSlots[0]?.distributor
        );

        setSlots(updatedSlots);
      } else {
        setSlots(slotsData);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError('슬롯 데이터를 불러오는데 실패했습니다.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  const handleEditSlot = (slot: Slot) => {
    setEditingId(slot.id);
    setEditForm({
      memo: slot.memo,
    });
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const response = await fetch(`/api/slots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update slot');
      }

      await fetchSlots();
      setEditingId(null);
      setEditForm({});
      alert('슬롯 정보가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('Error updating slot:', error);
      alert('슬롯 정보 수정에 실패했습니다.');
    }
  };

  const handleSlotStatusChange = async (slot: Slot, newStatus: string) => {
    const action = newStatus === 'inactive' ? '중지' : '재개';
    const actionText =
      newStatus === 'inactive' ? '중지하시겠습니까' : '재개하시겠습니까';

    try {
      if (isDevMode) console.log(`${action} 버튼 클릭:`, slot);

      // 확인 대화상자
      const confirmed = window.confirm(
        `정말로 "${slot.slot_type}" 슬롯을 ${actionText}?\n\n` +
          `고객: ${slot.customer_name}\n` +
          `슬롯 개수: ${slot.slot_count}개\n\n` +
          `이 작업은 slot_status 테이블의 모든 관련 레코드에도 적용됩니다.`
      );

      if (!confirmed) {
        if (isDevMode) console.log(`${action} 취소됨`);
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
        if (isDevMode) console.log(`✅ 슬롯 ${action} 성공:`, result);
        alert(`슬롯이 성공적으로 ${action}되었습니다.`);
        await fetchSlots(); // 데이터 새로고침
      } else {
        console.error(`❌ 슬롯 ${action} 실패:`, result.error);
        alert(`슬롯 ${action}에 실패했습니다: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ 슬롯 ${action} 중 오류 발생:`, error);
      alert(`슬롯 ${action} 중 오류가 발생했습니다. 다시 시도해주세요.`);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm('정말로 이 슬롯을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/slots/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete slot');
      }

      await fetchSlots();
      alert('슬롯이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('슬롯 삭제에 실패했습니다.');
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
        return <Badge className="bg-gray-100 text-gray-800">알 수 없음</Badge>;
    }
  };

  // 슬롯타입 버튼 클릭 핸들러
  const handleSlotTypeClick = (slot: Slot) => {
    if (isDevMode)
      console.log('🔍 슬롯타입 버튼 클릭:', {
        slotType: slot.slot_type,
        slotCount: slot.slot_count,
        customerId: slot.customer_id,
        customerName: slot.customer_name,
      });

    // 작업 등록 페이지로 이동
    const params = new URLSearchParams({
      customerId: slot.customer_id,
      username: slot.customer_id, // customer_id를 username으로 사용
      slotCount: slot.slot_count.toString(),
      customerName: slot.customer_name,
      slotType: slot.slot_type,
    });

    // 슬롯타입에 따라 다른 페이지로 이동
    let targetUrl = '';
    switch (slot.slot_type) {
      case '쿠팡':
        targetUrl = `/coupangapp/add?${params.toString()}`;
        break;
      case '쿠팡VIP':
        targetUrl = `/coupangapp/vip?${params.toString()}`;
        break;
      case '쿠팡 앱':
        targetUrl = `/coupangapp/app?${params.toString()}`;
        break;
      default:
        targetUrl = `/coupangapp/add?${params.toString()}`;
        break;
    }

    if (isDevMode) {
      console.log('🚀 슬롯타입 클릭 - 이동할 URL:', targetUrl);
      console.log('📋 전달되는 파라미터:', {
        customerId: slot.customer_id,
        username: slot.customer_id,
        slotCount: slot.slot_count,
        customerName: slot.customer_name,
        slotType: slot.slot_type,
      });
    }

    window.open(targetUrl, '_blank');
  };

  // 정렬 함수
  const handleSort = (field: string) => {
    if (sortField === field) {
      // 같은 필드 클릭 시 정렬 방향 토글
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드 클릭 시 오름차순으로 설정
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 정렬된 슬롯 목록 생성
  const getSortedSlots = (slots: Slot[]) => {
    if (!sortField) return slots;

    return [...slots].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'remaining_days':
          aValue = a.remaining_days || 0;
          bValue = b.remaining_days || 0;
          break;
        case 'customer_id':
          aValue = a.customer_id || '';
          bValue = b.customer_id || '';
          break;
        case 'slot_type':
          aValue = a.slot_type || '';
          bValue = b.slot_type || '';
          break;
        case 'slot_count':
          aValue = a.slot_count || 0;
          bValue = b.slot_count || 0;
          break;
        case 'payment_amount':
          aValue = a.payment_amount || 0;
          bValue = b.payment_amount || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'expiry_date':
          aValue = new Date(a.expiry_date || '').getTime();
          bValue = new Date(b.expiry_date || '').getTime();
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 필터링된 슬롯 목록
  const filteredSlots = slots.filter(slot => {
    const matchesDistributor =
      selectedDistributor === 'all' ||
      selectedDistributor === '전체' ||
      slot.distributor === selectedDistributor;
    const matchesSlotType =
      selectedSlotType === 'all' || slot.slot_type === selectedSlotType;
    const matchesKeyword =
      searchKeyword === '' ||
      (slot.customer_id &&
        slot.customer_id.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (slot.customer_name &&
        slot.customer_name
          .toLowerCase()
          .includes(searchKeyword.toLowerCase())) ||
      (slot.memo &&
        slot.memo.toLowerCase().includes(searchKeyword.toLowerCase()));

    return matchesDistributor && matchesSlotType && matchesKeyword;
  });

  // 정렬 적용
  const sortedSlots = getSortedSlots(filteredSlots);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 에러 메시지 표시 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* 페이지 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">슬롯 관리</h1>
        </div>

        {/* 필터 섹션 */}
        <Card className="mb-6">
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 총판 선택 */}
              <div>
                <Label htmlFor="distributor" className="text-sm font-medium">
                  총판 선택
                </Label>
                <Select
                  value={selectedDistributor}
                  onValueChange={setSelectedDistributor}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="총판을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {distributors.map(distributor => (
                      <SelectItem key={distributor} value={distributor}>
                        {distributor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 슬롯 유형 */}
              <div>
                <Label htmlFor="slotType" className="text-sm font-medium">
                  슬롯 유형
                </Label>
                <Select
                  value={selectedSlotType}
                  onValueChange={setSelectedSlotType}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="슬롯 유형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {slotTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 검색 */}
              <div>
                <Label htmlFor="search" className="text-sm font-medium">
                  검색
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    placeholder="아이디 또는 메모 검색"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 슬롯 목록 테이블 */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              슬롯 목록 ({sortedSlots.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">데이터를 불러오는 중...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        순번
                      </th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        아이디
                      </th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        슬롯 타입
                      </th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        슬롯수
                      </th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        입금액
                      </th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        연장횟수
                      </th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        총사용일수
                      </th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        <button
                          onClick={() => handleSort('remaining_days')}
                          className="flex items-center justify-center gap-1 w-full hover:bg-gray-100 rounded px-2 py-1"
                        >
                          잔여기간
                          <div className="flex flex-col">
                            <ChevronUp
                              className={`w-3 h-3 ${
                                sortField === 'remaining_days' &&
                                sortDirection === 'asc'
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }`}
                            />
                            <ChevronDown
                              className={`w-3 h-3 ${
                                sortField === 'remaining_days' &&
                                sortDirection === 'desc'
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }`}
                            />
                          </div>
                        </button>
                      </th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        등록일
                      </th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        만료일
                      </th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        메모
                      </th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        상태
                      </th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSlots.length > 0 ? (
                      sortedSlots.map((slot, index) => (
                        <tr key={slot.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            {index + 1}
                          </td>
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            <div className="flex flex-col gap-1 text-xs">
                              <div className="font-medium">
                                {slot.customer_id}
                              </div>
                              <div className="text-gray-600">
                                {slot.customer_name}
                              </div>
                              <div className="text-gray-500">
                                {slot.distributor || '일반'}
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-300 hover:bg-blue-50 text-xs"
                              onClick={() => handleSlotTypeClick(slot)}
                            >
                              {slot.slot_type}
                            </Button>
                          </td>
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            {slot.slot_count}
                          </td>
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            <span className="text-green-600 font-medium">
                              {formatCurrency(slot.payment_amount || 0)}원
                            </span>
                          </td>
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            {slot.extension_count || 0}
                          </td>
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            {slot.total_used_days || slot.usage_days || 0}일
                          </td>
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded ${
                                (slot.remaining_days || 0) <= 7
                                  ? 'bg-red-100 text-red-800'
                                  : (slot.remaining_days || 0) <= 30
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {slot.remainingTimeString ||
                                `${slot.remaining_days || 0}일`}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            {formatDate(slot.created_at)}
                          </td>
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            {slot.expiry_date
                              ? formatDate(slot.expiry_date)
                              : '-'}
                          </td>
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            {editingId === slot.id ? (
                              <Input
                                value={editForm.memo || slot.memo || ''}
                                onChange={e =>
                                  setEditForm(prev => ({
                                    ...prev,
                                    memo: e.target.value,
                                  }))
                                }
                                className="w-32 h-8 text-xs"
                                placeholder="메모 입력"
                              />
                            ) : (
                              <div
                                className="max-w-32 truncate"
                                title={slot.memo}
                              >
                                {slot.memo || '-'}
                              </div>
                            )}
                          </td>
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            {getStatusBadge(slot.status)}
                          </td>
                          <td className="border border-gray-300 p-3 text-center text-sm">
                            <div className="flex justify-center space-x-2">
                              {editingId === slot.id ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSaveEdit(slot.id)}
                                    className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                                    title="저장"
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                                    title="취소"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditSlot(slot)}
                                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                    title="수정"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleSlotStatusChange(
                                        slot,
                                        slot.status === 'inactive'
                                          ? 'active'
                                          : 'inactive'
                                      )
                                    }
                                    className={`h-6 w-6 p-0 ${
                                      slot.status === 'inactive'
                                        ? 'text-green-600 hover:text-green-800'
                                        : 'text-orange-600 hover:text-orange-800'
                                    }`}
                                    title={
                                      slot.status === 'inactive'
                                        ? '재개'
                                        : '중지'
                                    }
                                  >
                                    {slot.status === 'inactive' ? (
                                      <Play className="w-4 h-4" />
                                    ) : (
                                      <Pause className="w-4 h-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={13}
                          className="py-8 text-center text-gray-500"
                        >
                          등록된 슬롯이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export function SlotsPageContent() {
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
      <SlotsPageContentInner />
    </Suspense>
  );
}
