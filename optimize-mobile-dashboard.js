const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 모든 서비스 링크 카드를 모바일 최적화
const patterns = [
  {
    // N쇼핑순위체크, N플레이스순위체크 등 나머지 무료 서비스
    old: /className="flex justify-between items-center p-4 bg-white rounded-lg hover:bg-(\w+)-50/g,
    new: 'className="flex justify-between items-center p-3 sm:p-4 bg-white rounded-lg hover:bg-$1-50 min-h-[56px]',
  },
  {
    // gap-3을 gap-2 sm:gap-3으로
    old: /(<div className="flex items-center )gap-3">/g,
    new: '$1gap-2 sm:gap-3">',
  },
  {
    // w-8 h-8을 w-7 h-7 sm:w-8 sm:h-8로
    old: /(<div className="w-)8 h-8 bg-gradient/g,
    new: '$17 h-7 sm:w-8 sm:h-8 bg-gradient',
  },
  {
    // 아이콘 텍스트 크기
    old: /(span className="text-white )text-sm( font-bold">)/g,
    new: '$1text-xs sm:text-sm$2',
  },
  {
    // 서비스 이름 텍스트 크기
    old: /(span className="text-gray-800 font-medium group-hover:text-\w+-700)(">\s*[^<]+<\/span>)/g,
    new: '$1 text-sm sm:text-base$2',
  },
  {
    // 이동 버튼 크기
    old: /(span className="px-)4( py-1\.5 )/g,
    new: '$13 py-1.5 sm:px-4 ',
  },
  {
    // 이동 버튼 텍스트 크기
    old: /(bg-gradient-to-br from-\w+-\d+ to-\w+-\d+ text-\w+-\d+ rounded-lg )text-sm( font-medium)/g,
    new: '$1text-xs sm:text-sm$2',
  },
  {
    // flex-shrink-0 추가
    old: /(이동 →<\/span>)/g,
    new: '$1',
  },
];

// 빠른 액션 섹션 최적화
content = content.replace(
  /className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">\s*{\/\* 빠른 액션 \*\/}/,
  'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">\n        {/* 빠른 액션 */}'
);

// 빠른 액션 카드 패딩
content = content.replace(
  /className="group relative bg-gradient-to-br from-(\w+)-50 to-(\w+)-100 rounded-2xl shadow-lg p-6 hover:shadow-2xl/g,
  'className="group relative bg-gradient-to-br from-$1-50 to-$2-100 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 hover:shadow-2xl'
);

// 빠른 액션 아이콘 크기
content = content.replace(
  /<div className="w-14 h-14 bg-gradient-to-br/g,
  '<div className="w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 bg-gradient-to-br'
);

// 빠른 액션 제목 크기
content = content.replace(
  /<h3 className="text-xl font-bold text-gray-900 mb-2">/g,
  '<h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">'
);

// 빠른 액션 설명 크기
content = content.replace(
  /<p className="text-gray-600 text-sm mb-4">/g,
  '<p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">'
);

// 빠른 액션 버튼 크기
content = content.replace(
  /<div className="inline-flex items-center px-4 py-2 bg-(\w+)-600/g,
  '<div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-$1-600'
);

// 작업 관리 섹션 최적화
content = content.replace(
  /className="mb-12">\s*<div className="flex items-center mb-6">/,
  'className="mb-6 sm:mb-8 lg:mb-12">\n            <div className="flex items-center mb-4 sm:mb-5 lg:mb-6">'
);

// 작업 관리 그리드
content = content.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 gap-6">/g,
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">'
);

// 주요 지표 그리드
content = content.replace(
  /<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">/,
  '<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">'
);

// 주요 지표 카드 패딩
content = content.replace(
  /className="group relative bg-gradient-to-br from-(\w+)-50 to-(\w+)-100 rounded-xl shadow-md p-6 text-center/g,
  'className="group relative bg-gradient-to-br from-$1-50 to-$2-100 rounded-lg sm:rounded-xl shadow-md p-4 sm:p-5 lg:p-6 text-center'
);

// 주요 지표 숫자 크기
content = content.replace(
  /<div className="text-4xl font-black text-(\w+)-600 mb-2/g,
  '<div className="text-2xl sm:text-3xl lg:text-4xl font-black text-$1-600 mb-1 sm:mb-2'
);

// 주요 지표 라벨 크기
content = content.replace(
  /<div className="text-gray-700 font-medium">([^<]+)<\/div>/g,
  '<div className="text-gray-700 font-medium text-xs sm:text-sm">$1</div>'
);

// 최신 공지사항 패딩
content = content.replace(
  /className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-lg p-8 mb-12/,
  'className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-12'
);

// 최신 공지사항 제목
content = content.replace(
  /<h3 className="text-2xl font-bold text-gray-900">최신 공지사항<\/h3>/,
  '<h3 className="text-xl sm:text-2xl font-bold text-gray-900">최신 공지사항</h3>'
);

// 최신 공지사항 내용
content = content.replace(
  /<p className="text-gray-800 text-lg leading-relaxed">/,
  '<p className="text-gray-800 text-sm sm:text-base lg:text-lg leading-relaxed">'
);

// 최신 공지사항 버튼
content = content.replace(
  /<Link href="\/notices" className="inline-flex items-center px-6 py-3 bg-gradient/,
  '<Link href="/notices" className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 text-sm sm:text-base bg-gradient'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 대시보드 모바일 최적화 완료!');
