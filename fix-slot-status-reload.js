const fs = require('fs');
const path = require('path');

// 수정할 페이지 파일 목록
const pageFiles = [
  'src/app/coupangapp/vip/page.tsx',
  'src/app/coupangapp/app/page.tsx',
  'src/app/coupangapp/naver/page.tsx',
  'src/app/coupangapp/place/page.tsx',
  'src/app/coupangapp/todayhome/page.tsx',
  'src/app/coupangapp/aliexpress/page.tsx',
  'src/app/coupangapp/copangrank/page.tsx',
  'src/app/coupangapp/naverrank/page.tsx',
  'src/app/coupangapp/placerank/page.tsx',
];

console.log('🔧 모든 슬롯 페이지에 슬롯 현황 재로드 로직 적용 시작...\n');

pageFiles.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ 파일 없음: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // 이미 수정되었는지 확인
    if (content.includes('개별 페이지인 경우 슬롯 현황 다시 로드')) {
      console.log(`✅ 이미 적용됨: ${filePath}`);
      return;
    }

    // 패턴 1: 개별 삭제 (handleDeleteCustomer) 수정
    const pattern1 =
      /(\/\/ 로컬 상태만 업데이트[\s\S]*?setCustomers\(prev => prev\.filter\(customer => customer\.id !== id\)\);[\s\S]*?\/\/ 슬롯 현황 업데이트[\s\S]*?}\);)([\s\S]*?\/\/ 작업등록 상태 재확인)/;

    if (pattern1.test(content)) {
      content = content.replace(
        pattern1,
        `$1

        // 개별 페이지인 경우 슬롯 현황 다시 로드
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('username');
        if (username) {
          loadCustomerSlotStatus(username);
        }
$2`
      );
      console.log(`  ✅ 개별 삭제 로직 수정: ${filePath}`);
    }

    // 패턴 2: 전체 삭제 (handleBulkDelete) 수정
    const pattern2 =
      /(setSelectedCustomers\(new Set\(\)\);[\s\S]*?setSelectAll\(false\);)([\s\S]*?\/\/ 작업등록 상태 재확인)/;

    if (pattern2.test(content)) {
      content = content.replace(
        pattern2,
        `$1

      // 개별 페이지인 경우 슬롯 현황 다시 로드
      const urlParams = new URLSearchParams(window.location.search);
      const username = urlParams.get('username');
      if (username) {
        loadCustomerSlotStatus(username);
      }
$2`
      );
      console.log(`  ✅ 전체 삭제 로직 수정: ${filePath}`);
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 수정 완료: ${filePath}\n`);
  } catch (error) {
    console.error(`❌ 오류 발생 (${filePath}):`, error.message);
  }
});

console.log('✅ 모든 작업 완료!');
