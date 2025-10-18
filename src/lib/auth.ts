/**
 * 권한 관리 유틸리티
 * 사용자 역할 및 권한 체크를 위한 함수들
 */

export interface UserPermissions {
  id?: string;
  username: string;
  name?: string;
  grade: string; // 기존 grade 필드 유지
  role: '최고관리자' | '총판' | '일반회원'; // 새로 추가된 role 필드
  status: 'active' | 'pending' | 'rejected' | 'suspended'; // 새로 추가된 status 필드
  distributor: string; // 소속 총판명
}

// ============================================================
// 사용자 역할 확인 함수
// ============================================================

/**
 * 최고관리자 여부 확인
 */
export const isMasterAdmin = (user: UserPermissions | null): boolean => {
  if (!user) return false;
  return user.username === 'master' || user.role === '최고관리자';
};

/**
 * 총판 여부 확인
 */
export const isDistributor = (user: UserPermissions | null): boolean => {
  if (!user) return false;
  return user.username !== 'master' && user.grade === '총판회원';
};

/**
 * 일반회원 여부 확인
 */
export const isRegularUser = (user: UserPermissions | null): boolean => {
  if (!user) return false;
  return user.username !== 'master' && user.grade === '일반회원';
};

// ============================================================
// 로그인 및 상태 확인
// ============================================================

/**
 * 로그인 가능 여부 (status가 'active'인 경우만)
 */
export const canLogin = (user: UserPermissions | null): boolean => {
  if (!user) return false;
  return user.status === 'active';
};

/**
 * 사용자 권한 유효성 검증
 */
export const validateUserPermissions = (user: any): boolean => {
  if (!user) return false;
  if (!user.username || !user.grade) return false;
  if (!user.status || user.status !== 'active') return false;
  return true;
};

// ============================================================
// 페이지/기능별 접근 권한
// ============================================================

/**
 * 고객 관리 접근 권한
 * 최고관리자, 총판만 접근 가능
 */
export const canAccessCustomerManagement = (
  user: UserPermissions | null
): boolean => {
  if (!user) return false;
  return isMasterAdmin(user) || isDistributor(user);
};

/**
 * 총판 관리 접근 권한
 * 최고관리자만 접근 가능
 */
export const canAccessDistributorManagement = (
  user: UserPermissions | null
): boolean => {
  if (!user) return false;
  return isMasterAdmin(user);
};

/**
 * 작업 관리 접근 권한
 * 최고관리자, 총판만 접근 가능
 */
export const canAccessWorkManagement = (
  user: UserPermissions | null
): boolean => {
  if (!user) return false;
  return isMasterAdmin(user) || isDistributor(user);
};

/**
 * 정산 관리 접근 권한
 * 최고관리자, 총판만 접근 가능
 */
export const canAccessSettlementManagement = (
  user: UserPermissions | null
): boolean => {
  if (!user) return false;
  return isMasterAdmin(user) || isDistributor(user);
};

/**
 * 트래픽 상태 접근 권한
 * 최고관리자만 접근 가능
 */
export const canAccessTrafficStatus = (
  user: UserPermissions | null
): boolean => {
  if (!user) return false;
  return isMasterAdmin(user);
};

/**
 * 랭킹 상태 접근 권한
 * 최고관리자만 접근 가능
 */
export const canAccessRankingStatus = (
  user: UserPermissions | null
): boolean => {
  if (!user) return false;
  return isMasterAdmin(user);
};

/**
 * 슬롯 추가 접근 권한
 * 모든 로그인 사용자 접근 가능
 */
export const canAccessSlotAdd = (user: UserPermissions | null): boolean => {
  if (!user) return false;
  return isMasterAdmin(user) || isDistributor(user) || isRegularUser(user);
};

/**
 * 메인 서비스 접근 권한
 * 모든 로그인 사용자 접근 가능
 */
export const canAccessMainService = (user: UserPermissions | null): boolean => {
  if (!user) return false;
  return isMasterAdmin(user) || isDistributor(user) || isRegularUser(user);
};

/**
 * 무료 서비스 접근 권한
 * 모든 로그인 사용자 접근 가능
 */
