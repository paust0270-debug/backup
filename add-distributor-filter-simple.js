const fs = require('fs');
const path = require('path');

const apis = [
  'slot-coupangapp',
  'slot-naver',
  'slot-place',
  'slot-todayhome',
  'slot-aliexpress',
];

const basePath = path.join(__dirname, 'src', 'app', 'api');

apis.forEach(apiName => {
  const filePath = path.join(basePath, apiName, 'route.ts');

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  파일 없음: ${filePath}`);
    return;
  }

  console.log(`🔄 처리 중: ${apiName}/route.ts`);

  let content = fs.readFileSync(filePath, 'utf8');

  // 이미 distributor 파라미터가 있는지 확인
  if (content.includes("const distributor = searchParams.get('distributor')")) {
    console.log(`⏭️  ${apiName}: 이미 distributor 파라미터 존재, 건너뜀`);
    return;
  }

  // 1. searchParams에 distributor 추가
  content = content.replace(
    /(const skipSlotsTable = searchParams\.get\('skipSlotsTable'\);)/,
    "$1\n    const distributor = searchParams.get('distributor'); // 총판 필터링 (총판회원용)"
  );

  // 2. 개별 고객 필터링 뒤에 총판 필터링 추가 (다양한 패턴 대응)
  content = content.replace(
    /(}\s*\n\s*const \{ data: slotStatusData, error: slotStatusError \} =)/,
    `      
      // 총판 필터링 (관리자 페이지에서 총판회원이 조회하는 경우)
      if (distributor && !customerId && !username) {
        slotStatusQuery = slotStatusQuery.eq('distributor', distributor);
        console.log('🔍 총판 필터링:', { distributor });
      }
$1`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ 완료: ${apiName}/route.ts`);
});

console.log('\n🎉 나머지 API에 총판 필터링 추가 완료!');
