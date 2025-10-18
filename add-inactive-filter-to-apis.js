const fs = require('fs');
const path = require('path');

const apis = [
  'slot-coupangvip',
  'slot-coupangapp',
  'slot-naver',
  'slot-place',
  'slot-todayhome',
  'slot-aliexpress',
  'slot-copangrank',
  'slot-naverrank',
  'slot-placerank',
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

  // 이미 inactive 필터가 있는지 확인
  if (content.includes(".neq('status', 'inactive')")) {
    console.log(`⏭️  ${apiName}: 이미 inactive 필터 존재, 건너뜀`);
    return;
  }

  // .order('created_at', { ascending: false }); 앞에 .neq('status', 'inactive') 추가
  const pattern = /(\s+)\.order\('created_at', \{ ascending: false \}\);/;

  if (pattern.test(content)) {
    content = content.replace(
      pattern,
      "$1.neq('status', 'inactive') // 중지된 슬롯 제외\n$1.order('created_at', { ascending: false });"
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 완료: ${apiName}/route.ts`);
  } else {
    console.log(`❌ ${apiName}: 패턴을 찾을 수 없음`);
  }
});

console.log('\n🎉 모든 API에 inactive 필터 추가 완료!');
