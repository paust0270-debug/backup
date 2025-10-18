'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getNavigationItems, UserPermissions } from '@/lib/auth';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [user, setUser] = useState<UserPermissions | null>(null);
  const [navigationItems, setNavigationItems] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 사용자 정보 로드
  useEffect(() => {
    if (!isClient) return;

    try {
      const userStr = localStorage.getItem('user');
      console.log('📋 localStorage user:', userStr ? '있음' : '없음');

      if (userStr) {
        const userInfo = JSON.parse(userStr);
        console.log('👤 사용자 정보:', userInfo.username, userInfo.grade);

        setUser(userInfo);

        try {
          const filteredItems = getNavigationItems(userInfo);
          console.log('📌 네비게이션 아이템 수:', filteredItems.length);
          setNavigationItems(filteredItems);
        } catch (navError) {
          console.error('❌ 네비게이션 아이템 생성 오류:', navError);
          // 에러가 발생해도 사용자 정보는 유지
          setNavigationItems([]);
        }
      }
    } catch (error) {
      console.error('❌ 사용자 정보 로드 오류:', error);
    }
  }, [isClient]);

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('sessionTimestamp');
      setUser(null);
      router.push('/login');
    }
  };

  // 클라이언트 마운트 전에는 빈 네비게이션 렌더링
  if (!isClient) {
    return (
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                  <span className="text-white font-bold text-base sm:text-lg lg:text-xl">
                    AD
                  </span>
                </div>
                <span className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  애드팡팡
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">로딩 중...</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // 로그인 페이지에서는 네비게이션 숨김
  if (pathname === '/login') {
    return null;
  }

  // 사용자 정보가 없으면 네비게이션 숨김
  if (!user) {
    return null;
  }

  // 현재 활성화된 메인 탭 찾기
  const activeMainTab = navigationItems.find(
    item =>
      pathname.startsWith(item.href) ||
      (item.subItems &&
        item.subItems.some((sub: any) => pathname.startsWith(sub.href)))
  );

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* 왼쪽 로고 */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="flex items-center">
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <span className="text-white font-bold text-base sm:text-lg lg:text-xl">
                  AD
                </span>
              </div>
              <span className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                애드팡팡
              </span>
            </Link>
          </div>

          {/* 중앙 네비게이션 메뉴 */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map(item => {
              const isActive = activeMainTab === item;
              const hasSubItems = item.subItems && item.subItems.length > 0;

              return (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>

                  {/* 드롭다운 서브메뉴 */}
                  {hasSubItems && hoveredItem === item.name && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      {item.subItems.map((subItem: any) => {
                        const isSubActive = pathname.startsWith(subItem.href);
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                              isSubActive
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 우측 사용자 영역 */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                {user.name} ({user.grade})
              </span>
              <span className="text-xs text-gray-600 sm:hidden">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-colors duration-200"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
