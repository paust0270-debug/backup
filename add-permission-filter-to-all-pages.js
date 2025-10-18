const fs = require('fs');
const path = require('path');

const pages = [
  'vip',
  'app',
  'naver',
  'place',
  'todayhome',
  'aliexpress',
  'copangrank',
  'naverrank',
  'placerank',
];

const basePath = path.join(__dirname, 'src', 'app', 'coupangapp');

const permissionCheckCode = `      } else {
        // 관리자 페이지인 경우 권한 체크
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          
          // 일반회원은 관리자 페이지 접근 불가
          if (user.grade === '일반회원' && user.username !== 'master') {
            setError('일반회원은 관리자 페이지에 접근할 수 없습니다.');
            setCustomers([]);
            setLoading(false);
            return;
          }
          
          // 총판회원은 본인 소속총판 데이터만 조회
          if (user.grade === '총판회원' && user.username !== 'master') {
            apiUrl += \`&distributor=\${encodeURIComponent(user.distributor)}\`;
          }
          // 최고관리자(master)는 필터링 없이 전체 조회
        }
      }`;

pages.forEach(pageName => {
  const filePath = path.join(basePath, pageName, 'page.tsx');

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  파일 없음: ${filePath}`);
    return;
  }

  console.log(`🔄 처리 중: ${pageName}/page.tsx`);

  let content = fs.readFileSync(filePath, 'utf8');

  // 이미 권한 체크 코드가 있는지 확인
  if (content.includes('일반회원은 관리자 페이지에 접근할 수 없습니다')) {
    console.log(`⏭️  ${pageName}: 이미 권한 체크 코드 존재, 건너뜀`);
    return;
  }

  // 패턴 찾기: } else { } 부분을 권한 체크 코드로 교체
  const pattern =
    /(\s+apiUrl \+= `&customerId=\$\{customerId\}&username=\$\{username\}`;)\s+} else {\s+}/;

  if (pattern.test(content)) {
    content = content.replace(pattern, `$1\n${permissionCheckCode}`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 완료: ${pageName}/page.tsx`);
  } else {
    console.log(`❌ ${pageName}: 패턴을 찾을 수 없음`);
  }
});

console.log('\n🎉 모든 페이지 권한 체크 추가 완료!');
