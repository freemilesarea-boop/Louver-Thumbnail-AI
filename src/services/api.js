/**
 * API Bridge
 * - Pexels API integration for keyword-relevant image search
 * - YouTube thumbnail extraction for playlist mode
 * - Picsum fallback when no API key
 * - IPC bridge for Electron mode
 */

const isElectron = typeof window !== 'undefined' && window.louverAPI;

// ─── Pexels API ──────────────────────────────────────────────

const PEXELS_BASE = 'https://api.pexels.com/v1';

/**
 * Mood → Pexels 검색 쿼리 매핑
 * 키워드와 조합하여 관련성 높은 이미지 검색
 */
const MOOD_SEARCH_QUERIES = {
  calm:      ['ocean calm', 'peaceful sky', 'serene nature', 'soft light', 'quiet lake', 'gentle waves'],
  energetic: ['neon lights', 'concert stage', 'colorful abstract', 'festival crowd', 'vibrant city', 'party lights'],
  emotional: ['rainy night', 'moody sky', 'dark clouds', 'lonely road', 'starry night', 'foggy morning'],
  cozy:      ['coffee shop', 'warm interior', 'autumn cozy', 'candle light', 'bookshelf cafe', 'warm blanket'],
  dark:      ['night city', 'neon urban', 'dark skyline', 'cyberpunk', 'night street', 'dark aesthetic'],
  nature:    ['forest light', 'mountain landscape', 'ocean waves', 'green forest', 'sunset mountain', 'tropical beach'],
  romantic:  ['sunset love', 'pink flowers', 'golden hour', 'cherry blossom', 'rose garden', 'romantic sunset'],
  classical: ['piano music', 'concert hall', 'elegant interior', 'vintage library', 'marble architecture', 'chandelier'],
};

/**
 * Pexels API로 이미지 검색
 * @param {string} query - 검색 키워드
 * @param {string} apiKey - Pexels API 키
 * @param {number} count - 요청 이미지 수
 * @returns {string[]} 이미지 URL 배열
 */
async function searchPexelsImages(query, apiKey, count = 6) {
  console.log(`[Pexels API] Searching: "${query}" (count: ${count})`);

  const url = `${PEXELS_BASE}/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&size=large`;

  const response = await fetch(url, {
    headers: { Authorization: apiKey },
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 401) throw new Error('Pexels API 키가 유효하지 않습니다.');
    if (status === 429) throw new Error('Pexels API 요청 한도 초과. 잠시 후 다시 시도하세요.');
    throw new Error(`Pexels API 오류: HTTP ${status}`);
  }

  const data = await response.json();
  const urls = (data.photos || []).map((photo) => photo.src.landscape);

  console.log(`[Pexels API] ✓ ${urls.length}개 이미지 반환`);
  urls.forEach((u, i) => console.log(`  [${i}] ${u}`));

  return urls;
}

/**
 * Pexels API 키 유효성 검증
 */
export async function testPexelsApiKey(apiKey) {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: 'API 키를 입력해주세요.' };
  }

  try {
    const response = await fetch(`${PEXELS_BASE}/search?query=test&per_page=1`, {
      headers: { Authorization: apiKey.trim() },
    });

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'API 키가 유효하지 않습니다.' };
    } else {
      return { valid: false, error: `HTTP ${response.status}` };
    }
  } catch (err) {
    return { valid: false, error: `연결 실패: ${err.message}` };
  }
}

// ─── Image URL Generation ────────────────────────────────────

/**
 * 키워드 기반 이미지 URL 생성
 * 1순위: Pexels API (키가 있을 때)
 * 2순위: Picsum fallback (키 없을 때)
 */
