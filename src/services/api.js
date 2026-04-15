/**
 * API Bridge v3
 * - Pexels API 연동 (키워드 기반 이미지 검색)
 * - YouTube 썸네일 우선 로직 (재생목록 모드)
 * - 캐싱 시스템 연동 (동일 키워드 재요청 방지)
 * - 오프라인 fallback (내장 이미지 104장)
 * - API 사용량 추적
 */

import { getFromCache, saveToCache } from './cache.js';
import { getFallbackImages } from './fallbackImages.js';
import { recordApiCall } from './apiUsage.js';

const isElectron = typeof window !== 'undefined' && window.louverAPI?.isElectron;

// ─── Mood → 검색 쿼리 매핑 ──────────────────────────────────

const MOOD_SEARCH_QUERIES = {
  calm:      ['calm ocean', 'peaceful sky', 'serene lake'],
  energetic: ['neon lights city', 'concert stage', 'colorful abstract'],
  emotional: ['rainy night city', 'moody sky dark', 'starry night'],
  cozy:      ['coffee shop warm', 'autumn cozy', 'warm interior'],
  dark:      ['night city skyline', 'neon urban dark', 'dark aesthetic'],
  nature:    ['forest sunlight', 'mountain landscape', 'ocean beach'],
  romantic:  ['sunset golden', 'pink flowers', 'cherry blossom'],
  classical: ['grand piano elegant', 'concert hall', 'elegant architecture'],
};

// ─── Pexels API ──────────────────────────────────────────────
// Electron: 메인 프로세스 프록시 (CORS 없음)
// 브라우저: 직접 fetch (개발용)

