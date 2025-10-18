'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Building2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import {
  getDistributors,
  deleteDistributor,
  Distributor,
  checkDistributorsTable,
} from '@/lib/supabase';

export default function DistributorAddPage() {
  const router = useRouter();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState<boolean | null>(null);

  useEffect(() => {
    loadDistributors();
  }, []);

  const loadDistributors = async () => {
    try {
      // 먼저 테이블 존재 여부 확인
      const tableCheck = await checkDistributorsTable();
      setTableExists(tableCheck.exists);

      if (!tableCheck.exists) {
        console.error(
          'distributors 테이블이 존재하지 않습니다:',
          tableCheck.error
        );
        setLoading(false);
        return;
      }

      const data = await getDistributors();
      setDistributors(data);
      setLoading(false);
    } catch (error) {
      console.error('총판 목록 로드 실패:', error);
      setLoading(false);
    }
  };

  const handleAddDistributor = () => {
    router.push('/distributor-add/add');
  };

  const handleEditDistributor = (distributor: Distributor) => {
    router.push(`/distributor-add/edit/${distributor.id}`);
  };

  const handleDeleteDistributor = async (distributor: Distributor) => {
    if (confirm(`정말로 "${distributor.name}" 총판을 삭제하시겠습니까?`)) {
      try {
        await deleteDistributor(distributor.id!);
        alert('총판이 성공적으로 삭제되었습니다.');
        loadDistributors(); // 목록 새로고침
      } catch (error) {
        console.error('총판 삭제 실패:', error);
        alert('총판 삭제에 실패했습니다.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">활성</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">비활성</Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === '본사' ? (
      <Badge className="bg-blue-100 text-blue-800">본사</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">선택안함</Badge>
    );
  };

  if (loading) {
    return (
      <div className="wrapper">
        <Navigation />
        <div className="content-wrapper">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (tableExists === false) {
    return (
      <div className="wrapper">
        <Navigation />
        <div className="content-wrapper">
          <div className="container mx-auto p-2 pt-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                총판관리
              </h1>
              <p className="text-gray-600">
                총판 정보를 관리하고 새로운 총판을 추가할 수 있습니다.
              </p>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Building2 className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    데이터베이스 테이블이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    distributors 테이블이 Supabase에 생성되지 않았습니다.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-yellow-800 mb-2">
                      해결 방법:
                    </h4>
                    <ol className="text-sm text-yellow-700 space-y-1">
                      <li>1. Supabase 대시보드에서 SQL Editor를 열어주세요</li>
                      <li>
                        2. create-distributors-table.sql 파일의 내용을 복사하여
                        실행하세요
                      </li>
                      <li>3. 페이지를 새로고침하세요</li>
                    </ol>
                  </div>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    페이지 새로고침
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapper">
      <Navigation />
      <div className="content-wrapper">
        <div className="container mx-auto p-2 pt-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">총판관리</h1>
            <p className="text-gray-600">
              총판 정보를 관리하고 새로운 총판을 추가할 수 있습니다.
            </p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      총 총판 수
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {distributors.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      활성 총판
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {distributors.filter(d => d.status === 'active').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      본사 총판
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {distributors.filter(d => d.type === '본사').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 총판 목록 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">총판 목록</CardTitle>
              <Button
                onClick={handleAddDistributor}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                총판추가
              </Button>
            </CardHeader>
            <CardContent>
              {distributors.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">등록된 총판이 없습니다.</p>
                  <Button
                    onClick={handleAddDistributor}
                    variant="outline"
                    className="mt-4"
                  >
                    첫 번째 총판 추가하기
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          순번
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          총판명
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상부
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          하부개수
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          총판관리자
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          도메인/IP
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          사이트명
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          접힌메뉴약어
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          기본일수
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          쿠폰일수
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          회원수
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          메모
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {distributors.map((distributor, index) => (
                        <tr key={distributor.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {distributor.name}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getTypeBadge(distributor.type)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {distributor.sub_count || 0}개
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {distributor.manager || '-'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {distributor.domain || '-'} /{' '}
                            {distributor.ip || '-'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {distributor.site_name || '-'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {distributor.menu_abbr || '-'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {distributor.default_days}일
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {distributor.coupon_days}일
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {distributor.member_count || 0}명
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div
                              className="max-w-xs truncate"
                              title={distributor.memo || ''}
                            >
                              {distributor.memo || '-'}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <Button
                                onClick={() =>
                                  handleEditDistributor(distributor)
                                }
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                수정
                              </Button>
                              <Button
                                onClick={() =>
                                  handleDeleteDistributor(distributor)
                                }
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                삭제
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
