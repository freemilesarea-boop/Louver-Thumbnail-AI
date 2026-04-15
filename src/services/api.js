/**
 * API Bridge - IPC communication layer
 * Handles communication between renderer and main process
 * Falls back to mock data when running in browser (dev without Electron)
 *
 * v2: Added real image sourcing (Picsum for keywords, YouTube for playlists)
 */

const isElectron = typeof window !== 'undefined' && window.louverAPI;

// ─── Image Sourcing ──────────────────────────────────────────

/**
 * Curated picsum.photos image IDs per mood.
 * Using /id/{number}/1280/720 format → NO redirects, direct image serving.
 * Each ID has been selected to visually match the mood category.
 */
const MOOD_IMAGE_IDS = {
  calm:      [10, 15, 20, 54, 106, 164, 173, 240, 319, 396],
  energetic: [96, 250, 305, 399, 452, 688, 593, 669, 698, 804],
  emotional: [1, 65, 110, 119, 135, 244, 407, 493, 517, 658],
  cozy:      [29, 30, 225, 312, 425, 431, 436, 511, 574, 755],
  dark:      [42, 90, 142, 155, 370, 501, 547, 590, 638, 724],
  nature:    [10, 15, 16, 28, 29, 100, 180, 353, 401, 433],
  romantic:  [82, 102, 119, 176, 326, 374, 449, 486, 579, 646],
  classical: [24, 36, 48, 342, 366, 395, 421, 453, 532, 620],
};

/**
 * Get image URLs for keyword-based thumbnail generation.
 * Uses picsum.photos /id/ endpoint (direct access, no redirects).
 * These URLs:
 *  - Serve CORS headers (Access-Control-Allow-Origin: *)
 *  - Return images directly (no 302 redirect)
 *  - Consistent results per ID
 */
function getImageUrlsForKeyword(keyword, mood, count = 6) {
  const ids = MOOD_IMAGE_IDS[mood] || MOOD_IMAGE_IDS.calm;
  const urls = [];

  for (let i = 0; i < count; i++) {
    const id = ids[i % ids.length];
    urls.push(`https://picsum.photos/id/${id}/1280/720`);
  }

  console.log(`[API] Image URLs for keyword "${keyword}" (mood: ${mood}):`);
  urls.forEach((url, i) => console.log(`  [${i}] ${url}`));

  return urls;
}

/**
 * Extract image URLs from playlist data (YouTube thumbnails)
 * YouTube thumbnails from i.ytimg.com support CORS
 */
function getImageUrlsFromPlaylist(playlistData, count = 6) {
  const items = playlistData?.items || [];
  if (items.length === 0) {
    console.warn('[API] No playlist items found for image extraction');
    return [];
  }

  const urls = [];
  for (let i = 0; i < Math.min(count, items.length); i++) {
    const item = items[i % items.length];
    const videoId = item.videoId;
    if (videoId && videoId !== 'mock') {
      // Try hqdefault (always available, 480x360)
      urls.push(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
    } else if (item.thumbnailUrl && item.thumbnailUrl.length > 0) {
      urls.push(item.thumbnailUrl);
    }
  }

  // If we couldn't get enough from playlist, pad with early items
  while (urls.length < count && items.length > 0) {
    const item = items[urls.length % items.length];
    if (item.videoId) {
      urls.push(`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`);
    }
  }

  console.log(`[API] Extracted ${urls.length} YouTube thumbnail URLs from playlist`);
  urls.forEach((url, i) => console.log(`  [${i}] ${url}`));

  return urls;
}

// ─── Mock Data ──────────────────────────────────────────────

// Use real YouTube video IDs for mock data so thumbnails actually load
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
  items: [
    { videoId: MOCK_VIDEO_IDS[0], title: 'Midnight City - M83', artist: 'M83', duration: '4:03', thumbnailUrl: `https://i.ytimg.com/vi/${MOCK_VIDEO_IDS[0]}/hqdefault.jpg` },
    { videoId: MOCK_VIDEO_IDS[1], title: 'Blinding Lights - The Weeknd', artist: 'The Weeknd', duration: '3:20', thumbnailUrl: `https://i.ytimg.com/vi/${MOCK_VIDEO_IDS[1]}/hqdefault.jpg` },
    { videoId: MOCK_VIDEO_IDS[2], title: 'After Hours - The Weeknd', artist: 'The Weeknd', duration: '6:01', thumbnailUrl: `https://i.ytimg.com/vi/${MOCK_VIDEO_IDS[2]}/hqdefault.jpg` },
    { videoId: MOCK_VIDEO_IDS[3], title: 'Levitating - Dua Lipa', artist: 'Dua Lipa', duration: '3:23', thumbnailUrl: `https://i.ytimg.com/vi/${MOCK_VIDEO_IDS[3]}/hqdefault.jpg` },
    { videoId: MOCK_VIDEO_IDS[4], title: 'Stay - The Kid LAROI', artist: 'The Kid LAROI', duration: '2:21', thumbnailUrl: `https://i.ytimg.com/vi/${MOCK_VIDEO_IDS[4]}/hqdefault.jpg` },
    { videoId: MOCK_VIDEO_IDS[5], title: 'Heat Waves - Glass Animals', artist: 'Glass Animals', duration: '3:58', thumbnailUrl: `https://i.ytimg.com/vi/${MOCK_VIDEO_IDS[5]}/hqdefault.jpg` },
    { videoId: MOCK_VIDEO_IDS[6], title: 'Watermelon Sugar - Harry Styles', artist: 'Harry Styles', duration: '2:54', thumbnailUrl: `https://i.ytimg.com/vi/${MOCK_VIDEO_IDS[6]}/hqdefault.jpg` },
    { videoId: MOCK_VIDEO_IDS[7], title: 'Peaches - Justin Bieber', artist: 'Justin Bieber', duration: '3:18', thumbnailUrl: `https://i.ytimg.com/vi/${MOCK_VIDEO_IDS[7]}/hqdefault.jpg` },
  ],
  url: 'https://www.youtube.com/playlist?list=PLmock123',
};

