const fs = require('fs');
const path = require('path');

// 수정할 API 파일 목록
const apiFiles = [
  'src/app/api/slot-status/route.ts',
  'src/app/api/slot-coupangapp/route.ts',
  'src/app/api/slot-naver/route.ts',
  'src/app/api/slot-place/route.ts',
  'src/app/api/slot-todayhome/route.ts',
  'src/app/api/slot-aliexpress/route.ts',
  'src/app/api/slot-copangrank/route.ts',
  'src/app/api/slot-naverrank/route.ts',
  'src/app/api/slot-placerank/route.ts',
];

// 추가할 필터링 로직
const filterLogic = `
      // ✅ 추가: slots 테이블에서 inactive 상태 확인하여 추가 필터링
      if (slotStatusData && slotStatusData.length > 0) {
        try {
          // slot_sequence 목록 추출
          const slotSequences = [
            ...new Set(slotStatusData.map(slot => slot.slot_sequence)),
          ];

          // slots 테이블에서 상태 조회
          const { data: slotsStatusData } = await supabase
            .from('slots')
            .select('id, status')
            .in('id', slotSequences);

          // inactive 슬롯 ID 목록 생성
          const inactiveSlotIds = new Set(
            slotsStatusData
              ?.filter(slot => slot.status === 'inactive')
              .map(slot => slot.id) || []
          );

          console.log('🔍 slots 테이블에서 inactive 슬롯:', Array.from(inactiveSlotIds));

          // 슬롯 데이터에서 inactive 슬롯 제외
          const originalCount = slotStatusData.length;
          slotStatusData = slotStatusData.filter(
            slot => !inactiveSlotIds.has(slot.slot_sequence)
          );

          console.log(
            \`✅ slots.status 기반 필터링 완료: \${originalCount}개 → \${slotStatusData.length}개 (\${originalCount - slotStatusData.length}개 제외)\`
          );
        } catch (err) {
          console.log('⚠️ slots 상태 확인 중 오류 (무시):', err);
          // 오류 발생 시 원본 데이터 사용
        }
      }
`;

console.log('🔧 모든 슬롯 API에 inactive 필터링 로직 적용 시작...\n');

apiFiles.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ 파일 없음: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // 이미 필터링 로직이 있는지 확인
    if (content.includes('slots 테이블에서 inactive 상태 확인')) {
      console.log(`✅ 이미 적용됨: ${filePath}`);
      return;
    }

    // 패턴 1: const { data: slotStatusData, error: slotStatusError } 직후에 추가
    const pattern1 =
      /(const\s+{\s*data:\s*slotStatusData,\s*error:\s*slotStatusError\s*}\s*=\s*await\s+slotStatusQuery;)/;

    if (pattern1.test(content)) {
      content = content.replace(
        pattern1,
        `let { data: slotStatusData, error: slotStatusError } =
        await slotStatusQuery;
${filterLogic}`
      );

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ 수정 완료: ${filePath}`);
    } else {
      console.log(`⚠️ 패턴 매칭 실패: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ 오류 발생 (${filePath}):`, error.message);
  }
});

console.log('\n✅ 모든 작업 완료!');
