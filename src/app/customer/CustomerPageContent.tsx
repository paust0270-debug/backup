'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { getDistributors, Distributor } from '@/lib/supabase';

interface Customer {
  id: string;
  username: string;
  password?: string;
  name: string;
  grade: string;
  email?: string;
  phone?: string;
  kakaoId?: string;
  memo?: string;
  distributor: string;
  distributor_name: string; // 총판명 필드 추가
  status: string;
  slot_used: number;
  additional_count: number;
  created_at: string;
  approved_at?: string;
  processor?: string;
}

export function CustomerPageContent() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('');
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [excelImportFile, setExcelImportFile] = useState<File | null>(null);
  const [excelImportLoading, setExcelImportLoading] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(
    new Set()
  );
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [distributors, setDistributors] = useState<Distributor[]>([]);

  // Supabase에서 고객 목록 가져오기 (권한 필터링 적용)
  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // 현재 사용자 정보 가져오기
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      console.log('👤 현재 사용자:', user.username, user.grade);

      // API URL 구성 (권한에 따라 필터링)
      let apiUrl = '/api/users';

      // 총판회원: 본인 소속 고객만 조회
      if (user.grade === '총판회원' && user.username !== 'master') {
        apiUrl += `?distributor=${encodeURIComponent(user.distributor)}`;
        console.log(`✅ 총판 필터 적용: ${user.distributor}`);
      }
      // 일반회원: 본인만 조회
      else if (user.grade === '일반회원') {
        apiUrl += `?username=${encodeURIComponent(user.username)}`;
        console.log(`✅ 일반회원 필터 적용: ${user.username}`);
      }
      // 최고관리자: 모든 고객 조회 (필터 없음)
      else {
        console.log('✅ 최고관리자: 모든 고객 조회');
      }

      const response = await fetch(apiUrl);
      const result = await response.json();

      if (response.ok) {
        setCustomers(result.data || result.users || []);
        console.log(
          `✅ 고객 목록 조회 완료: ${result.data?.length || result.users?.length || 0}명`
        );
      } else {
        console.error('고객 목록 조회 실패:', result.error);
        alert(`고객 목록을 가져올 수 없습니다: ${result.error}`);
      }
    } catch (error) {
      console.error('고객 목록 조회 오류:', error);
      alert('고객 목록을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 총판 목록 가져오기
  const fetchDistributors = async () => {
    try {
      const data = await getDistributors();
      setDistributors(data);
    } catch (error) {
      console.error('총판 목록 조회 실패:', error);
    }
  };

  // 로그인 상태 확인 및 데이터 로드 (최적화)
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
      // 병렬로 데이터 로드하여 성능 향상
      Promise.all([fetchCustomers(), fetchDistributors()]);
    } else {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      router.push('/login');
      return;
    }
  }, [router]);

  // 고객 목록이 변경될 때 선택 상태 초기화
  useEffect(() => {
    setSelectedCustomers(new Set());
    setIsAllSelected(false);
  }, [customers]);

  // URL 파라미터에서 새로 가입한 사용자 정보 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newSignup = urlParams.get('newSignup');
    if (newSignup === 'true') {
      // 새로 가입한 사용자가 있으면 목록 새로고침
      fetchCustomers();
      // URL에서 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      username: customer.username,
      password: customer.password, // 비밀번호 표시
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      kakaoId: customer.kakaoId,
      memo: customer.memo,
      grade: customer.grade,
      distributor: customer.distributor,
    });
    setEditPasswordConfirm('');
    setIsEditModalOpen(true);
  };

  const handleDelete = async (customerId: string) => {
    if (confirm('정말로 이 고객을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/users/${customerId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setCustomers(customers.filter(c => c.id !== customerId));
          alert('고객이 삭제되었습니다.');
        } else {
          const result = await response.json();
          alert(result.error || '고객 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('고객 삭제 오류:', error);
        alert('고객 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;

    // 비밀번호 확인 검증
    if (editForm.password && editForm.password !== editPasswordConfirm) {
      alert('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    // 필수 필드 검증
    if (
      !editForm.username ||
      !editForm.name ||
      !editForm.grade ||
      !editForm.distributor
    ) {
      alert('아이디, 고객명, 등급, 소속총판은 필수 입력 항목입니다.');
      return;
    }

    // 비밀번호 변경 시 확인 검증
    if (editForm.password && editForm.password.trim() !== '') {
      if (editForm.password !== editPasswordConfirm) {
        alert('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        return;
      }
    }

    try {
      const updateData: any = {
        username: editForm.username,
        name: editForm.name,
        email: editForm.email || '',
        phone: editForm.phone || '',
        kakaoId: editForm.kakaoId || '',
        memo: editForm.memo || '',
        distributor: editForm.distributor,
        workGroup: editForm.workGroup || '',
      };

      // 비밀번호가 변경된 경우에만 포함 (빈 문자열이 아닌 경우)
      if (editForm.password && editForm.password.trim() !== '') {
        updateData.password = editForm.password;
        console.log('🔧 비밀번호 변경 감지:', editForm.password);
      } else {
        console.log('🔧 비밀번호 변경 없음');
      }

      const response = await fetch(`/api/users/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 수정 성공:', result);

        // 성공 메시지 표시
        alert('고객 정보가 수정되었습니다.');

        // 모달 닫기
        setIsEditModalOpen(false);
        setEditingCustomer(null);
        setEditForm({});
        setEditPasswordConfirm('');

        // 서버에서 최신 데이터 다시 불러오기
        fetchCustomers();
      } else {
        const result = await response.json();
        alert(result.error || '수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('수정 오류:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingCustomer(null);
    setEditForm({});
    setEditPasswordConfirm('');
  };

  const handleInputChange = (field: keyof Customer, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = async (customerId: string, status: string) => {
    // 로그인된 사용자 권한 체크
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    // 최고관리자 또는 관리자 권한 체크
    const isAdmin =
      currentUser.grade === '최고관리자' || currentUser.grade === '관리자';

    if (!isAdmin) {
      alert('관리자만 회원 상태를 변경할 수 있습니다.');
      return;
    }

    try {
      const response = await fetch(`/api/users/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          processor: currentUser.name, // 실제 로그인된 관리자 이름
          approved_at: status === 'active' ? new Date().toISOString() : null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 상태 변경 성공:', result);

        // 서버에서 최신 데이터 다시 불러오기
        fetchCustomers();

        alert(
          `회원 상태가 ${status === 'active' ? '승인' : status === 'rejected' ? '거부' : '대기'}로 변경되었습니다.`
        );
      } else {
        const result = await response.json();
        alert(result.error || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleGradeChange = async (customerId: string, grade: string) => {
    try {
      const response = await fetch(`/api/users/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grade }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 등급 변경 성공:', result);

        // 서버에서 최신 데이터 다시 불러오기
        fetchCustomers();

        alert('등급이 변경되었습니다.');
      } else {
        const result = await response.json();
        alert(result.error || '등급 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('등급 변경 오류:', error);
      alert('등급 변경 중 오류가 발생했습니다.');
    }
  };

  const handleAddSlot = (customer: Customer) => {
    router.push(
      `/slot-add?customerId=${customer.id}&username=${encodeURIComponent(customer.username)}&name=${encodeURIComponent(customer.name)}`
    );
  };

  const handleSlotStatus = (customer: Customer) => {
    router.push(
      `/slot-status?customerId=${customer.id}&username=${encodeURIComponent(customer.username)}&name=${encodeURIComponent(customer.name)}`
    );
  };

  const getStatusButtonClass = (customerStatus: string, buttonType: string) => {
    if (customerStatus === buttonType) {
      return 'bg-black text-white hover:bg-gray-800';
    }
    return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
  };

  const handleSignupClick = () => {
    router.push('/signup');
  };

  const handleExcelImport = () => {
    setIsExcelImportModalOpen(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      // 동적으로 xlsx 라이브러리 import
      const XLSX = await import('xlsx');

      // 예시 데이터 생성
      const templateData = [
        [
          '순번',
          '소속총판',
          '아이디',
          '고객명',
          '전화번호',
          '가입일',
          '슬롯수',
        ],
        [
          1,
          '총판아디',
          'cosmos',
          '안혜진',
          '010-1234-5678',
          '2025-09-01 9:38',
          1,
        ],
        [
          2,
          '총판아디',
          'pprcomme',
          '이정호',
          '010-2345-6789',
          '2025-09-01 9:38',
          1,
        ],
        [
          3,
          '총판아디',
          'donmany8',
          '김은미',
          '010-3456-7890',
          '2025-09-01 9:38',
          1,
        ],
        [
          4,
          '총판아디',
          'tnsgh0',
          '권순호',
          '010-4567-8901',
          '2025-09-01 9:38',
          1,
        ],
        [
          5,
          '총판아디',
          'euni',
          '김은호',
          '010-5678-9012',
          '2025-09-01 9:38',
          1,
        ],
        ['', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
      ];

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);

      // 컬럼 너비 설정
      const colWidths = [
        { wch: 5 }, // No
        { wch: 12 }, // 소속총판
        { wch: 20 }, // 아이디
        { wch: 10 }, // 고객명
        { wch: 15 }, // 전화번호
        { wch: 20 }, // 가입일
        { wch: 8 }, // 슬롯수
      ];
      worksheet['!cols'] = colWidths;

      // 워크시트 추가
      XLSX.utils.book_append_sheet(workbook, worksheet, '고객목록');

      // 엑셀 파일 생성 및 다운로드
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', '고객_대량등록_양식.xlsx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 메모리 정리
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('양식 다운로드 오류:', error);
      alert('양식 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleExcelFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setExcelImportFile(file);
    }
  };

  const handleExcelImportSubmit = async () => {
    if (!excelImportFile) {
      alert('엑셀 파일을 선택해주세요.');
      return;
    }

    try {
      setExcelImportLoading(true);

      // FormData로 파일 전송
      const formData = new FormData();
      formData.append('file', excelImportFile);

      const response = await fetch('/api/users/excel-import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setIsExcelImportModalOpen(false);
        setExcelImportFile(null);
        fetchCustomers(); // 목록 새로고침
      } else {
        alert(result.error || '대량 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('대량 등록 오류:', error);
      alert('대량 등록 중 오류가 발생했습니다.');
    } finally {
      setExcelImportLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCustomers(new Set());
      setIsAllSelected(false);
    } else {
      const allCustomerIds = new Set(customers.map(customer => customer.id));
      setSelectedCustomers(allCustomerIds);
      setIsAllSelected(true);
    }
  };

  // 개별 고객 선택/해제
  const handleSelectCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
    setIsAllSelected(newSelected.size === customers.length);
  };

  // 선택된 고객들 삭제
  const handleBulkDelete = async () => {
    if (selectedCustomers.size === 0) {
      alert('삭제할 고객을 선택해주세요.');
      return;
    }

    const confirmMessage = `선택된 ${selectedCustomers.size}명의 고객을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedCustomers).map(
        async customerId => {
          const response = await fetch(`/api/users/${customerId}`, {
            method: 'DELETE',
          });
          return { customerId, success: response.ok };
        }
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        // 성공한 고객들을 목록에서 제거
        setCustomers(customers.filter(c => !selectedCustomers.has(c.id)));
        setSelectedCustomers(new Set());
        setIsAllSelected(false);
      }

      if (failCount > 0) {
        alert(`${successCount}명 삭제 성공, ${failCount}명 삭제 실패`);
      } else {
        alert(`${successCount}명의 고객이 삭제되었습니다.`);
      }
    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      alert('일괄 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="w-full px-6 pt-8 space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">고객관리</h1>
            {selectedCustomers.size > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                {selectedCustomers.size}명 선택됨
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleExcelImport}
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              대량등록
            </Button>
            {selectedCustomers.size > 0 && (
              <Button
                onClick={handleBulkDelete}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                선택삭제 ({selectedCustomers.size})
              </Button>
            )}
            <Button
              onClick={handleSignupClick}
              className="bg-black hover:bg-gray-800 text-white px-6 py-2"
            >
              회원가입
            </Button>
          </div>
        </div>

        {/* 새로 가입한 사용자 안내 */}
        {customers.some(c => c.status === 'pending') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>승인 대기 중인 고객이 있습니다.</strong> 승인, 대기,
                  거부 버튼을 클릭하여 상태를 변경해주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 데이터베이스 연결 상태 */}
        {!loading && customers.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>등록된 고객이 없습니다.</strong> 회원가입 버튼을
                  클릭하여 첫 번째 고객을 등록해보세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 고객 목록 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
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
                    비밀번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    고객명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    휴대폰/카톡
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    메모
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일/승인처리일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    슬롯수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    추가횟수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    슬롯관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={15}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      등록된 고객이 없습니다.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className={`hover:bg-gray-50 ${
                        customer.status === 'pending' ? 'bg-yellow-50' : ''
                      } ${selectedCustomers.has(customer.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.has(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customers.length - index}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.distributor_name ||
                          customer.distributor ||
                          '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.password || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <select
                          value={customer.grade}
                          onChange={e =>
                            handleGradeChange(customer.id, e.target.value)
                          }
                          className="border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                        >
                          <option value="일반회원">일반회원</option>
                          <option value="총판회원">총판회원</option>
                          <option value="최고관리자">최고관리자</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{customer.phone || '-'}</div>
                          <div className="text-xs text-gray-500">
                            {customer.kakaoId || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.memo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{formatDate(customer.created_at)}</div>
                          <div className="text-xs text-gray-500">
                            {customer.approved_at
                              ? formatDate(customer.approved_at)
                              : '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusChange(customer.id, 'active')
                            }
                            className={`px-3 py-1 text-xs ${getStatusButtonClass(customer.status, 'active')}`}
                          >
                            승인
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusChange(customer.id, 'pending')
                            }
                            className={`px-3 py-1 text-xs ${getStatusButtonClass(customer.status, 'pending')}`}
                          >
                            대기
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusChange(customer.id, 'rejected')
                            }
                            className={`px-3 py-1 text-xs ${getStatusButtonClass(customer.status, 'rejected')}`}
                          >
                            거부
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.slot_used}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.additional_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleSlotStatus(customer)}
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            현황
                          </Button>
                          <Button
                            onClick={() => handleEdit(customer)}
                            variant="outline"
                            size="sm"
                            className="text-gray-600 border-gray-300 hover:bg-gray-50"
                          >
                            수정
                          </Button>
                          <Button
                            onClick={() => handleAddSlot(customer)}
                            variant="outline"
                            size="sm"
                            className="text-gray-600 border-gray-300 hover:bg-gray-50"
                          >
                            슬롯추가
                          </Button>
                          <Button
                            onClick={() => handleDelete(customer.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            삭제
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

        {/* 수정 모달 */}
        {isEditModalOpen && editingCustomer && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[600px] max-w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">고객 정보 수정</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-username">아이디 *</Label>
                  <Input
                    id="edit-username"
                    value={editForm.username || ''}
                    onChange={e =>
                      handleInputChange('username', e.target.value)
                    }
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-password">비밀번호</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editForm.password || ''}
                    onChange={e =>
                      handleInputChange('password', e.target.value)
                    }
                    className="mt-1"
                    placeholder="변경시에만 입력"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-password-confirm">비밀번호 확인</Label>
                  <Input
                    id="edit-password-confirm"
                    type="password"
                    value={editPasswordConfirm}
                    onChange={e => setEditPasswordConfirm(e.target.value)}
                    className="mt-1"
                    placeholder="비밀번호 변경시에만 입력"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-name">고객명 *</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name || ''}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">이메일</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email || ''}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">휴대폰</Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone || ''}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-kakaoId">카카오톡 아이디</Label>
                  <Input
                    id="edit-kakaoId"
                    value={editForm.kakaoId || ''}
                    onChange={e => handleInputChange('kakaoId', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-grade">등급 *</Label>
                  <select
                    id="edit-grade"
                    value={editForm.grade || ''}
                    onChange={e => handleInputChange('grade', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="일반회원">일반회원</option>
                    <option value="총판회원">총판회원</option>
                    <option value="최고관리자">최고관리자</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-distributor">소속총판 *</Label>
                  <select
                    id="edit-distributor"
                    value={editForm.distributor || ''}
                    onChange={e =>
                      handleInputChange('distributor', e.target.value)
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">소속총판을 선택하세요</option>
                    {distributors.map(distributor => (
                      <option key={distributor.id} value={distributor.name}>
                        {distributor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-memo">메모</Label>
                  <Textarea
                    id="edit-memo"
                    value={editForm.memo || ''}
                    onChange={e => handleInputChange('memo', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  수정
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 엑셀 대량 등록 모달 */}
        {isExcelImportModalOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            onClick={e => {
              if (e.target === e.currentTarget) {
                setIsExcelImportModalOpen(false);
                setExcelImportFile(null);
              }
            }}
          >
            <div className="bg-white rounded-lg p-6 w-[600px] max-w-full mx-4 shadow-2xl border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">고객 대량 등록</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-blue-900">
                      엑셀 파일 양식
                    </h4>
                    <Button
                      onClick={handleDownloadTemplate}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      📥 양식 다운로드
                    </Button>
                  </div>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>
                      <strong>컬럼 순서:</strong> 순번, 소속총판, 아이디,
                      고객명, 전화번호, 가입일, 슬롯수
                    </p>
                    <p>
                      <strong>주의사항:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>첫 번째 행은 반드시 헤더여야 합니다</li>
                      <li>아이디와 고객명은 필수 입력 항목입니다</li>
                      <li>전화번호는 선택사항입니다 (빈 값 가능)</li>
                      <li>가입일 형식: YYYY-MM-DD HH:mm:ss 또는 YYYY-MM-DD</li>
                      <li>슬롯수는 숫자로 입력해주세요</li>
                    </ul>
                    <p>
                      <strong>예시:</strong>
                    </p>
                    <div className="bg-white p-2 rounded border text-xs font-mono">
                      순번 소속총판 아이디 고객명 전화번호 가입일 슬롯수
                      <br />
                      1 총판아디 cosmos 안혜진 010-1234-5678 2025-09-01 9:38 1
                      <br />2 총판아디 pprcomme 이정호 010-2345-6789 2025-09-01
                      9:38 1
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="excel-import-file">엑셀 파일 선택</Label>
                  <Input
                    id="excel-import-file"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelFileUpload}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    엑셀 파일(.xlsx, .xls) 또는 CSV 파일을 선택해주세요.
                  </p>
                </div>
                {excelImportFile && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-700">
                      선택된 파일: {excelImportFile.name}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => {
                    setIsExcelImportModalOpen(false);
                    setExcelImportFile(null);
                  }}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  취소
                </Button>
                <Button
                  onClick={handleExcelImportSubmit}
                  disabled={!excelImportFile || excelImportLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {excelImportLoading ? '처리중...' : '대량 등록'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