async function searchPexels(query, apiKey, count = 6) {
  console.log(`[Pexels] 검색: "${query}" (${count}개)`);

  if (isElectron) {
    // 메인 프로세스에서 API 호출 (CORS 완전 우회)
    const result = await window.louverAPI.pexelsSearch({ query, apiKey, count });
    if (!result.success) throw new Error(result.error);
    console.log(`[Pexels] ✓ ${result.data.length}개 반환 (IPC 프록시)`);
    return result.data;
  }

  // 브라우저 fallback (개발용)
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&size=large`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Pexels API 키가 유효하지 않습니다.');
    if (res.status === 429) throw new Error('Pexels API 요청 한도 초과.');
    throw new Error(`Pexels API 오류: HTTP ${res.status}`);
  }
  const data = await res.json();
  return (data.photos || []).map((p) => p.src.landscape);
}

export async function testPexelsApiKey(apiKey) {
  if (!apiKey?.trim()) return { valid: false, error: 'API 키를 입력해주세요.' };

  if (isElectron) {
    const result = await window.louverAPI.pexelsTestKey(apiKey.trim());
    if (!result.success) return { valid: false, error: result.error };
    return result.valid ? { valid: true } : { valid: false, error: result.error || '유효하지 않음' };
  }

  try {
    const res = await fetch('https://api.pexels.com/v1/search?query=test&per_page=1', {
      headers: { Authorization: apiKey.trim() },
    });
    if (res.ok) return { valid: true };
    if (res.status === 401) return { valid: false, error: 'API 키가 유효하지 않습니다.' };
    return { valid: false, error: `HTTP ${res.status}` };
  } catch (err) {
    return { valid: false, error: `연결 실패: ${err.message}` };
  }
}

// ─── Picsum 실사 이미지 ID (무드별, API 키 불필요) ──────────

const PICSUM_IDS = {
  calm:      [10, 15, 20, 54, 106, 164, 173, 319, 396, 491, 533, 598, 651],
  energetic: [96, 250, 305, 399, 452, 593, 669, 698, 804, 688, 528, 572, 637],
  emotional: [1, 65, 110, 119, 135, 244, 407, 493, 517, 658, 600, 671, 718],
  cozy:      [29, 30, 225, 312, 425, 431, 436, 511, 574, 755, 524, 566, 609],
  dark:      [42, 90, 142, 155, 370, 501, 547, 590, 638, 724, 556, 614, 683],
  nature:    [10, 15, 16, 28, 29, 100, 180, 353, 401, 433, 509, 551, 615],
  romantic:  [82, 102, 119, 176, 326, 374, 449, 486, 579, 646, 530, 570, 623],
  classical: [24, 36, 48, 342, 366, 395, 421, 453, 532, 620, 548, 585, 640],
};

// ─── 이미지 소싱 (키워드 모드) ───────────────────────────────
// 우선순위: 캐시 → Pexels API → picsum 실사 → 오프라인 fallback

export async function getImageUrlsForKeyword(keyword, mood, count = 6, apiKey = '') {
  // 1) 캐시 확인
  const cached = getFromCache(keyword, mood, 'pexels');
  if (cached) {
    return { urls: cached.urls.slice(0, count), source: 'cache' };
  }

  // 2) Pexels API (키가 있을 때)
  if (apiKey?.trim()) {
    try {
      const queries = MOOD_SEARCH_QUERIES[mood] || MOOD_SEARCH_QUERIES.calm;
      const query = `${keyword} ${queries[0]}`;
      const urls = await searchPexels(query, apiKey.trim(), count);

      if (urls.length > 0) {
        saveToCache(keyword, mood, urls, 'pexels');
        recordApiCall('pexels', 1);
        return { urls, source: 'pexels' };
      }
    } catch (err) {
      console.warn(`[API] Pexels 실패: ${err.message}`);
    }
  }

  // 3) Picsum 실사 이미지 (API 키 불필요, 네트워크만 있으면 됨)
  //    Electron: main process proxy로 가져옴 (CORS 없음)
  //    브라우저: fetch+blob으로 가져옴
  console.log('[API] → Picsum 실사 이미지 사용 (API 키 불필요)');
  const ids = PICSUM_IDS[mood] || PICSUM_IDS.calm;
  const urls = [];
  for (let i = 0; i < count; i++) {
    urls.push(`https://picsum.photos/id/${ids[i % ids.length]}/1280/720`);
  }
  recordApiCall('picsum', 1);
  return { urls, source: 'picsum' };

  // 참고: 네트워크 없으면 thumbnailComposer의 loadImage()가 실패 →
  //        자동으로 그라데이션 fallback 적용됨
}

// ─── 이미지 소싱 (재생목록 모드) ─────────────────────────────
// YouTube 썸네일을 최우선 사용

export function getImageUrlsFromPlaylist(playlistData, count = 6) {
  const items = playlistData?.items || [];
  if (items.length === 0) {
    console.warn('[API] 플레이리스트 항목 없음 → fallback');
    return { urls: getFallbackImages('calm', count), source: 'offline-fallback' };
  }

  // YouTube 썸네일 우선 추출
  const urls = [];
  for (let i = 0; i < count; i++) {
    const item = items[i % items.length];
    if (item.videoId) {
      urls.push(`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`);
    } else if (item.thumbnailUrl) {
      urls.push(item.thumbnailUrl);
    }
  }

  if (urls.length > 0) {
    recordApiCall('youtube', 1);
    console.log(`[API] YouTube 썸네일 ${urls.length}개 (Pexels보다 우선 사용)`);
    return { urls, source: 'youtube' };
  }

  return { urls: getFallbackImages('calm', count), source: 'offline-fallback' };
}

// ─── Mock Data ──────────────────────────────────────────────

const MOCK_VIDEO_IDS = [
  'dQw4w9WgXcQ', 'kJQP7kiw5Fk', 'JGwWNGJdvx8', 'RgKAFK5djSk',
  'fJ9rUzIMcZQ', '09R8_2nJtjg', 'YQHsXMglC9A', 'OPf0YbXqDm0',
];

