'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function DashboardPage() {
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
  }, []);

  const isRegularUser = userInfo?.grade === '일반회원';

  // 서비스 링크 생성 함수
  const getServiceLink = (basePath: string, slotType: string) => {
    if (isRegularUser && userInfo) {
      return `${basePath}?customerId=${userInfo.id}&username=${userInfo.username}&slotCount=10&customerName=${encodeURIComponent(userInfo.name || userInfo.username)}&slotType=${encodeURIComponent(slotType)}`;
    }
    return basePath;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* 메인 제목 및 설명 */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-5 lg:mb-6">
            {/* AD 로고 */}
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                <span className="text-white text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
                  AD
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>

            {/* 애드팡팡 텍스트 */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent pb-1">
              애드팡팡
            </h1>
          </div>

          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
            상품 랭킹을{' '}
            <span className="font-semibold text-purple-600">
              실시간으로 추적
            </span>
            하고 관리하는 통합 플랫폼입니다.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            무료 서비스부터 고급 관리 기능까지{' '}
            <span className="font-semibold text-purple-600">
              한 곳에서 확인
            </span>
            하세요.
          </p>
        </div>

        {/* 무료 서비스 및 메인 서비스 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12">
          {/* 무료 서비스 */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-green-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4 sm:mb-5 lg:mb-6">
              <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                무료 서비스
              </h3>
            </div>
            <p className="text-gray-600 mb-4 sm:mb-5 lg:mb-6 text-xs sm:text-sm">
              기본 랭킹 추적 기능을 무료로 이용할 수 있습니다.
            </p>
            <div className="space-y-2 sm:space-y-3">
              <Link
                href={getServiceLink('/coupangapp/copangrank', '쿠팡순위체크')}
                className="flex justify-between items-center p-3 sm:p-4 bg-white rounded-lg hover:bg-orange-50 transition-all group border border-transparent hover:border-orange-200 min-h-[56px]"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs sm:text-sm font-bold">
                      쿠
                    </span>
                  </div>
                  <span className="text-gray-800 font-medium group-hover:text-orange-700 text-sm sm:text-base">
                    쿠팡순위체크
                  </span>
                </div>
                <span className="px-3 py-1.5 sm:px-4 bg-gradient-to-br from-orange-100 to-red-100 text-orange-700 rounded-lg text-xs sm:text-sm font-medium group-hover:from-orange-200 group-hover:to-red-200 transition-all flex-shrink-0">
                  이동 →
                </span>
              </Link>
              <Link
                href={getServiceLink('/coupangapp/naverrank', 'N쇼핑순위체크')}
                className="flex justify-between items-center p-4 bg-white rounded-lg hover:bg-green-50 transition-all group border border-transparent hover:border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">N</span>
                  </div>
                  <span className="text-gray-800 font-medium group-hover:text-green-700">
                    N쇼핑순위체크
                  </span>
                </div>
                <span className="px-4 py-1.5 bg-gradient-to-br from-green-100 to-green-200 text-green-700 rounded-lg text-sm font-medium group-hover:from-green-200 group-hover:to-green-300 transition-all">
                  이동 →
                </span>
              </Link>
              <Link
                href={getServiceLink(
                  '/coupangapp/placerank',
                  'N플레이스순위체크'
                )}
                className="flex justify-between items-center p-4 bg-white rounded-lg hover:bg-blue-50 transition-all group border border-transparent hover:border-blue-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-medium group-hover:text-blue-700">
                    N플레이스순위체크
                  </span>
                </div>
                <span className="px-4 py-1.5 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 rounded-lg text-sm font-medium group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                  이동 →
                </span>
              </Link>
            </div>
          </div>

          {/* 메인 서비스 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-8 border border-purple-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">메인 서비스</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              {isRegularUser
                ? '내 슬롯을 관리하고 모니터링합니다.'
                : '전체 슬롯을 관리하고 모니터링합니다.'}
            </p>
            <div className="space-y-3">
              <Link
                href={getServiceLink('/coupangapp/add', '쿠팡')}
                className="flex justify-between items-center p-4 bg-white rounded-lg hover:bg-orange-50 transition-all group border border-transparent hover:border-orange-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">쿠</span>
                  </div>
                  <span className="text-gray-800 font-medium group-hover:text-orange-700">
                    쿠팡
                  </span>
                </div>
                <span className="px-4 py-1.5 bg-gradient-to-br from-orange-100 to-red-100 text-orange-700 rounded-lg text-sm font-medium group-hover:from-orange-200 group-hover:to-red-200 transition-all">
                  이동 →
                </span>
              </Link>
              <Link
                href={getServiceLink('/coupangapp/vip', '쿠팡VIP')}
                className="flex justify-between items-center p-4 bg-white rounded-lg hover:bg-yellow-50 transition-all group border border-transparent hover:border-yellow-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-medium group-hover:text-yellow-700">
                    쿠팡VIP
                  </span>
                </div>
                <span className="px-4 py-1.5 bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-700 rounded-lg text-sm font-medium group-hover:from-yellow-200 group-hover:to-orange-200 transition-all">
                  이동 →
                </span>
              </Link>
              <Link
                href={getServiceLink('/coupangapp/app', '쿠팡APP')}
                className="flex justify-between items-center p-4 bg-white rounded-lg hover:bg-pink-50 transition-all group border border-transparent hover:border-pink-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-medium group-hover:text-pink-700">
                    쿠팡APP
                  </span>
                </div>
                <span className="px-4 py-1.5 bg-gradient-to-br from-red-100 to-pink-100 text-pink-700 rounded-lg text-sm font-medium group-hover:from-red-200 group-hover:to-pink-200 transition-all">
                  이동 →
                </span>
              </Link>
              <Link
                href={getServiceLink('/coupangapp/naver', '네이버쇼핑')}
                className="flex justify-between items-center p-4 bg-white rounded-lg hover:bg-green-50 transition-all group border border-transparent hover:border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">N</span>
                  </div>
                  <span className="text-gray-800 font-medium group-hover:text-green-700">
                    네이버쇼핑
                  </span>
                </div>
                <span className="px-4 py-1.5 bg-gradient-to-br from-green-100 to-green-200 text-green-700 rounded-lg text-sm font-medium group-hover:from-green-200 group-hover:to-green-300 transition-all">
                  이동 →
                </span>
              </Link>
              <Link
                href={getServiceLink('/coupangapp/place', '플레이스')}
                className="flex justify-between items-center p-4 bg-white rounded-lg hover:bg-blue-50 transition-all group border border-transparent hover:border-blue-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-medium group-hover:text-blue-700">
                    플레이스
                  </span>
                </div>
                <span className="px-4 py-1.5 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 rounded-lg text-sm font-medium group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                  이동 →
                </span>
              </Link>
              <Link
                href={getServiceLink('/coupangapp/todayhome', '오늘의집')}
                className="flex justify-between items-center p-4 bg-white rounded-lg hover:bg-teal-50 transition-all group border border-transparent hover:border-teal-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-medium group-hover:text-teal-700">
                    오늘의집
                  </span>
                </div>
                <span className="px-4 py-1.5 bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-700 rounded-lg text-sm font-medium group-hover:from-teal-200 group-hover:to-cyan-200 transition-all">
                  이동 →
                </span>
              </Link>
              <Link
                href={getServiceLink('/coupangapp/aliexpress', '알리')}
                className="flex justify-between items-center p-4 bg-white rounded-lg hover:bg-red-50 transition-all group border border-transparent hover:border-red-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-medium group-hover:text-red-700">
                    알리
                  </span>
                </div>
                <span className="px-4 py-1.5 bg-gradient-to-br from-red-100 to-orange-100 text-red-700 rounded-lg text-sm font-medium group-hover:from-red-200 group-hover:to-orange-200 transition-all">
                  이동 →
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link
            href="/customer"
            className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-blue-200 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                고객 관리
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                사용자 정보와 슬롯을 관리합니다.
              </p>
              <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg font-medium group-hover:bg-blue-700 transition-colors">
                이동 →
              </div>
            </div>
          </Link>

          <Link
            href="/settlement/unsettled"
            className="group relative bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-green-200 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                정산 관리
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                미정산 내역을 확인하고 관리합니다.
              </p>
              <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg font-medium group-hover:bg-green-700 transition-colors">
                이동 →
              </div>
            </div>
          </Link>

          <Link
            href="/admin/slots"
            className="group relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-purple-200 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                슬롯 관리
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                슬롯 할당 및 사용 현황을 관리합니다.
              </p>
              <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-lg font-medium group-hover:bg-purple-700 transition-colors">
                이동 →
              </div>
            </div>
          </Link>

          <Link
            href="/slot-status"
            className="group relative bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-orange-200 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                슬롯 현황
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                전체 슬롯 상태를 모니터링합니다.
              </p>
              <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-orange-600 text-white rounded-lg font-medium group-hover:bg-orange-700 transition-colors">
                이동 →
              </div>
            </div>
          </Link>
        </div>

        {/* 작업 관리 - 일반회원에게는 숨김 */}
        {!isRegularUser && (
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <div className="flex items-center mb-4 sm:mb-5 lg:mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
              <h3 className="text-2xl font-bold text-gray-900">작업 관리</h3>
            </div>
            <p className="text-gray-600 mb-6 text-lg">
              시스템 작업 상태를 실시간으로 모니터링하고 관리합니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
              <Link
                href="/ranking-status"
                className="group relative bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-indigo-200 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    순위체크현황
                  </h4>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                    상품 랭킹 체크 상태와 결과를 모니터링합니다.
                  </p>
                  <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg font-medium group-hover:bg-indigo-700 transition-colors">
                    순위체크현황 보기
                  </div>
                </div>
              </Link>

              <Link
                href="/traffic-status"
                className="group relative bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-cyan-200 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    트래픽현황
                  </h4>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                    API 요청 및 응답 상태를 실시간으로 확인합니다.
                  </p>
                  <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-cyan-600 text-white rounded-lg font-medium group-hover:bg-cyan-700 transition-colors">
                    트래픽현황 보기
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* 최신 공지사항 */}
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-12 border border-blue-200 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full -mr-32 -mt-32 opacity-30"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                최신 공지사항
              </h3>
            </div>
            <div className="bg-white/80 backdrop-blur-sm border-2 border-blue-300 rounded-xl p-6 mb-6 shadow-md">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 animate-pulse"></div>
                <p className="text-gray-800 text-sm sm:text-base lg:text-lg leading-relaxed">
                  새로운 기능이 추가되었습니다! 쿠팡 APP 전용 랭킹 트래커를
                  사용해보세요.
                </p>
              </div>
            </div>
            <Link
              href="/notices"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>전체 공지사항 보기</span>
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* 주요 지표 */}
        <div className="mb-6">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">주요 지표</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl shadow-md p-4 sm:p-5 lg:p-6 text-center border border-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-600 mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                156
              </div>
              <div className="text-gray-700 font-medium text-xs sm:text-sm">
                전체 사용자
              </div>
            </div>
          </div>
          <div className="group relative bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl shadow-md p-4 sm:p-5 lg:p-6 text-center border border-green-200 hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-green-600 mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                89
              </div>
              <div className="text-gray-700 font-medium text-xs sm:text-sm">
                활성 슬롯
              </div>
            </div>
          </div>
          <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl shadow-md p-4 sm:p-5 lg:p-6 text-center border border-purple-200 hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-purple-600 mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                342
              </div>
              <div className="text-gray-700 font-medium text-xs sm:text-sm">
                추적 상품
              </div>
            </div>
          </div>
          <div className="group relative bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg sm:rounded-xl shadow-md p-4 sm:p-5 lg:p-6 text-center border border-indigo-200 hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-indigo-600 mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                1280
              </div>
              <div className="text-gray-700 font-medium text-xs sm:text-sm">
                성공 체크
              </div>
            </div>
          </div>
          <div className="group relative bg-gradient-to-br from-red-50 to-red-100 rounded-lg sm:rounded-xl shadow-md p-4 sm:p-5 lg:p-6 text-center border border-red-200 hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-red-600 mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                23
              </div>
              <div className="text-gray-700 font-medium text-xs sm:text-sm">
                실패 체크
              </div>
            </div>
          </div>
          <div className="group relative bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg sm:rounded-xl shadow-md p-4 sm:p-5 lg:p-6 text-center border border-pink-200 hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-pink-600 mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                715ms
              </div>
              <div className="text-gray-700 font-medium text-xs sm:text-sm">
                평균 응답시간
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