export async function getImageUrlsForKeyword(keyword, mood, count = 6, apiKey = '') {
  // Pexels API 사용 (키가 있을 때)
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const queries = MOOD_SEARCH_QUERIES[mood] || MOOD_SEARCH_QUERIES.calm;
      // 키워드 + 무드 쿼리 조합
      const searchQuery = `${keyword} ${queries[0]}`;
      const urls = await searchPexelsImages(searchQuery, apiKey.trim(), count);

      if (urls.length > 0) {
        return { urls, source: 'pexels' };
      }
    } catch (err) {
      console.warn(`[API] Pexels API 실패: ${err.message}, fallback 사용`);
    }
  }

  // Fallback: picsum.photos
  console.log('[API] Pexels API 키 없음 → picsum.photos fallback 사용');
  const FALLBACK_IDS = {
    calm:      [10, 15, 20, 54, 106, 164, 173, 319, 396, 491],
    energetic: [96, 250, 305, 399, 452, 593, 669, 698, 804, 688],
    emotional: [1, 65, 110, 119, 135, 244, 407, 493, 517, 658],
    cozy:      [29, 30, 225, 312, 425, 431, 436, 511, 574, 755],
    dark:      [42, 90, 142, 155, 370, 501, 547, 590, 638, 724],
    nature:    [10, 15, 16, 28, 29, 100, 180, 353, 401, 433],
    romantic:  [82, 102, 119, 176, 326, 374, 449, 486, 579, 646],
    classical: [24, 36, 48, 342, 366, 395, 421, 453, 532, 620],
  };

  const ids = FALLBACK_IDS[mood] || FALLBACK_IDS.calm;
  const urls = [];
  for (let i = 0; i < count; i++) {
    urls.push(`https://picsum.photos/id/${ids[i % ids.length]}/1280/720`);
  }

  return { urls, source: 'picsum-fallback' };
}

/**
 * 플레이리스트에서 YouTube 썸네일 URL 추출
 */
export function getImageUrlsFromPlaylist(playlistData, count = 6) {
  const items = playlistData?.items || [];
  if (items.length === 0) {
    console.warn('[API] 플레이리스트 항목 없음');
    return { urls: [], source: 'none' };
  }

  const urls = [];
  for (let i = 0; i < count; i++) {
    const item = items[i % items.length];
    if (item.videoId) {
      urls.push(`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`);
    } else if (item.thumbnailUrl) {
      urls.push(item.thumbnailUrl);
    }
  }

  console.log(`[API] YouTube 썸네일 ${urls.length}개 추출`);
  return { urls, source: 'youtube' };
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
    title: ['Midnight City - M83', 'Blinding Lights', 'After Hours', 'Levitating', 'Stay', 'Heat Waves', 'Watermelon Sugar', 'Peaches'][i],
    artist: ['M83', 'The Weeknd', 'The Weeknd', 'Dua Lipa', 'The Kid LAROI', 'Glass Animals', 'Harry Styles', 'Justin Bieber'][i],
    duration: '3:30',
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  })),
  url: 'https://www.youtube.com/playlist?list=PLmock123',
};

const MOCK_THUMBNAILS = {
  all: MOCK_PLAYLIST.items.map((item) => ({
    videoId: item.videoId, title: item.title, artist: item.artist, thumbnailUrl: item.thumbnailUrl,
  })),
  representatives: [
    { ...MOCK_PLAYLIST.items[0], reason: '재생목록 첫 번째 트랙' },
    { ...MOCK_PLAYLIST.items[3], reason: '재생목록 중간 트랙 (핵심 무드)' },
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
    for (const keyword of keywords) {
      if (lower.includes(keyword)) scores[mood] += 1;
    }
  }

  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0);

  const primaryMood = sorted.length > 0 ? sorted[0][0] : 'calm';

  return {
    primaryMood,
    moodLabel: MOOD_LABELS[primaryMood],
    allMoods: (sorted.length > 0 ? sorted : [['calm', 1]]).slice(0, 3).map(([mood, score]) => ({
      mood, score, label: MOOD_LABELS[mood],
    })),
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
  await new Promise((r) => setTimeout(r, 600));

  const text = [
    data.playlistData?.title || '',
    data.playlistData?.description || '',
    ...(data.playlistData?.items || []).map((i) => i.title),
  ].join(' ');

  return {
    success: true,
    data: { ...analyzeMoodFromText(text), playlistTitle: data.playlistData?.title, trackCount: (data.playlistData?.items || []).length },
  };
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

  let grade;
  if (score >= 85) grade = 'S';
  else if (score >= 75) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else grade = 'D';

  return {
    success: true,
    data: {
      totalScore: score, grade,
      breakdown: {
        contrast: { score: Math.floor(score * 0.25), max: 25, label: '배경 대비' },
        readability: { score: Math.floor(score * 0.28), max: 25, label: '텍스트 가독성' },
        emotion: { score: Math.floor(score * 0.24), max: 25, label: '감정 자극 요소' },
        style: { score: Math.floor(score * 0.23), max: 25, label: '스타일 적합도' },
      },
      recommendations: score >= 75
        ? ['훌륭한 썸네일입니다! 높은 CTR이 예상됩니다.']
        : ['배경과 텍스트의 대비를 높여보세요.'],
    },
  };
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