const MOCK_PLAYLIST = {
  playlistId: 'PLmock123',
  title: '새벽 감성 팝 플레이리스트',
  description: '새벽에 듣기 좋은 감성 팝 모음',
  channelName: 'Louver Music',
  videoCount: '8',
  items: MOCK_VIDEO_IDS.map((id, i) => ({
    videoId: id,
    title: ['Midnight City', 'Blinding Lights', 'After Hours', 'Levitating', 'Stay', 'Heat Waves', 'Watermelon Sugar', 'Peaches'][i],
    artist: ['M83', 'The Weeknd', 'The Weeknd', 'Dua Lipa', 'The Kid LAROI', 'Glass Animals', 'Harry Styles', 'Justin Bieber'][i],
    duration: '3:30',
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  })),
  url: 'https://www.youtube.com/playlist?list=PLmock123',
};

const MOCK_THUMBNAILS = {
  all: MOCK_PLAYLIST.items.map((item) => ({ videoId: item.videoId, title: item.title, artist: item.artist, thumbnailUrl: item.thumbnailUrl })),
  representatives: [
    { ...MOCK_PLAYLIST.items[0], reason: '재생목록 첫 번째 트랙' },
    { ...MOCK_PLAYLIST.items[3], reason: '재생목록 중간 트랙' },
    { ...MOCK_PLAYLIST.items[7], reason: '재생목록 마지막 트랙' },
  ],
  totalCount: MOCK_PLAYLIST.items.length,
};

// ─── Mood Analysis ──────────────────────────────────────────

const MOOD_KEYWORDS = {
  calm: ['잔잔', '편안', '힐링', 'calm', 'relax', 'peaceful', 'chill', 'soft', 'quiet', 'sleep', 'ambient'],
  energetic: ['신나는', '에너지', 'energy', 'upbeat', 'party', 'dance', 'EDM', 'hype', 'workout', 'power'],
  emotional: ['감성', '새벽', '밤', 'night', 'emotional', 'sad', 'melancholy', '이별', 'nostalgic', 'sentimental'],
  cozy: ['카페', 'cafe', 'coffee', '따뜻', 'warm', 'cozy', '아늑', '봄', 'acoustic', '포근'],
  dark: ['어두운', 'dark', '야경', '도시', 'city', 'urban', 'night drive', '드라이브', 'neon', 'lo-fi', 'lofi'],
  nature: ['자연', 'nature', '숲', 'forest', '바다', 'ocean', '비', 'rain', 'water', '여름', '가을'],
  romantic: ['로맨틱', 'romantic', 'love', '사랑', '연인', '데이트', 'sweet', '달달'],
  classical: ['클래식', 'classical', 'piano', '피아노', 'orchestra', 'violin', 'sonata'],
};

const MOOD_LABELS = {
  calm: '잔잔한 / 편안한', energetic: '에너지틱 / 신나는',
  emotional: '감성적 / 새벽 감성', cozy: '아늑한 / 카페 감성',
  dark: '다크 / 도시적', nature: '자연 / 힐링',
  romantic: '로맨틱 / 사랑', classical: '클래식 / 우아한',
};

const MOOD_COLORS = {
  calm: ['#E0F2FE', '#BAE6FD', '#7DD3FC', '#93C5FD', '#C7D2FE'],
  energetic: ['#FEF3C7', '#FDE68A', '#FCD34D', '#FB923C', '#F97316'],
  emotional: ['#EDE9FE', '#C4B5FD', '#A78BFA', '#818CF8', '#6366F1'],
  cozy: ['#FEF3C7', '#FDE68A', '#D4A574', '#C4956A', '#B8860B'],
  dark: ['#1E1B4B', '#312E81', '#3730A3', '#4338CA', '#4F46E5'],
  nature: ['#D1FAE5', '#6EE7B7', '#34D399', '#10B981', '#059669'],
  romantic: ['#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6', '#EC4899'],
  classical: ['#F5F0E8', '#E8DCC8', '#D4C4A8', '#C0AD88', '#A89668'],
};