const MOCK_THUMBNAILS = {
  all: MOCK_PLAYLIST.items.map((item) => ({
    videoId: item.videoId,
    title: item.title,
    artist: item.artist,
    thumbnailUrl: item.thumbnailUrl,
  })),
  representatives: [
    { ...MOCK_PLAYLIST.items[0], reason: '재생목록 첫 번째 트랙' },
    { ...MOCK_PLAYLIST.items[3], reason: '재생목록 중간 트랙 (핵심 무드)' },
    { ...MOCK_PLAYLIST.items[7], reason: '재생목록 마지막 트랙' },
    { ...MOCK_PLAYLIST.items[1], reason: '추가 대표 후보' },
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
  calm: '잔잔한 / 편안한',
  energetic: '에너지틱 / 신나는',
  emotional: '감성적 / 새벽 감성',
  cozy: '아늑한 / 카페 감성',
  dark: '다크 / 도시적',
  nature: '자연 / 힐링',
  romantic: '로맨틱 / 사랑',
  classical: '클래식 / 우아한',
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
  calm: ['#E0F7FA', '#B2EBF2'],
  energetic: ['#FF6B6B', '#FFE66D'],
  emotional: ['#667EEA', '#764BA2'],
  cozy: ['#F6D365', '#FDA085'],
  dark: ['#0F0C29', '#302B63'],
  nature: ['#56AB2F', '#A8E063'],
  romantic: ['#FF9A9E', '#FAD0C4'],
  classical: ['#F5F0E8', '#D4C4A8'],
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
  if (isElectron) {
    return window.louverAPI.parsePlaylist(url);
  }
  await new Promise((r) => setTimeout(r, 1200));
  return { success: true, data: MOCK_PLAYLIST };
}

export async function collectThumbnails(playlistData) {
  if (isElectron) {
    return window.louverAPI.collectThumbnails(playlistData);
  }
  await new Promise((r) => setTimeout(r, 800));
  return { success: true, data: MOCK_THUMBNAILS };
}

export async function analyzeMood(data) {
  if (isElectron) {
    return window.louverAPI.analyzeMood(data);
  }
  await new Promise((r) => setTimeout(r, 600));

  const text = [
    data.playlistData?.title || '',
    data.playlistData?.description || '',
    ...(data.playlistData?.items || []).map((i) => i.title),
  ].join(' ');

  const moodResult = analyzeMoodFromText(text);
  return {
    success: true,
    data: {
      ...moodResult,
      playlistTitle: data.playlistData?.title,
      trackCount: (data.playlistData?.items || []).length,
    },
  };
}

export async function scoreThumbnail(config) {
  if (isElectron) {
    return window.louverAPI.scoreThumbnail(config);
  }

  let score = 50;
  if (config.hasImage) score += 12; // Image-based thumbnails score higher
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
      totalScore: score,
      grade,
      breakdown: {
        contrast: { score: Math.floor(score * 0.25), max: 25, label: '배경 대비' },
        readability: { score: Math.floor(score * 0.28), max: 25, label: '텍스트 가독성' },
        emotion: { score: Math.floor(score * 0.24), max: 25, label: '감정 자극 요소' },
        style: { score: Math.floor(score * 0.23), max: 25, label: '스타일 적합도' },
      },
      recommendations: score >= 75
        ? ['훌륭한 썸네일입니다! 높은 CTR이 예상됩니다.']
        : ['배경과 텍스트의 대비를 높여보세요.', '플레이리스트 분위기에 맞는 이미지를 추가해보세요.'],
    },
  };
}

export async function saveThumbnail(data) {
  if (isElectron) {
    return window.louverAPI.saveThumbnail(data);
  }
  const link = document.createElement('a');
  link.download = data.filename || 'thumbnail.png';
  link.href = data.dataUrl;
  link.click();
  return { success: true };
}

export function analyzeKeywordMood(keyword) {
  return analyzeMoodFromText(keyword);
}

export { getImageUrlsForKeyword, getImageUrlsFromPlaylist };
