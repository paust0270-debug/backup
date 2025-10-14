const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class SupabaseClient {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  // keywords 테이블에서 모든 대기 작업 조회 (id 오름차순)
  async getAllPendingTasks() {
    const { data, error } = await this.supabase
      .from('keywords')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('작업 목록 조회 오류:', error);
      throw error;
    }
    return data || [];
  }

  // 특정 플랫폼의 작업 조회
  async getTasksByPlatform(platform) {
    const { data, error } = await this.supabase
      .from('keywords')
      .select('*')
      .eq('slot_type', platform)
      .order('id', { ascending: true });

    if (error) {
      console.error(`${platform} 작업 조회 오류:`, error);
      throw error;
    }
    return data || [];
  }

  // slot_status 테이블에 순위 상태 저장/업데이트 + slot_rank_history 히스토리 저장
  async saveRankStatus(keyword, url, slotType, productId, currentRank, startRank) {
    // 기존 기록이 있는지 확인 (keyword + link_url + slot_type로 조회)
    const { data: existing } = await this.supabase
      .from('slot_status')
      .select('*')
      .eq('keyword', keyword)
      .eq('link_url', url)
      .eq('slot_type', slotType)
      .single();

    if (existing) {
      // 기존 기록 업데이트 (current_rank만 갱신)
      const { data, error } = await this.supabase
        .from('slot_status')
        .update({
          current_rank: currentRank,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error('순위 업데이트 오류:', error);
        throw error;
      }
      console.log(`✅ 순위 업데이트: ${keyword} - ${currentRank}위`);

      // slot_rank_history 테이블에 히스토리 저장
      try {
        const { error: historyError } = await this.supabase
          .from('slot_rank_history')
          .insert({
            slot_status_id: existing.id,
            keyword: keyword,
            link_url: url,
            current_rank: currentRank,
            start_rank: existing.start_rank,
            created_at: new Date().toISOString()
          });

        if (historyError) {
          console.error('❌ 히스토리 저장 오류:', historyError);
          console.error('❌ 오류 상세:', {
            message: historyError.message,
            details: historyError.details,
            hint: historyError.hint,
            code: historyError.code
          });
        } else {
          console.log(`✅ 히스토리 저장 완료: ${keyword} - ${currentRank}위`);
        }
      } catch (historyException) {
        console.error('❌ 히스토리 저장 예외:', historyException);
      }

      return data;
    } else {
      // 새로운 기록 생성 (start_rank는 처음만 기록)
      const { data, error } = await this.supabase
        .from('slot_status')
        .insert({
          keyword: keyword,
          link_url: url,
          slot_type: slotType,
          // 필수 필드들만 추가 (실제 테이블에 존재하는 필드만)
          customer_id: 'rank-checker-system', // 순위 체킹 시스템용 고정 ID
          customer_name: '순위체킹시스템', // 고정 고객명
          slot_count: 1, // 기본값
          current_rank: currentRank,
          start_rank: startRank,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('순위 저장 오류:', error);
        throw error;
      }
      console.log(`✅ 순위 신규 생성: ${keyword} - ${currentRank}위 (시작순위: ${startRank}위)`);

      // slot_rank_history 테이블에 첫 히스토리 저장
      try {
        const { error: historyError } = await this.supabase
          .from('slot_rank_history')
          .insert({
            slot_status_id: data.id,
            keyword: keyword,
            link_url: url,
            current_rank: currentRank,
            start_rank: startRank,
            created_at: new Date().toISOString()
          });

        if (historyError) {
          console.error('❌ 첫 히스토리 저장 오류:', historyError);
          console.error('❌ 오류 상세:', {
            message: historyError.message,
            details: historyError.details,
            hint: historyError.hint,
            code: historyError.code
          });
        } else {
          console.log(`✅ 첫 히스토리 저장 완료: ${keyword} - ${currentRank}위 (시작순위: ${startRank}위)`);
        }
      } catch (historyException) {
        console.error('❌ 첫 히스토리 저장 예외:', historyException);
      }

      return data;
    }
  }

  // 처리 완료된 키워드 삭제
  async deleteProcessedKeyword(keywordId) {
    const { error } = await this.supabase
      .from('keywords')
      .delete()
      .eq('id', keywordId);

    if (error) {
      console.error('키워드 삭제 오류:', error);
      throw error;
    }
    console.log(`🗑️ 키워드 ID ${keywordId} 삭제 완료`);
  }

  // 순위 이력 조회 (디버깅용)
  async getRankHistory(keyword, url, slotType, productId) {
    const { data, error } = await this.supabase
      .from('slot_status')
      .select('*')
      .eq('keyword', keyword)
      .eq('url', url)
      .eq('slot_type', slotType)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('순위 이력 조회 오류:', error);
      throw error;
    }
    return data || [];
  }

  // 플랫폼별 통계 조회
  async getPlatformStats(slotType) {
    const { data, error } = await this.supabase
      .from('slot_status')
      .select('current_rank, start_rank, created_at')
      .eq('slot_type', slotType);

    if (error) {
      console.error(`${slotType} 통계 조회 오류:`, error);
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        totalChecks: 0,
        avgRank: 0,
        bestRank: 0,
        worstRank: 0
      };
    }

    const ranks = data.map(item => item.current_rank).filter(rank => rank !== null);
    const startRanks = data.map(item => item.start_rank).filter(rank => rank !== null);

    return {
      totalChecks: data.length,
      avgRank: ranks.length > 0 ? Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length) : 0,
      bestRank: ranks.length > 0 ? Math.min(...ranks) : 0,
      worstRank: ranks.length > 0 ? Math.max(...ranks) : 0,
      avgStartRank: startRanks.length > 0 ? Math.round(startRanks.reduce((a, b) => a + b, 0) / startRanks.length) : 0
    };
  }
}

module.exports = SupabaseClient;