export const canAccessFreeService = (user: UserPermissions | null): boolean => {
  if (!user) return false;
  return isMasterAdmin(user) || isDistributor(user) || isRegularUser(user);
};

/**
 * 공지사항 접근 권한
 * 모든 로그인 사용자 접근 가능
 */
export const canAccessNotices = (user: UserPermissions | null): boolean => {
  if (!user) return false;
  return isMasterAdmin(user) || isDistributor(user) || isRegularUser(user);
};

/**
 * 페이지 접근 권한 통합 체크
 */
export const canAccessPage = (
  user: UserPermissions | null,
  page: string
): boolean => {
  if (!user) return false;

  const pagePermissions: { [key: string]: (user: UserPermissions) => boolean } =
    {
      '/customer': canAccessCustomerManagement,
      '/distributor': canAccessDistributorManagement,
      '/distributor-add': canAccessDistributorManagement,
      '/slot-management': canAccessWorkManagement,
      '/slot-add': canAccessSlotAdd,
      '/settlement': canAccessSettlementManagement,
      '/settlement/unsettled': canAccessSettlementManagement,
      '/settlement/history': canAccessSettlementManagement,
      '/settlement/edit': canAccessSettlementManagement,
      '/settlement/detail': canAccessSettlementManagement,
      '/settlement/request': canAccessSettlementManagement,
      '/settlement/status': canAccessSettlementManagement,
      '/traffic-status': canAccessTrafficStatus,
      '/ranking-status': canAccessRankingStatus,
      '/coupangapp': canAccessMainService,
      '/dashboard': canAccessFreeService,
      '/notices': canAccessNotices,
    };

  const checkFunction = pagePermissions[page];
  return checkFunction ? checkFunction(user) : false;
};

// ============================================================
// 데이터 필터링 조건 반환
// ============================================================

/**
 * 데이터 필터링 조건 반환 (일반)
 */
export const getDataFilter = (user: UserPermissions | null): any => {
  if (!user) return { customerId: 'invalid' };

  if (isMasterAdmin(user)) {
    return {}; // 최고관리자는 모든 데이터
  } else if (isDistributor(user)) {
    return { distributor: user.distributor }; // 총판은 본인 소속 데이터
  } else if (isRegularUser(user)) {
    return { customerId: user.username }; // 일반회원은 본인 데이터
  }

  return { customerId: 'invalid' }; // 접근 불가
};

/**
 * 슬롯 데이터 필터링 조건 반환
 */
export const getSlotDataFilter = (user: UserPermissions | null): any => {
  if (!user) return { customer_id: 'invalid' };

  if (isMasterAdmin(user)) {
    return {}; // 최고관리자는 모든 슬롯
  } else if (isDistributor(user)) {
    return { distributor: user.distributor }; // 총판은 본인 소속 슬롯
  } else if (isRegularUser(user)) {
    return { customer_id: user.username }; // 일반회원은 본인 슬롯
  }

  return { customer_id: 'invalid' };
};

/**
 * 정산 데이터 필터링 조건 반환
 */
export const getSettlementDataFilter = (user: UserPermissions | null): any => {
  if (!user) return { customer_id: 'invalid' };

  if (isMasterAdmin(user)) {
    return {}; // 최고관리자는 모든 정산
  } else if (isDistributor(user)) {
    return { distributor_name: user.distributor }; // 총판은 본인 소속 정산
  } else if (isRegularUser(user)) {
    return { customer_id: user.username }; // 일반회원은 본인 정산
  }

  return { customer_id: 'invalid' };
};

// ============================================================
// 네비게이션 아이템 필터링
// ============================================================

export interface NavigationItem {
  name: string;
  href: string;
  roles: string[];
  subItems?: NavigationItem[];
}

/**
 * 네비게이션 아이템 필터링
 * 사용자 역할에 따라 표시할 메뉴 반환
 */