const MOOD_GRADIENTS = {
  calm: ['#E0F7FA', '#B2EBF2'], energetic: ['#FF6B6B', '#FFE66D'],
  emotional: ['#667EEA', '#764BA2'], cozy: ['#F6D365', '#FDA085'],
  dark: ['#0F0C29', '#302B63'], nature: ['#56AB2F', '#A8E063'],
  romantic: ['#FF9A9E', '#FAD0C4'], classical: ['#F5F0E8', '#D4C4A8'],
};

function analyzeMoodFromText(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    scores[mood] = 0;
    for (const kw of keywords) { if (lower.includes(kw)) scores[mood]++; }
  }
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a).filter(([, s]) => s > 0);
  const primaryMood = sorted.length > 0 ? sorted[0][0] : 'calm';
  return {
    primaryMood,
    moodLabel: MOOD_LABELS[primaryMood],
    allMoods: (sorted.length > 0 ? sorted : [['calm', 1]]).slice(0, 3).map(([m, s]) => ({ mood: m, score: s, label: MOOD_LABELS[m] })),
    suggestedColors: MOOD_COLORS[primaryMood],
    suggestedGradient: MOOD_GRADIENTS[primaryMood],
    fontStyle: 'medium',
    extractedKeywords: lower.split(/\s+/).filter((w) => w.length > 1).slice(0, 10),
  };
}

// ─── API Functions ──────────────────────────────────────────

export async function parsePlaylist(url) {
  if (isElectron) return window.louverAPI.parsePlaylist(url);
  await new Promise((r) => setTimeout(r, 1200));
  return { success: true, data: MOCK_PLAYLIST };
}

export async function collectThumbnails(playlistData) {
  if (isElectron) return window.louverAPI.collectThumbnails(playlistData);
  await new Promise((r) => setTimeout(r, 800));
  return { success: true, data: MOCK_THUMBNAILS };
}

export async function analyzeMood(data) {
  if (isElectron) return window.louverAPI.analyzeMood(data);
  await new Promise((r) => setTimeout(r, 400));
  const text = [data.playlistData?.title || '', data.playlistData?.description || '', ...(data.playlistData?.items || []).map((i) => i.title)].join(' ');
  return { success: true, data: { ...analyzeMoodFromText(text), playlistTitle: data.playlistData?.title, trackCount: (data.playlistData?.items || []).length } };
}

export async function scoreThumbnail(config) {
  if (isElectron) return window.louverAPI.scoreThumbnail(config);
  let score = 50;
  if (config.hasImage) score += 12;
  if (config.hasGradient) score += 3;
  if (config.fontSize >= 48) score += 8;
  if (config.textLength <= 15) score += 8;
  if (config.hasTextShadow) score += 4;
  if (config.moodMatch === 'high') score += 8;
  if (config.aspectRatio === '16:9') score += 3;
  if (config.hasPlaylistIndicator) score += 4;
  score += Math.floor(Math.random() * 6);
  score = Math.min(score, 100);
  const grade = score >= 85 ? 'S' : score >= 75 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D';
  return { success: true, data: { totalScore: score, grade,
    breakdown: { contrast: { score: Math.floor(score * 0.25), max: 25, label: '배경 대비' }, readability: { score: Math.floor(score * 0.28), max: 25, label: '텍스트 가독성' }, emotion: { score: Math.floor(score * 0.24), max: 25, label: '감정 자극 요소' }, style: { score: Math.floor(score * 0.23), max: 25, label: '스타일 적합도' } },
    recommendations: score >= 75 ? ['훌륭한 썸네일입니다!'] : ['배경과 텍스트의 대비를 높여보세요.'] } };
}

export async function saveThumbnail(data) {
  if (isElectron) return window.louverAPI.saveThumbnail(data);
  const link = document.createElement('a');
  link.download = data.filename || 'thumbnail.png';
  link.href = data.dataUrl;
  link.click();
  return { success: true };
}

export function analyzeKeywordMood(keyword) {
  return analyzeMoodFromText(keyword);
}
