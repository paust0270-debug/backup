const fs = require('fs');
const path = require('path');

const pages = [
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

pages.forEach(pageName => {
  const filePath = path.join(basePath, pageName, 'page.tsx');

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  파일 없음: ${filePath}`);
    return;
  }

  console.log(`🔄 처리 중: ${pageName}/page.tsx`);

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. CustomerSlot 인터페이스에 distributor 필드 추가
  content = content.replace(
    /(interface CustomerSlot \{[^}]*workGroup: string;)/,
    '$1\n  distributor?: string; // 소속총판'
  );

  // 2. 데이터 변환 시 distributor 필드 추가
  content = content.replace(
    /(workGroup: item\.work_group \|\| '공통',)/g,
    "$1\n            distributor: item.distributor || '-', // 소속총판 추가"
  );

  // 3. 화면 표시 부분 수정 (customer.workGroup -> customer.distributor)
  content = content.replace(
    /\{customer\.workGroup\}/g,
    "{customer.distributor || '-'}"
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ 완료: ${pageName}/page.tsx`);
});

console.log('\n🎉 모든 페이지 업데이트 완료!');