export const getNavigationItems = (
  user: UserPermissions | null
): NavigationItem[] => {
  if (!user) return [];

  const allItems: NavigationItem[] = [
    {
      name: '무료 서비스',
      href: '/dashboard',
      roles: ['최고관리자', '총판회원', '일반회원'],
      subItems: [
        {
          name: '쿠팡순위체크',
          href: '/coupangapp/copangrank',
          roles: ['최고관리자', '총판회원', '일반회원'],
        },
        {
          name: 'N쇼핑순위체크',
          href: '/coupangapp/naverrank',
          roles: ['최고관리자', '총판회원', '일반회원'],
        },
        {
          name: 'N플레이스순위체크',
          href: '/coupangapp/placerank',
          roles: ['최고관리자', '총판회원', '일반회원'],
        },
      ],
    },
    {
      name: '메인서비스',
      href: '/coupangapp/add',
      roles: ['최고관리자', '총판회원', '일반회원'],
      subItems: [
        {
          name: '쿠팡',
          href: '/coupangapp/add',
          roles: ['최고관리자', '총판회원', '일반회원'],
        },
        {
          name: '쿠팡VIP',
          href: '/coupangapp/vip',
          roles: ['최고관리자', '총판회원', '일반회원'],
        },
        {
          name: '쿠팡APP',
          href: '/coupangapp/app',
          roles: ['최고관리자', '총판회원', '일반회원'],
        },
        {
          name: '네이버쇼핑',
          href: '/coupangapp/naver',
          roles: ['최고관리자', '총판회원', '일반회원'],
        },
        {
          name: '플레이스',
          href: '/coupangapp/place',
          roles: ['최고관리자', '총판회원', '일반회원'],
        },
        {
          name: '오늘의집',
          href: '/coupangapp/todayhome',
          roles: ['최고관리자', '총판회원', '일반회원'],
        },
        {
          name: '알리',
          href: '/coupangapp/aliexpress',
          roles: ['최고관리자', '총판회원', '일반회원'],
        },
      ],
    },
    {
      name: '고객관리',
      href: '/customer',
      roles: ['최고관리자', '총판회원'],
      subItems: [
        {
          name: '고객관리',
          href: '/customer',
          roles: ['최고관리자', '총판회원'],
        },
        {
          name: '슬롯관리',
          href: '/admin/slots',
          roles: ['최고관리자', '총판회원'],
        },
        {
          name: '슬롯현황',
          href: '/slot-status',
          roles: ['최고관리자', '총판회원'],
        },
      ],
    },
    {
      name: '정산관리',
      href: '/settlement',
      roles: ['최고관리자', '총판회원'],
      subItems: [
        {
          name: '미정산내역',
          href: '/settlement/unsettled',
          roles: ['최고관리자', '총판회원'],
        },
        {
          name: '정산대기',
          href: '/settlement',
          roles: ['최고관리자', '총판회원'],
        },
        {
          name: '정산내역',
          href: '/settlement/history',
          roles: ['최고관리자', '총판회원'],
        },
      ],
    },
    {
      name: '총판관리',
      href: '/distributor-add',
      roles: ['최고관리자'],
    },
    {
      name: '작업관리',
      href: isDistributor(user) ? '/slot-add' : '/slot-management', // 총판은 슬롯추가로 직접 이동
      roles: ['최고관리자', '총판회원'],
      subItems: isDistributor(user)
        ? [
            {
              name: '슬롯추가',
              href: '/slot-add',
              roles: ['최고관리자', '총판회원'],
            },
          ]
        : [
            {
              name: '작업관리',
              href: '/slot-management',
              roles: ['최고관리자'],
            },
            {
              name: '슬롯추가',
              href: '/slot-add',
              roles: ['최고관리자', '총판회원'],
            },
          ],
    },
    {
      name: '트래픽 상태',
      href: '/traffic-status',
      roles: ['최고관리자'],
    },
    {
      name: '랭킹 상태',
      href: '/ranking-status',
      roles: ['최고관리자'],
    },
    {
      name: '공지사항',
      href: '/notices',
      roles: ['최고관리자', '총판회원', '일반회원'],
    },
  ];

  // 사용자 grade에 따라 필터링
  const filterItems = (items: NavigationItem[]): NavigationItem[] => {
    return items
      .filter(item => item.roles.includes(user.grade))
      .map(item => ({
        ...item,
        subItems: item.subItems ? filterItems(item.subItems) : undefined,
      }));
  };

  return filterItems(allItems);
};
