require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class FastCoupangChecker {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isRunning = false;
    
    console.log('⚡ 빠른 쿠팡 순위 체크 시스템 초기화');
  }

  // 빠른 브라우저 초기화
  async initBrowser() {
    try {
      console.log('🚀 빠른 브라우저 초기화 중...');
      
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
          '--start-maximized',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ]
      });

      this.page = await this.browser.newPage();
      
      // 빠른 로딩을 위한 설정
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // 불필요한 리소스 차단
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
          req.abort();
        } else {
          req.continue();
        }
      });

      console.log('✅ 빠른 브라우저 초기화 완료');
      return true;
      
    } catch (error) {
      console.error('❌ 브라우저 초기화 실패:', error);
      throw error;
    }
  }

  // 직접 검색 URL로 이동
  async searchDirectly(keyword) {
    try {
      console.log(`🔍 직접 검색: ${keyword}`);
      
      // 쿠팡 검색 URL로 직접 이동
      const searchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
      
      await this.page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // 페이지 로딩 대기
      await this.page.waitForTimeout(2000);
      
      console.log(`✅ 직접 검색 완료: ${keyword}`);
      return true;
      
    } catch (error) {
      console.error(`❌ 직접 검색 실패: ${keyword}`, error);
      throw error;
    }
  }

  // 상품 순위 확인
  async checkProductRank(productId) {
    try {
      console.log(`📦 상품 순위 확인: ${productId}`);
      
      // 상품 목록 로딩 대기
      await this.page.waitForTimeout(2000);
      
      // 상품 링크가 포함된 요소들 찾기
      const productLinks = await this.page.$$('a[href*="/products/"]');
      console.log(`📋 발견된 상품 링크 수: ${productLinks.length}`);
      
      let foundRank = null;
      
      for (let i = 0; i < productLinks.length; i++) {
        try {
          const href = await productLinks[i].evaluate(el => el.getAttribute('href'));
          
          if (href && href.includes(`/products/${productId}`)) {
            foundRank = i + 1; // 1부터 시작하는 순위
            console.log(`✅ 상품 발견: ${productId} - ${foundRank}위`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (foundRank) {
        console.log(`✅ 상품 순위 확인: ${productId} - ${foundRank}위`);
        return foundRank;
      } else {
        console.log(`⚠️ 상품을 찾을 수 없음: ${productId}`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ 순위 확인 실패: ${productId}`, error);
      return null;
    }
  }

  // 상품번호 추출
  extractProductId(linkUrl) {
    const match = linkUrl.match(/products\/(\d+)/);
    return match ? match[1] : null;
  }

  // 키워드 작업 가져오기
  async getKeywordsForRankCheck() {
    try {
      console.log('📋 키워드 작업 가져오기...');
      
      const { data: keywords, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('slot_type', 'coupang')
        .order('id', { ascending: true })
        .limit(1);
      
      if (error) {
        console.error('❌ keywords 조회 실패:', error);
        return null;
      }
      
      if (!keywords || keywords.length === 0) {
        console.log('📝 처리할 작업 없음');
        return null;
      }
      
      console.log(`✅ 키워드 작업 발견: ${keywords[0].keyword}`);
      return keywords[0];
      
    } catch (error) {
      console.error('❌ 키워드 작업 가져오기 실패:', error);
      return null;
    }
  }

  // slot_status 테이블 업데이트
  async updateSlotStatus(keyword, rank) {
    try {
      console.log(`📊 slot_status 업데이트: ${keyword.keyword} - ${rank}위`);
      
      // 기존 start_rank 확인
      const { data: existingSlotStatus, error: fetchError } = await supabase
        .from('slot_status')
        .select('start_rank')
        .eq('keyword', keyword.keyword)
        .eq('link_url', keyword.link_url)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ slot_status 조회 실패:', fetchError);
        throw fetchError;
      }
      
      const updatePayload = {
        current_rank: rank,
        last_check_date: new Date().toISOString()
      };
      
      // start_rank가 없으면 현재 순위를 시작 순위로 설정
      if (!existingSlotStatus || existingSlotStatus.start_rank === null) {
        updatePayload.start_rank = rank;
        console.log(`🆕 시작 순위 설정: ${rank}위`);
      }
      
      const { error: updateError } = await supabase
        .from('slot_status')
        .update(updatePayload)
        .eq('keyword', keyword.keyword)
        .eq('link_url', keyword.link_url);
      
      if (updateError) {
        console.error('❌ slot_status 업데이트 실패:', updateError);
        throw updateError;
      }
      
      console.log(`✅ slot_status 업데이트 완료: ${keyword.keyword}`);
      return updatePayload;
      
    } catch (error) {
      console.error('❌ slot_status 업데이트 오류:', error);
      throw error;
    }
  }

  // rank_history 테이블에 순위 기록 저장
  async saveRankHistory(keyword, rank, startRank) {
    try {
      console.log(`📝 rank_history 저장: ${keyword.keyword} - ${rank}위`);
      
      // slot_status 테이블에서 해당 레코드 ID 찾기
      const { data: slotStatus, error: findError } = await supabase
        .from('slot_status')
        .select('id')
        .eq('keyword', keyword.keyword)
        .eq('link_url', keyword.link_url)
        .single();
      
      if (findError || !slotStatus) {
        console.log(`⚠️ slot_status 레코드를 찾을 수 없음: ${keyword.keyword}`);
        return;
      }
      
      // rank_history 테이블에 저장
      const { error } = await supabase
        .from('rank_history')
        .insert({
          slot_status_id: slotStatus.id,
          keyword: keyword.keyword,
          link_url: keyword.link_url,
          current_rank: rank,
          start_rank: startRank,
          check_date: new Date().toISOString()
        });
      
      if (error) {
        console.error('❌ rank_history 저장 실패:', error);
      } else {
        console.log(`✅ rank_history 저장 완료: ${keyword.keyword}`);
      }
    } catch (error) {
      console.error('❌ rank_history 저장 오류:', error);
    }
  }

  // 단일 키워드 처리
  async processKeyword(keyword) {
    try {
      console.log(`\n🔍 키워드 처리 시작: ${keyword.keyword}`);
      
      // 상품번호 추출
      const productId = this.extractProductId(keyword.link_url);
      if (!productId) {
        console.log(`❌ 상품번호 추출 실패: ${keyword.link_url}`);
        return { success: false, error: '상품번호 추출 실패' };
      }
      
      // 직접 검색 URL로 이동
      await this.searchDirectly(keyword.keyword);
      
      // 순위 확인
      const rank = await this.checkProductRank(productId);
      
      if (rank) {
        // slot_status 테이블 업데이트
        const updateResult = await this.updateSlotStatus(keyword, rank);
        
        // rank_history 테이블에 저장
        await this.saveRankHistory(keyword, rank, updateResult.start_rank);
        
        // keywords 테이블에서 삭제
        await supabase
          .from('keywords')
          .delete()
          .eq('id', keyword.id);
        
        console.log(`✅ 키워드 처리 완료: ${keyword.keyword} - ${rank}위`);
        
        return {
          success: true,
          keyword: keyword.keyword,
          rank: rank,
          start_rank: updateResult.start_rank,
          timestamp: new Date().toISOString()
        };
      } else {
        console.log(`⚠️ 순위 확인 실패: ${keyword.keyword}`);
        return { success: false, error: '순위 확인 실패' };
      }
      
    } catch (error) {
      console.error(`❌ 키워드 처리 실패: ${keyword.keyword}`, error);
      return { success: false, error: error.message };
    }
  }

  // 메인 순위 체크 실행
  async runRankCheck() {
    if (this.isRunning) {
      console.log('⚠️ 이미 실행 중입니다');
      return;
    }

    this.isRunning = true;

    try {
      console.log('⚡ 빠른 쿠팡 순위 체크 시작...');
      
      // 브라우저 초기화
      await this.initBrowser();
      
      // 무한 루프로 작업 처리
      while (this.isRunning) {
        try {
          console.log(`\n[${new Date().toLocaleString()}] 작업 가져오기...`);
          
          // 키워드 작업 가져오기
          const keyword = await this.getKeywordsForRankCheck();
          
          if (keyword) {
            // 키워드 처리
            const result = await this.processKeyword(keyword);
            console.log('📊 처리 결과:', result);
            
            // 처리 간격 (3초로 단축)
            console.log('⏳ 3초 대기 중...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
          } else {
            // 작업이 없으면 10초 대기
            console.log('⏳ 10초 후 다음 시작...');
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
          
        } catch (error) {
          console.error('❌ 작업 처리 중 오류:', error);
          console.log('⏳ 5초 후 재시도...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
    } catch (error) {
      console.error('❌ 순위 체크 시스템 오류:', error);
      throw error;
    } finally {
      this.isRunning = false;
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  // 시스템 중지
  async stop() {
    console.log('🛑 순위 체크 시스템 중지...');
    this.isRunning = false;
    
    if (this.browser) {
      await this.browser.close();
    }
  }

  // 정리 작업
  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
      }
      console.log('🧹 정리 작업 완료');
    } catch (error) {
      console.error('❌ 정리 작업 실패:', error);
    }
  }
}

// 실행 함수
async function main() {
  const rankChecker = new FastCoupangChecker();
  
  // Ctrl+C 처리
  process.on('SIGINT', async () => {
    console.log('\n🛑 시스템 종료 중...');
    await rankChecker.stop();
    process.exit(0);
  });
  
  try {
    await rankChecker.runRankCheck();
  } catch (error) {
    console.error('❌ 시스템 실행 실패:', error);
  } finally {
    await rankChecker.cleanup();
  }
}

// 직접 실행
if (require.main === module) {
  main();
}

module.exports = FastCoupangChecker;














